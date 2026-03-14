import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BusinessLocation {
  id?: string;
  business_id?: string;
  label: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  neighborhood: string;
  phone: string;
  hours: Record<string, { open: string; close: string; closed: boolean }> | null;
  is_primary: boolean;
  is_active: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export const NEIGHBORHOOD_OPTIONS = [
  'Downtown',
  'Old West End',
  'Uptown',
  'Perrysburg',
  'Maumee',
  'Sylvania',
  'Oregon',
  'Other',
];

export const DEFAULT_LOCATION: BusinessLocation = {
  label: '',
  street_address: '',
  city: 'Toledo',
  state: 'OH',
  zip_code: '',
  neighborhood: '',
  phone: '',
  hours: null,
  is_primary: false,
  is_active: true,
};

export function useBusinessLocations(businessId: string | null | undefined) {
  return useQuery({
    queryKey: ['business-locations', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('business_locations')
        .select('*')
        .eq('business_id', businessId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as BusinessLocation[];
    },
    enabled: !!businessId,
  });
}

export function useSaveBusinessLocations(businessId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locations: BusinessLocation[]) => {
      if (!businessId) throw new Error('No business ID');

      // Delete existing locations for this business
      await supabase
        .from('business_locations')
        .delete()
        .eq('business_id', businessId);

      // Insert new locations
      const rows = locations.map((loc) => ({
        business_id: businessId,
        label: loc.label || null,
        street_address: loc.street_address,
        city: loc.city,
        state: loc.state,
        zip_code: loc.zip_code,
        neighborhood: loc.neighborhood || null,
        phone: loc.phone || null,
        hours: loc.hours,
        is_primary: loc.is_primary,
        is_active: loc.is_active,
        latitude: loc.latitude || null,
        longitude: loc.longitude || null,
      }));

      const { error } = await supabase.from('business_locations').insert(rows);
      if (error) throw error;

      // Also update the primary location's address on the businesses table for backwards compat
      const primary = locations.find((l) => l.is_primary);
      if (primary) {
        const fullAddress = `${primary.street_address}, ${primary.city}, ${primary.state} ${primary.zip_code}`.trim();
        await supabase
          .from('businesses')
          .update({
            address: fullAddress,
            phone: primary.phone || null,
          })
          .eq('id', businessId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-locations', businessId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save locations');
    },
  });
}
