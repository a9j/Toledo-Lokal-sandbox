import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CitySignal {
  id: string;
  signal_type: string;
  title: string;
  subtitle: string | null;
  neighborhood: string | null;
  category: string | null;
  metric: number | null;
  reference_id: string | null;
  payload: Record<string, unknown>;
  valid_from: string;
  valid_until: string;
}

// Live City Signals — system-generated from real platform activity (no AI).
export function useCitySignals(limit = 12) {
  return useQuery<CitySignal[]>({
    queryKey: ['city-signals', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from('city_signals' as any) as any)
        .select('*')
        .gt('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as CitySignal[];
    },
    refetchInterval: 60000,
  });
}
