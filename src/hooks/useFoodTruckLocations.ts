import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface FoodTruckLocation {
  id: string;
  business_id: string;
  location_date: string;
  location_name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  start_time: string;
  end_time: string;
  notes: string | null;
  featured: boolean;
  status: 'active' | 'cancelled';
  created_at: string;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    photos: string[] | null;
    neighborhood?: { name: string } | null;
    category?: { name: string; icon: string } | null;
  } | null;
}

export interface FoodTruckFilters {
  date?: string; // YYYY-MM-DD format
  businessId?: string;
}

export function useFoodTruckLocations(filters?: FoodTruckFilters) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['food-truck-locations', filters],
    queryFn: async () => {
      let query = supabase
        .from('food_truck_locations')
        .select(`
          *,
          business:businesses(
            id,
            name,
            logo_url,
            photos,
            neighborhood:neighborhoods(name),
            category:categories!category_id(name, icon)
          )
        `)
        .eq('status', 'active')
        .eq('location_date', filters?.date || today)
        .order('featured', { ascending: false })
        .order('start_time', { ascending: true });

      if (filters?.businessId) {
        query = query.eq('business_id', filters.businessId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FoodTruckLocation[];
    },
  });
}

export function useBusinessFoodLocations(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-food-locations', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('food_truck_locations')
        .select('*')
        .eq('business_id', businessId)
        .gte('location_date', format(new Date(), 'yyyy-MM-dd'))
        .order('location_date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      return data as FoodTruckLocation[];
    },
    enabled: !!businessId,
  });
}

export function useCreateFoodLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (location: Omit<FoodTruckLocation, 'id' | 'created_at' | 'status' | 'featured' | 'business'>) => {
      const { data, error } = await supabase
        .from('food_truck_locations')
        .insert(location)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-truck-locations'] });
      queryClient.invalidateQueries({ queryKey: ['business-food-locations'] });
      toast({
        title: 'Location posted!',
        description: 'Your location is now visible to customers.',
      });
    },
    onError: () => {
      toast({
        title: 'Error posting location',
        description: 'Failed to post location. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateFoodLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FoodTruckLocation> & { id: string }) => {
      const { data, error } = await supabase
        .from('food_truck_locations')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-truck-locations'] });
      queryClient.invalidateQueries({ queryKey: ['business-food-locations'] });
      toast({
        title: 'Location updated',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating location',
        description: 'Failed to update location. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteFoodLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('food_truck_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-truck-locations'] });
      queryClient.invalidateQueries({ queryKey: ['business-food-locations'] });
      toast({
        title: 'Location deleted',
      });
    },
    onError: () => {
      toast({
        title: 'Error deleting location',
        description: 'Failed to delete location. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
