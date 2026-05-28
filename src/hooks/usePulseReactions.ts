import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PulseReactionType } from '@/lib/pulse-config';

// Map of post_id -> set of reaction types the current user has placed.
export type MyReactions = Record<string, PulseReactionType[]>;

export function useMyPulseReactions(postIds: string[]) {
  const { user } = useAuth();
  const key = [...postIds].sort().join(',');

  return useQuery<MyReactions>({
    queryKey: ['my-pulse-reactions', user?.id, key],
    queryFn: async () => {
      if (!user || postIds.length === 0) return {};
      const { data, error } = await (supabase.from('pulse_reactions' as any) as any)
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      if (error) throw error;
      const map: MyReactions = {};
      for (const row of (data || []) as { post_id: string; reaction_type: PulseReactionType }[]) {
        (map[row.post_id] ||= []).push(row.reaction_type);
      }
      return map;
    },
    enabled: !!user && postIds.length > 0,
  });
}

export function useTogglePulseReaction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      reactionType,
      active,
    }: {
      postId: string;
      reactionType: PulseReactionType;
      active: boolean;
    }) => {
      if (!user) throw new Error('Must be logged in');

      if (active) {
        const { error } = await (supabase.from('pulse_reactions' as any) as any)
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('pulse_reactions' as any) as any).insert({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-pulse-reactions'] });
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
    },
  });
}
