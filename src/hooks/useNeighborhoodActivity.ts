import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NeighborhoodActivity {
  neighborhood: string;
  activity_score: number;
  energy_level: 'quiet' | 'calm' | 'steady' | 'active' | 'buzzing';
  energy_emoji: string;
  label: string | null;
  computed_at: string;
}

// The city-energy layer — neighborhood activity computed from real platform
// signals (posts, saves, reactions). Surfaced throughout Pulse.
export function useNeighborhoodActivity() {
  return useQuery<NeighborhoodActivity[]>({
    queryKey: ['neighborhood-activity'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('neighborhood_activity' as any) as any)
        .select('*')
        .order('activity_score', { ascending: false });
      if (error) throw error;
      return (data || []) as NeighborhoodActivity[];
    },
    refetchInterval: 60000,
  });
}
