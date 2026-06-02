import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PulseReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  note: string | null;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  reviewed_by: string | null;
  reviewed_at: string | null;
  moderator_note: string | null;
  created_at: string;
  post?: {
    id: string;
    content: string;
    content_type: string;
    neighborhood: string | null;
    status: string;
    author_type: string;
  } | null;
}

export function useReportPulsePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reason, note }: { postId: string; reason: string; note?: string }) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase.from('pulse_reports').insert({
        post_id: postId,
        reporter_id: user.id,
        reason,
        note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulse-reports'] });
    },
  });
}

// Moderation queue — visible to moderators/admins via RLS.
export function usePulseReportQueue(status: 'pending' | 'all' = 'pending') {
  return useQuery<PulseReport[]>({
    queryKey: ['pulse-reports', status],
    queryFn: async () => {
      let q = supabase
        .from('pulse_reports')
        .select('*, post:pulse_posts(id, content, content_type, neighborhood, status, author_type)')
        .order('created_at', { ascending: false });
      if (status === 'pending') q = q.eq('status', 'pending');
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PulseReport[];
    },
  });
}

export function useResolvePulseReport() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reportId,
      postId,
      action,
      note,
    }: {
      reportId: string;
      postId: string;
      action: 'dismiss' | 'remove';
      note?: string;
    }) => {
      const { error: reportError } = await supabase
        .from('pulse_reports')
        .update({
          status: action === 'remove' ? 'actioned' : 'dismissed',
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          moderator_note: note || null,
        })
        .eq('id', reportId);
      if (reportError) throw reportError;

      if (action === 'remove') {
        const { error: postError } = await supabase
          .from('pulse_posts')
          .update({ status: 'removed' })
          .eq('id', postId);
        if (postError) throw postError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulse-reports'] });
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
    },
  });
}
