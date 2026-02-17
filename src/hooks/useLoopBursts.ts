import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type BurstType = 'multiplier' | 'flat_bonus' | 'first_visit';

export interface LoopBurst {
  id: string;
  business_id: string;
  burst_type: BurstType;
  name: string;
  description: string | null;
  multiplier: number;
  bonus_points: number;
  starts_at: string;
  ends_at: string;
  recurrence: string | null;
  recurrence_days: number[];
  recurrence_start_time: string | null;
  recurrence_end_time: string | null;
  is_active: boolean;
  max_redemptions: number | null;
  total_redemptions: number;
  created_at: string;
  updated_at: string;
}

export function useBusinessBursts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bursts = useQuery({
    queryKey: ['business-loop-bursts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (!business) return [];

      const { data, error } = await supabase
        .from('loop_bursts')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as LoopBurst[];
    },
    enabled: !!user,
  });

  const createBurst = useMutation({
    mutationFn: async (burst: Omit<LoopBurst, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'total_redemptions'>) => {
      if (!user) throw new Error('Not logged in');

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (!business) throw new Error('No business found');

      const { data, error } = await supabase
        .from('loop_bursts')
        .insert({
          business_id: business.id,
          burst_type: burst.burst_type,
          name: burst.name,
          description: burst.description,
          multiplier: burst.multiplier,
          bonus_points: burst.bonus_points,
          starts_at: burst.starts_at,
          ends_at: burst.ends_at,
          recurrence: burst.recurrence,
          recurrence_days: burst.recurrence_days,
          recurrence_start_time: burst.recurrence_start_time,
          recurrence_end_time: burst.recurrence_end_time,
          is_active: burst.is_active,
          max_redemptions: burst.max_redemptions,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-loop-bursts'] });
    },
  });

  const updateBurst = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoopBurst> & { id: string }) => {
      const { data, error } = await supabase
        .from('loop_bursts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-loop-bursts'] });
    },
  });

  const deleteBurst = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loop_bursts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-loop-bursts'] });
    },
  });

  const activeBursts = (bursts.data || []).filter(
    b => b.is_active && new Date(b.ends_at) > new Date()
  );

  return {
    bursts: bursts.data || [],
    activeBursts,
    isLoading: bursts.isLoading,
    createBurst,
    updateBurst,
    deleteBurst,
  };
}

/**
 * Given a list of active bursts, determine which one applies (no stacking — most generous wins).
 * Returns the burst and the effective bonus points for a given base points value.
 */
export function getBestActiveBurst(
  bursts: LoopBurst[],
  basePoints: number,
  isFirstVisit: boolean
): { burst: LoopBurst | null; totalPoints: number; bonusPoints: number } {
  const now = new Date();

  const eligible = bursts.filter(b => {
    if (!b.is_active) return false;
    if (new Date(b.starts_at) > now || new Date(b.ends_at) < now) return false;
    if (b.max_redemptions && b.total_redemptions >= b.max_redemptions) return false;
    if (b.burst_type === 'first_visit' && !isFirstVisit) return false;
    return true;
  });

  if (eligible.length === 0) {
    return { burst: null, totalPoints: basePoints, bonusPoints: 0 };
  }

  // Calculate effective total for each burst and pick the most generous
  let best: { burst: LoopBurst; total: number; bonus: number } | null = null;

  for (const burst of eligible) {
    let total = basePoints;
    if (burst.burst_type === 'multiplier') {
      total = Math.round(basePoints * Number(burst.multiplier));
    } else if (burst.burst_type === 'flat_bonus') {
      total = basePoints + burst.bonus_points;
    } else if (burst.burst_type === 'first_visit') {
      total = basePoints + burst.bonus_points;
    }

    if (!best || total > best.total) {
      best = { burst, total, bonus: total - basePoints };
    }
  }

  return best
    ? { burst: best.burst, totalPoints: best.total, bonusPoints: best.bonus }
    : { burst: null, totalPoints: basePoints, bonusPoints: 0 };
}
