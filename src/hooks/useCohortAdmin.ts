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

export interface CohortInviteRow {
  id: string;
  token: string;
  single_use: boolean;
  uses_remaining: number | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export type InviteState = 'unused' | 'used' | 'expired' | 'revoked';

export function inviteState(inv: CohortInviteRow): InviteState {
  if (inv.revoked_at) return 'revoked';
  if (inv.expires_at && new Date(inv.expires_at).getTime() < Date.now()) return 'expired';
  if (inv.uses_remaining !== null && inv.uses_remaining <= 0) return 'used';
  return 'unused';
}

export function useCohortInvites(cohortId?: string) {
  return useQuery({
    queryKey: ['admin-cohort-invites', cohortId],
    enabled: !!cohortId,
    queryFn: async (): Promise<CohortInviteRow[]> => {
      const { data, error } = await supabase
        .from('cohort_invites' as never)
        .select('id, token, single_use, uses_remaining, expires_at, revoked_at, created_at')
        .eq('cohort_id', cohortId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as CohortInviteRow[]) ?? [];
    },
  });
}

// 128 bits of CSPRNG entropy — the token is the only secret the QR carries; the
// cap/eligibility/single-use are all enforced server-side.
function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return 'c100_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface GeneratedToken {
  token: string;
}

export function useGenerateInvites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: {
      cohortId: string;
      createdBy: string | null;
      mode: 'batch' | 'rotating';
      count: number;
      uses: number;
    }): Promise<GeneratedToken[]> => {
      const rows =
        opts.mode === 'batch'
          ? Array.from({ length: Math.min(Math.max(opts.count, 1), 100) }, () => ({
              cohort_id: opts.cohortId,
              token: generateToken(),
              single_use: true,
              uses_remaining: 1,
              created_by: opts.createdBy,
            }))
          : [
              {
                cohort_id: opts.cohortId,
                token: generateToken(),
                single_use: false,
                uses_remaining: Math.max(opts.uses, 1),
                created_by: opts.createdBy,
              },
            ];
      const { error } = await supabase.from('cohort_invites' as never).insert(rows as never);
      if (error) throw error;
      return rows.map((r) => ({ token: r.token }));
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-cohort-invites', v.cohortId] });
    },
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId }: { inviteId: string; cohortId: string }) => {
      const { error } = await supabase.rpc('admin_revoke_invite' as never, {
        p_invite_id: inviteId,
      } as never);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['admin-cohort-invites', v.cohortId] });
    },
  });
}
