import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEvents(options?: { featured?: boolean; limit?: number; today?: boolean }) {
  return useQuery({
    queryKey: ['events', options],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      let query = supabase
        .from('events')
        .select(`
          *,
          business:businesses(id, name, neighborhood:neighborhoods(name))
        `)
        .eq('status', 'approved')
        .gte('start_date_time', now)
        .order('start_date_time', { ascending: true });
      
      if (options?.featured) {
        query = query.eq('featured', true);
      }

      if (options?.today) {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('start_date_time', endOfDay.toISOString());
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
