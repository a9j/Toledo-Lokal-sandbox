import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PulsePost } from './usePulse';

export function useBusinessPulsePosts(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-pulse-posts', businessId],
    queryFn: async () => {
      if (!businessId) return [];

      const { data, error } = await supabase
        .from('pulse_posts')
        .select('*')
        .eq('business_id', businessId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PulsePost[];
    },
    enabled: !!businessId,
  });
}
