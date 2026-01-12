import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BusinessFeatures {
  id: string;
  business_id: string;
  hiring_enabled: boolean;
  food_truck_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useBusinessFeatures(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-features', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data, error } = await supabase
        .from('business_features')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();
      
      if (error) throw error;
      return data as BusinessFeatures | null;
    },
    enabled: !!businessId,
  });
}

export function useUpdateBusinessFeatures() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ businessId, ...updates }: { businessId: string; hiring_enabled?: boolean; food_truck_enabled?: boolean }) => {
      // First try to update
      const { data: existing } = await supabase
        .from('business_features')
        .select('id')
        .eq('business_id', businessId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('business_features')
          .update(updates)
          .eq('business_id', businessId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert if doesn't exist
        const { data, error } = await supabase
          .from('business_features')
          .insert({ business_id: businessId, ...updates })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['business-features', variables.businessId] });
      toast({
        title: 'Settings updated',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
