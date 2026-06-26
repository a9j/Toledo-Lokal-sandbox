import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Admin-side beta controls. Every write goes through a SECURITY DEFINER RPC or
// the send-beta-invite edge function, all of which re-check platform admin
// server-side — the UI gate is convenience, not the boundary.

export interface BetaSignupStats {
  total: number;
  apple: number;
  android: number;
  invited: number;
  active: number;
  removed: number;
}

export function useBetaSignupStats() {
  return useQuery({
    queryKey: ['admin-beta-signup-stats'],
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<BetaSignupStats> => {
      const { data, error } = await supabase.rpc('admin_beta_signup_stats' as never);
      if (error) throw error;
      return data as unknown as BetaSignupStats;
    },
  });
}

export interface BetaMemberRow {
  id: string;
  email: string;
  platform: 'apple' | 'android';
  status: 'invited' | 'active' | 'removed';
  invited_at: string | null;
  joined_at: string | null;
  has_account: boolean;
}

export function useBetaMembersAdmin() {
  return useQuery({
    queryKey: ['admin-beta-members'],
    queryFn: async (): Promise<BetaMemberRow[]> => {
      const { data, error } = await supabase.rpc('admin_beta_members' as never);
      if (error) throw error;
      return (data as unknown as BetaMemberRow[]) ?? [];
    },
  });
}

export function useBetaPhaseAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (phase: 'open_signup' | 'cohort_live') => {
      const { error } = await supabase.rpc('admin_set_beta_phase' as never, {
        p_phase: phase,
      } as never);
      if (error) throw error;
      return phase;
    },
    onSuccess: (phase) => {
      queryClient.invalidateQueries({ queryKey: ['beta-phase'] });
      toast({
        title: phase === 'cohort_live' ? 'Beta is now live' : 'Public signups reopened',
        description:
          phase === 'cohort_live'
            ? 'Public signups are closed. The Founding Beta cohort is active.'
            : 'The public signup page is accepting new entries again.',
      });
    },
    onError: () => toast({ variant: 'destructive', title: 'Could not change the beta phase' }),
  });
}

export function useBulkInvite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-beta-invite', {
        body: { mode: 'bulk' },
      });
      if (error) throw error;
      return data as { sent: number; failed: number; total: number };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-beta-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-beta-signup-stats'] });
      toast({
        title: 'Invites sent',
        description: `${res.sent} of ${res.total} emailed${res.failed ? `, ${res.failed} failed` : ''}.`,
      });
    },
    onError: () => toast({ variant: 'destructive', title: 'Bulk invite failed' }),
  });
}

export interface BackfillMatch {
  signup_email: string;
  platform: string;
  signup_created_at: string;
  matched_user_id: string;
  matched_user_email: string;
  current_status: string | null;
}

// Two-step safeguard. The report is a read-only dry run; apply is the explicit
// write. They are separate mutations so the UI can show the report and require
// a deliberate second action before anything is linked.
export function useBetaBackfillReport() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (): Promise<BackfillMatch[]> => {
      const { data, error } = await supabase.rpc('admin_beta_backfill_report' as never);
      if (error) throw error;
      return (data as unknown as BackfillMatch[]) ?? [];
    },
    onError: () => toast({ variant: 'destructive', title: 'Could not build the report' }),
  });
}

export function useBetaBackfillApply() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (): Promise<{ linked: number }> => {
      const { data, error } = await supabase.rpc('admin_beta_backfill_apply' as never);
      if (error) throw error;
      return data as unknown as { linked: number };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-beta-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-beta-signup-stats'] });
      toast({ title: 'Backfill applied', description: `${res.linked} member(s) linked.` });
    },
    onError: () => toast({ variant: 'destructive', title: 'Backfill failed' }),
  });
}

export function useAddBetaMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { email: string; platform: 'apple' | 'android' }) => {
      const { error } = await supabase.rpc('admin_beta_add_member' as never, {
        p_email: input.email,
        p_platform: input.platform,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-beta-members'] });
      toast({ title: 'Member added' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Could not add member' }),
  });
}

export function useRemoveBetaMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.rpc('admin_beta_remove_member' as never, {
        p_member_id: memberId,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-beta-members'] });
      toast({ title: 'Member removed' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Could not remove member' }),
  });
}

export function useRemoveBetaIdea() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (ideaId: string) => {
      const { error } = await supabase.rpc('admin_remove_beta_idea' as never, {
        p_idea_id: ideaId,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beta-ideas'] });
      toast({ title: 'Idea removed' });
    },
    onError: () => toast({ variant: 'destructive', title: 'Could not remove idea' }),
  });
}
