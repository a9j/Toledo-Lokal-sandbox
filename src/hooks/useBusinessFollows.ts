import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * "Follow the Truck" (and any business). Tracks whether the current user follows
 * a business and the public follower count, plus follow/unfollow.
 */
export function useBusinessFollows(businessId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isFollowingQuery = useQuery({
    queryKey: ['business-follow', businessId, user?.id],
    enabled: !!businessId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_follows')
        .select('business_id')
        .eq('business_id', businessId as string)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const followerCountQuery = useQuery({
    queryKey: ['business-follower-count', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('business_follower_count', {
        _business_id: businessId as string,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['business-follow', businessId, user?.id] });
    queryClient.invalidateQueries({ queryKey: ['business-follower-count', businessId] });
  };

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business id');
      if (!user) throw new Error('Not signed in');

      if (isFollowingQuery.data) {
        const { error } = await supabase
          .from('business_follows')
          .delete()
          .eq('business_id', businessId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('business_follows')
          .insert({ business_id: businessId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
  });

  return {
    isFollowing: isFollowingQuery.data ?? false,
    followerCount: followerCountQuery.data ?? 0,
    isLoading: isFollowingQuery.isLoading || followerCountQuery.isLoading,
    toggleFollow,
  };
}
