import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          category:categories(name, icon)
        `)
        .eq('status', 'active')
        .order('featured', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useChallengeProgress(challengeId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['challenge-progress', challengeId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('challenge_progress')
        .select(`
          *,
          business:businesses(id, name, logo_url)
        `)
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!challengeId,
  });
}

export function useUserBadges() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          challenge:challenges(title, badge_icon, badge_color)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useTrackVisit() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ challengeId, businessId }: { challengeId: string; businessId: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('challenge_progress')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          business_id: businessId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['challenge-progress', variables.challengeId] });
    },
  });
}
