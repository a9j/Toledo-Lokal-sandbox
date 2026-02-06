import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useBusinessSavedCount(businessId: string) {
  return useQuery({
    queryKey: ['business-saved-count', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_business_saved_count', { business_id: businessId });
      
      if (error) throw error;
      return data as number;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!businessId,
  });
}

export function useNeighborhoodPopularity(neighborhoodId: string | null) {
  return useQuery({
    queryKey: ['neighborhood-popularity', neighborhoodId],
    queryFn: async () => {
      if (!neighborhoodId) return 0;
      
      const { data, error } = await supabase
        .rpc('get_neighborhood_popularity', { neighborhood_id: neighborhoodId });
      
      if (error) throw error;
      return data as number;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!neighborhoodId,
  });
}

// Batch fetch saved counts for multiple businesses
export function useBusinessesSavedCounts(businessIds: string[]) {
  return useQuery({
    queryKey: ['businesses-saved-counts', businessIds.sort().join(',')],
    queryFn: async () => {
      if (businessIds.length === 0) return {};
      
      // Fetch counts for each business
      const counts: Record<string, number> = {};
      
      const { data, error } = await supabase
        .from('saved_items')
        .select('item_id')
        .eq('item_type', 'business')
        .in('item_id', businessIds);
      
      if (error) throw error;
      
      // Initialize all with 0
      businessIds.forEach(id => { counts[id] = 0; });
      
      // Count occurrences
      (data || []).forEach(item => {
        counts[item.item_id] = (counts[item.item_id] || 0) + 1;
      });
      
      return counts;
    },
    staleTime: 5 * 60 * 1000,
    enabled: businessIds.length > 0,
  });
}
