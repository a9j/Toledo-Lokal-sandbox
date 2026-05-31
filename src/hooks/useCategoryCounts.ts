import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCategoryCounts() {
  return useQuery({
    queryKey: ['category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('category_id')
        .eq('status', 'approved');

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.category_id) {
          counts[row.category_id] = (counts[row.category_id] || 0) + 1;
        }
      }
      return counts;
    },
    staleTime: 60_000,
  });
}
