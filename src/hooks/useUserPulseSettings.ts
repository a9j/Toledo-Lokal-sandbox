import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserPulseSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-pulse-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('user_pulse_enabled, pulse_visibility')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data || { user_pulse_enabled: true, pulse_visibility: 'public' };
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: { user_pulse_enabled?: boolean; pulse_visibility?: string }) => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: user.id, ...updates },
          { onConflict: 'user_id' }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pulse-settings', user?.id] });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    updateSettings,
  };
}
