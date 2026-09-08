import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

/**
 * Phase 5: what is being built, what used to be here, and one feed over both.
 *
 * Every read here is a database function that runs as the caller, so what comes
 * back is already filtered by the same row level rules the tables carry. None
 * of them takes a user id.
 */

export type Development = Database['public']['Tables']['developments']['Row'];
export type MemoryItem = Database['public']['Tables']['memory_items']['Row'];

export type DevelopmentStatus =
  | 'proposed'
  | 'under_review'
  | 'approved'
  | 'under_construction'
  | 'completed'
  | 'stalled'
  | 'cancelled';

/** In the order a project moves through them. Cancelled sits outside the line. */
export const DEVELOPMENT_STATUSES: { value: DevelopmentStatus; label: string }[] = [
  { value: 'proposed', label: 'Proposed' },
  { value: 'under_review', label: 'Under review' },
  { value: 'approved', label: 'Approved' },
  { value: 'under_construction', label: 'Being built' },
  { value: 'completed', label: 'Finished' },
  { value: 'stalled', label: 'On hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const DEVELOPMENT_KINDS: { value: string; label: string }[] = [
  { value: 'housing', label: 'Homes' },
  { value: 'retail', label: 'Shops' },
  { value: 'mixed_use', label: 'Mixed use' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'civic', label: 'Civic' },
  { value: 'park', label: 'Parks' },
  { value: 'infrastructure', label: 'Streets' },
];

export function developmentStatusLabel(status: string): string {
  return DEVELOPMENT_STATUSES.find((s) => s.value === status)?.label ?? status.replace(/_/g, ' ');
}

/** A row from development_radar. Flattened, with the point split out. */
export interface RadarRow {
  id: string;
  name: string;
  summary: string | null;
  developer: string | null;
  planning_case: string | null;
  kind: string | null;
  status: string;
  address: string | null;
  neighborhood_id: string | null;
  neighborhood_name: string | null;
  est_completion: string | null;
  investment_amount: number | null;
  documents: unknown;
  latitude: number | null;
  longitude: number | null;
  /** Miles from your home address, or null when you have not set one. */
  distance_miles: number | null;
  entity_id: string | null;
  updated_at: string;
}

export interface FeedItem {
  item_id: string;
  /** change, event, pulse or signal. */
  source: string;
  kind: string | null;
  title: string | null;
  body: string | null;
  occurred_at: string;
  neighborhood_id: string | null;
  neighborhood_name: string | null;
  entity_id: string | null;
  source_table: string | null;
  source_id: string | null;
  image_url: string | null;
  distance_miles: number | null;
}

export type FeedScope = 'city' | 'neighborhood' | 'mile' | 'following';

export interface ChangeCount {
  event_type: string;
  change_count: number;
  latest_title: string | null;
  latest_at: string;
}

export interface EntityMemory {
  id: string;
  year: number | null;
  kind: string;
  title: string;
  body: string | null;
  media_url: string | null;
  contributor: string | null;
  created_at: string;
}

/** Development Radar and Around Me both read this. */
export function useDevelopmentRadar(opts: {
  statuses?: string[];
  kinds?: string[];
  radiusMiles?: number | null;
} = {}) {
  const { statuses, kinds, radiusMiles } = opts;
  return useQuery({
    queryKey: ['development-radar', statuses ?? null, kinds ?? null, radiusMiles ?? null],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('development_radar', {
        p_statuses: statuses?.length ? statuses : undefined,
        p_kinds: kinds?.length ? kinds : undefined,
        p_radius_miles: radiusMiles ?? undefined,
      });
      if (error) throw error;
      return (data ?? []) as RadarRow[];
    },
  });
}

export function useDevelopment(id?: string) {
  return useQuery({
    queryKey: ['development', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developments')
        .select('*')
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data as Development | null;
    },
  });
}

/** The merged City Pulse feed. Scope decides how much of the city you see. */
export function useCityFeed(
  scope: FeedScope,
  opts: { neighborhoodId?: string | null; radiusMiles?: number; limit?: number } = {},
) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['city-feed', scope, opts.neighborhoodId ?? null, opts.radiusMiles ?? 1, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('city_feed', {
        p_scope: scope,
        p_neighborhood_id: opts.neighborhoodId ?? undefined,
        p_radius_miles: opts.radiusMiles ?? 1,
        p_limit: opts.limit ?? 40,
      });
      if (error) throw error;
      return (data ?? []) as FeedItem[];
    },
  });
}

/** Counts by change type over a window. The Home tab strip reads this. */
export function useCityChanges(days = 7) {
  return useQuery({
    queryKey: ['city-changed-recently', days],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('city_changed_recently', { p_days: days });
      if (error) throw error;
      return (data ?? []) as ChangeCount[];
    },
  });
}

/** The approved memory timeline for one entity, oldest first. */
export function useEntityMemory(entityId?: string | null, limit = 50) {
  return useQuery({
    queryKey: ['entity-memory', entityId, limit],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('entity_memory', {
        p_entity_id: entityId as string,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as EntityMemory[];
    },
  });
}

export interface MemoryInput {
  entityId: string;
  kind: 'photo' | 'story' | 'clipping';
  title: string;
  year?: number | null;
  body?: string;
  mediaUrl?: string | null;
}

/**
 * Submit a memory. It is written unapproved on purpose: nothing reaches the
 * public timeline until a person has looked at it, and the database refuses an
 * insert that tries to set approved itself.
 */
export function useAddMemory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: MemoryInput) => {
      if (!user) throw new Error('Sign in to add a memory.');
      const { error } = await supabase.from('memory_items').insert({
        entity_id: input.entityId,
        kind: input.kind,
        title: input.title,
        year: input.year ?? null,
        body: input.body ?? null,
        media_url: input.mediaUrl ?? null,
        contributor_id: user.id,
        approved: false,
      });
      if (error) throw error;
    },
    onSuccess: (_r, input) => {
      queryClient.invalidateQueries({ queryKey: ['entity-memory', input.entityId] });
    },
  });
}
