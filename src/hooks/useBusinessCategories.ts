import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Secondary category tags for a business. The *primary* browse category stays on
 * businesses.category_id; this layer lets a business appear in additional browse
 * buckets (e.g. a cafe that also sells merch turns on "Shopping").
 *
 * Secondary tags are stored in business_categories with is_primary = false.
 */
export function useBusinessCategories(businessId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['business-categories', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_categories')
        .select('category_id, is_primary')
        .eq('business_id', businessId as string);
      if (error) throw error;
      return data ?? [];
    },
  });

  const secondaryCategoryIds = (query.data ?? [])
    .filter((row) => !row.is_primary)
    .map((row) => row.category_id);

  const setSecondaryCategories = useMutation({
    mutationFn: async (categoryIds: string[]) => {
      if (!businessId) throw new Error('No business id');

      // Replace the full secondary set: clear existing secondary rows, then
      // insert the new selection. (Primary rows, if any, are left untouched.)
      const { error: deleteError } = await supabase
        .from('business_categories')
        .delete()
        .eq('business_id', businessId)
        .eq('is_primary', false);
      if (deleteError) throw deleteError;

      if (categoryIds.length > 0) {
        const rows = categoryIds.map((category_id) => ({
          business_id: businessId,
          category_id,
          is_primary: false,
        }));
        const { error: insertError } = await supabase
          .from('business_categories')
          .insert(rows);
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-categories', businessId] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });

  return {
    ...query,
    secondaryCategoryIds,
    setSecondaryCategories,
  };
}
