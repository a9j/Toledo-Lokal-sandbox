import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useTours() {
  return useQuery({
    queryKey: ['tours'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tours')
        .select(`
          *,
          neighborhood:neighborhoods(name),
          tour_stops(
            *,
            business:businesses(id, name, logo_url, address)
          )
        `)
        .eq('status', 'active')
        .order('featured', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useTour(id: string) {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tours')
        .select(`
          *,
          neighborhood:neighborhoods(name),
          tour_stops(
            *,
            business:businesses(id, name, logo_url, address, description)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
