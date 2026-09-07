import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

/**
 * Phase 7: Autopilot, the Toledo API, plugins, neighborhood stats and the year
 * in review.
 *
 * Everything personal here is invoker-side and takes no user id: the digest,
 * the preferences, the keys and the year all read auth.uid() in the database.
 */

export type AutopilotPreferences =
  Database['public']['Tables']['autopilot_preferences']['Row'];

export interface DigestItem {
  log_id: string;
  entity_id: string;
  entity_name: string;
  source_table: string;
  source_id: string;
  event_type: string;
  topic: string;
  title: string;
  body: string | null;
  occurred_at: string;
  distance_miles: number | null;
  score: number;
  /** Why this made the cut, in the same words the UI shows. */
  reason: string;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  rate_limit_per_hour: number;
  active: boolean;
  created_at: string;
  last_used_at: string | null;
  calls_last_hour: number;
  calls_total: number;
}

export interface PluginAction {
  key: string;
  title: string;
  kind: 'deep_link' | 'internal_route' | 'rpc';
  target?: string;
  description?: string;
  params?: string[];
}

export interface PluginScreen {
  key: string;
  title: string;
  route?: string;
}

export interface PluginRow {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  org_entity: string | null;
  org_name: string | null;
  manifest: { screens?: PluginScreen[]; actions?: PluginAction[] } | null;
}

export interface NeighborhoodStats {
  neighborhood_id: string;
  neighborhood_name: string;
  businesses: number;
  nonprofits: number;
  jobs_open: number;
  events_upcoming: number;
  developments: number;
  under_construction: number;
  spaces_available: number;
  issues_open: number;
  issues_completed: number;
  memories: number;
  changes_30d: number;
  parcels: number;
}

export interface ToledoYear {
  year: number;
  follows: number;
  following_now: number;
  checkins: number;
  issues_reported: number;
  memories_added: number;
  inbox_items: number;
  neighborhoods_followed: number;
  top_kinds: { kind: string; count: number }[];
}

/** What Autopilot would send you right now, and why. */
export function useAutopilotDigest(limit = 3, days = 7) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['autopilot-digest', limit, days, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('autopilot_digest', {
        p_limit: limit,
        p_days: days,
      });
      if (error) throw error;
      return (data ?? []) as DigestItem[];
    },
  });
}

export function useAutopilotPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['autopilot-preferences', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autopilot_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as AutopilotPreferences | null;
    },
  });
}

export function useAutopilotTopics() {
  return useQuery({
    queryKey: ['autopilot-topics'],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('autopilot_topics');
      if (error) throw error;
      return (data ?? []) as { topic: string; label: string }[];
    },
  });
}

export function useSaveAutopilotPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.rpc('save_autopilot_preferences', {
        p_patch: patch as Database['public']['Tables']['app_settings']['Row']['value'],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autopilot-preferences', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['autopilot-digest'] });
    },
  });
}

export function useApiKeys() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['api-keys', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_api_keys');
      if (error) throw error;
      return (data ?? []) as ApiKeyRow[];
    },
  });
}

/**
 * Issue a key.
 *
 * The plaintext comes back exactly once and is never stored anywhere but the
 * caller's screen, so the UI has to show it immediately and say so.
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { name: string; rateLimit?: number }) => {
      const { data, error } = await supabase.rpc('create_api_key', {
        p_name: input.name,
        p_rate_limit: input.rateLimit ?? 1000,
      });
      if (error) throw error;
      const row = (data ?? [])[0] as { id: string; api_key: string; key_prefix: string } | undefined;
      if (!row) throw new Error('The key was not returned. Try again.');
      return row;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', user?.id] });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase.rpc('revoke_api_key', { p_key_id: keyId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys', user?.id] });
    },
  });
}

export function usePlugins() {
  return useQuery({
    queryKey: ['plugins'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('published_plugins');
      if (error) throw error;
      return (data ?? []) as unknown as PluginRow[];
    },
  });
}

export function useNeighborhoodStats(neighborhoodId?: string | null) {
  return useQuery({
    queryKey: ['neighborhood-stats', neighborhoodId ?? 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('neighborhood_stats', {
        p_neighborhood_id: neighborhoodId ?? undefined,
      });
      if (error) throw error;
      return (data ?? []) as NeighborhoodStats[];
    },
  });
}

export function useToledoYear(year?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['toledo-year', year ?? 'current', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_toledo_year', {
        p_year: year ?? undefined,
      });
      if (error) throw error;
      return data as unknown as ToledoYear;
    },
  });
}
