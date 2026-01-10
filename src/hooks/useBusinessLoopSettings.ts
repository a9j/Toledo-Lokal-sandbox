import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LoopTierId, LOOP_TIERS } from '@/lib/loop-tiers';

export interface BusinessLoopSettings {
  id: string;
  business_id: string;
  loop_tier_id: LoopTierId;
  is_active: boolean;
  points_issued_this_month: number;
  month_reset_at: string;
  stripe_subscription_id: string | null;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export function useBusinessLoopSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const settings = useQuery({
    queryKey: ['business-loop-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // First get user's business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (bizError || !business) return null;

      const { data, error } = await supabase
        .from('business_loop_settings')
        .select('*')
        .eq('business_id', business.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // If no settings exist, create default
      if (!data) {
        const { data: newSettings, error: createError } = await supabase
          .from('business_loop_settings')
          .insert({
            business_id: business.id,
            loop_tier_id: 'visible_only',
            is_active: false,
          })
          .select()
          .single();

        if (createError) throw createError;
        return newSettings as BusinessLoopSettings;
      }

      return data as BusinessLoopSettings;
    },
    enabled: !!user,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<BusinessLoopSettings>) => {
      if (!settings.data) throw new Error('No settings found');

      const { data, error } = await supabase
        .from('business_loop_settings')
        .update(updates)
        .eq('id', settings.data.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-loop-settings'] });
    },
  });

  const tierConfig = settings.data
    ? LOOP_TIERS[settings.data.loop_tier_id as LoopTierId] || LOOP_TIERS.visible_only
    : LOOP_TIERS.visible_only;

  const isLoopParticipant = settings.data?.is_active && settings.data?.loop_tier_id !== 'visible_only';

  const pointsRemaining = tierConfig.pointsCap - (settings.data?.points_issued_this_month || 0);

  return {
    settings: settings.data,
    tierConfig,
    isLoopParticipant,
    pointsRemaining,
    isLoading: settings.isLoading,
    updateSettings,
  };
}

export function useLoopParticipants() {
  return useQuery({
    queryKey: ['loop-participants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_loop_settings')
        .select(`
          *,
          business:businesses(id, name, logo_url, category:categories(name), neighborhood:neighborhoods(name))
        `)
        .eq('is_active', true)
        .neq('loop_tier_id', 'visible_only');

      if (error) throw error;
      return data;
    },
  });
}
