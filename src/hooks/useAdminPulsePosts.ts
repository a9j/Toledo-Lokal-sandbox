import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Admin/moderator view of Pulse posts: browse recent posts and hard-delete any
// of them. Relies on the "Moderators view/delete pulse posts" RLS policies
// (see 20260531000002_pulse_admin_moderation_policies.sql) — non-moderators
// simply get an empty list and failed deletes.

export interface AdminPulsePost {
  id: string;
  pulse_id: string | null;
  content: string | null;
  headline: string | null;
  content_type: string | null;
  status: string;
  neighborhood: string | null;
  author_type: string | null;
  created_at: string;
  expires_at: string;
  business?: { id: string; name: string } | null;
}

export function useAdminPulsePosts(filter: 'active' | 'all' = 'active') {
  return useQuery({
    queryKey: ['admin-pulse-posts', filter],
    queryFn: async (): Promise<AdminPulsePost[]> => {
      const base = supabase
        .from('pulse_posts')
        .select('id, pulse_id, content, headline, content_type, status, neighborhood, author_type, created_at, expires_at, business:businesses!business_id(id, name)')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data, error } = await (filter === 'active' ? base.eq('status', 'active') : base);
      if (error) throw error;
      return (data || []) as unknown as AdminPulsePost[];
    },
  });
}

export function useDeletePulsePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('pulse_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pulse-posts'] });
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-reports'] });
    },
  });
}
