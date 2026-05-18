import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LoopReward {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  category: 'perk' | 'experience' | 'service_credit';
  points_cost: number;
  quantity_available: number | null;
  quantity_redeemed: number;
  is_active: boolean;
  daily_limit: number | null;
  monthly_limit: number | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    neighborhood?: {
      name: string;
    };
  };
}

export function useLoopRewards(options?: { businessId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['loop-rewards', options],
    queryFn: async () => {
      let query = supabase
        .from('loop_rewards')
        .select(`
          *,
          business:businesses(id, name, logo_url, neighborhood:neighborhoods(name))
        `)
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (options?.businessId) {
        query = query.eq('business_id', options.businessId);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LoopReward[];
    },
  });
}

export function useBusinessRewards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const rewards = useQuery({
    queryKey: ['business-loop-rewards', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get user's business
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (bizError || !business) return [];

      const { data, error } = await supabase
        .from('loop_rewards')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LoopReward[];
    },
    enabled: !!user,
  });

  const createReward = useMutation({
    mutationFn: async (reward: Omit<LoopReward, 'id' | 'business_id' | 'created_at' | 'quantity_redeemed'>) => {
      if (!user) throw new Error('Not logged in');

      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (bizError || !business) throw new Error('No business found');

      const { data, error } = await supabase
        .from('loop_rewards')
        .insert({
          name: reward.name,
          description: reward.description,
          category: reward.category,
          points_cost: reward.points_cost,
          quantity_available: reward.quantity_available,
          is_active: reward.is_active,
          daily_limit: reward.daily_limit,
          monthly_limit: reward.monthly_limit,
          valid_from: reward.valid_from,
          valid_until: reward.valid_until,
          business_id: business.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-loop-rewards'] });
    },
  });

  const updateReward = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoopReward> & { id: string }) => {
      const { data, error } = await supabase
        .from('loop_rewards')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-loop-rewards'] });
    },
  });

  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loop_rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-loop-rewards'] });
    },
  });

  return {
    rewards: rewards.data || [],
    isLoading: rewards.isLoading,
    createReward,
    updateReward,
    deleteReward,
  };
}
