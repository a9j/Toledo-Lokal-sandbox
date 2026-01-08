import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDeals(options?: { featured?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['deals', options],
    queryFn: async () => {
      let query = supabase
        .from('deals')
        .select(`
          *,
          business:businesses(id, name, neighborhood:neighborhoods(name), category:categories(name, icon))
        `)
        .eq('status', 'approved')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });
      
      if (options?.featured) {
        query = query.eq('featured', true);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}
