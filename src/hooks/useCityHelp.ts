import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

/**
 * Phase 4: Fix Toledo, Toledo Needs You, and the Opportunity Engine.
 *
 * Two privacy rules hold throughout, and the database enforces them:
 * an issue is public but who reported it is not, and a resident profile
 * (income band, veteran status, children) is readable only by its owner.
 * Nothing here takes a user id; every scoped call reads `auth.uid()`.
 */

export type Issue = Database['public']['Tables']['issues']['Row'];
export type Opportunity = Database['public']['Tables']['opportunities']['Row'];
export type ResidentProfile = Database['public']['Tables']['resident_profiles']['Row'];

export const ISSUE_KINDS = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'dumping', label: 'Dumping' },
  { value: 'sign', label: 'Sign' },
  { value: 'tree', label: 'Tree' },
  { value: 'sidewalk', label: 'Sidewalk' },
  { value: 'property', label: 'Property' },
  { value: 'community', label: 'Community project' },
] as const;

/** In order. A report moves left to right, or stops at declined. */
export const ISSUE_STATUSES = ['reported', 'assigned', 'scheduled', 'completed'] as const;

export interface OpportunityMatch {
  id: string;
  title: string;
  provider: string | null;
  category: string | null;
  description: string | null;
  url: string | null;
  phone: string | null;
  deadline: string | null;
  life_events: string[];
  eligibility: Record<string, unknown>;
  provenance: Record<string, unknown>;
  /** Which of your own facts this matched on. Empty when it matched nothing specific. */
  matched_on: string[];
  /** True when you have not filled in a profile, so this is everything rather than a match. */
  missing_info: boolean;
}

export interface LifeEvent {
  key: string;
  label: string;
  categories: string[];
  steps: string[];
}

/** Issues, optionally only the ones neighbours can help with. */
export function useIssues(opts: { isGovernment?: boolean } = {}) {
  return useQuery({
    queryKey: ['issues', opts.isGovernment ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (opts.isGovernment !== undefined) query = query.eq('is_government', opts.isGovernment);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Issue[];
    },
  });
}

export function useIssue(id?: string) {
  return useQuery({
    queryKey: ['issue', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data as Issue | null;
    },
  });
}

/** The ids of issues you reported. Nobody can ask this about anyone else. */
export function useMyReportedIssueIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-reported-issues', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_reported_issues');
      if (error) throw error;
      return new Set((data ?? []) as string[]);
    },
  });
}

export interface ReportInput {
  kind: string;
  title: string;
  description?: string;
  photoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  neighborhoodId?: string | null;
  isGovernment?: boolean;
  needs?: Record<string, number>;
}

export function useReportIssue() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ReportInput) => {
      const { data, error } = await supabase.rpc('report_issue', {
        p_kind: input.kind,
        p_title: input.title,
        p_description: input.description ?? undefined,
        p_photo_url: input.photoUrl ?? undefined,
        p_lat: input.lat ?? undefined,
        p_lng: input.lng ?? undefined,
        p_neighborhood_id: input.neighborhoodId ?? undefined,
        p_is_government: input.isGovernment ?? true,
        p_needs: input.needs ?? {},
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['my-reported-issues', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
    },
  });
}

export function usePledge() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      issueId: string;
      kind: 'money' | 'hours' | 'materials';
      amount: number;
      note?: string;
    }) => {
      const { error } = await supabase.rpc('pledge_to_issue', {
        p_issue_id: input.issueId,
        p_kind: input.kind,
        p_amount: input.amount,
        p_note: input.note ?? undefined,
      });
      if (error) throw error;
    },
    onSuccess: (_r, input) => {
      queryClient.invalidateQueries({ queryKey: ['issue', input.issueId] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

/** What you may qualify for. A blank profile still returns everything. */
export function useOpportunityMatches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['opportunity-matches', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('match_opportunities', { p_limit: 100 });
      if (error) throw error;
      return (data ?? []) as OpportunityMatch[];
    },
  });
}

export function useResidentProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['resident-profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resident_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as ResidentProfile | null;
    },
  });
}

export function useSaveResidentProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.rpc('save_resident_profile', {
        p_patch: patch as Database['public']['Tables']['app_settings']['Row']['value'],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resident-profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunity-matches', user?.id] });
    },
  });
}

/** The 18 life events and their checklists, editable in app_settings. */
export function useLifeEvents() {
  return useQuery({
    queryKey: ['life-events'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'life_events')
        .maybeSingle();
      if (error) throw error;
      const value = (data?.value ?? {}) as { events?: LifeEvent[]; note?: string };
      return { events: value.events ?? [], note: value.note ?? null };
    },
  });
}

/** True when nobody has confirmed this opportunity's link yet. */
export function isUnverified(o: Pick<OpportunityMatch, 'provenance'>): boolean {
  return (o.provenance as { url_verified?: boolean } | null)?.url_verified === false;
}
