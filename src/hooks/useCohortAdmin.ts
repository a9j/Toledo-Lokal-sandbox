import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Admin-side cohort data + mutations. All privileged writes go through
// server-gated RPCs (can_manage_community / is_platform_admin) — these hooks are
// just the client surface. Cohort tables aren't in generated types yet → cast.

export interface AdminCohort {
  id: string;
  slug: string;
  name: string;
  mission: string | null;
  access_type: 'open' | 'closed';
  member_cap: number | null;
  status: 'forming' | 'active' | 'full' | 'archived';
}

export function useAdminCohorts() {
  return useQuery({
    queryKey: ['admin-cohorts'],
    queryFn: async (): Promise<AdminCohort[]> => {
      const { data, error } = await supabase
        .from('cohorts' as never)
        .select('id, slug, name, mission, access_type, member_cap, status')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as AdminCohort[]) ?? [];
    },
  });
}

export interface CohortMemberRow {
  profile_id: string;
  position: number;
  joined_at: string;
  name: string | null;
  email: string | null;
}

export function useCohortMembers(cohortId?: string) {
  return useQuery({
    queryKey: ['admin-cohort-members', cohortId],
    enabled: !!cohortId,
    queryFn: async (): Promise<CohortMemberRow[]> => {
      const { data, error } = await supabase
        .from('cohort_members' as never)
        .select('profile_id, position, joined_at, profiles(name, email)')
        .eq('cohort_id', cohortId as string)
        .order('position', { ascending: true });
      if (error) throw error;
      const rows = (data as unknown as {
        profile_id: string;
        position: number;
        joined_at: string;
        profiles?: { name?: string | null; email?: string | null };
      }[]) ?? [];
      return rows.map((r) => ({
        profile_id: r.profile_id,
        position: r.position,
        joined_at: r.joined_at,
        name: r.profiles?.name ?? null,
        email: r.profiles?.email ?? null,
      }));
    },
  });
}

export function useUpdateCohort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<AdminCohort> & { id: string }) => {
      const { id, ...fields } = patch;
      const { error } = await supabase
        .from('cohorts' as never)
        .update(fields as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-cohorts'] });
      qc.invalidateQueries({ queryKey: ['cohort'] });
    },
  });
}

export function useRemoveCohortMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cohortId, profileId }: { cohortId: string; profileId: string }) => {
      const { error } = await supabase.rpc('admin_remove_cohort_member' as never, {
        p_cohort_id: cohortId,
        p_profile_id: profileId,
      } as never);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-cohort-members', v.cohortId] });
      qc.invalidateQueries({ queryKey: ['cohort-seats'] });
      qc.invalidateQueries({ queryKey: ['admin-cohorts'] });
    },
  });
}
