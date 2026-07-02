import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { TablesUpdate } from '@/integrations/supabase/types';

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

export interface FoodTruckBusiness {
  id: string;
  name: string;
  description: string | null;
  verified: boolean | null;
  featured: boolean | null;
  logo_url: string | null;
  tier_status: string | null;
  tier_badge_visible: boolean | null;
  neighborhood: { name: string } | null;
  category: { name: string; icon: string } | null;
}

// Every approved business that signed up as a food truck, whether or not it has
// posted a location for today. Powers the "all food trucks" directory so a truck
// is discoverable the moment it joins — it doesn't have to post a stop first.
export function useFoodTrucks() {
  return useQuery({
    queryKey: ['food-trucks-directory'],
    queryFn: async () => {
      // Resolve food truck category ID from the categories table, then filter
      // by category_id (the legacy enum column is being dropped).
      const { data: cats } = await supabase.from('categories').select('id, name, icon');
      const foodTruckCatId = cats?.find(
        c => c.name?.toLowerCase().includes('food truck') || c.icon === 'truck',
      )?.id;
      if (!foodTruckCatId) return [];

      const { data, error } = await supabase
        .from('businesses_public')
        .select(
          'id, name, description, verified, featured, logo_url, tier_status, tier_badge_visible, category_id, neighborhood_id',
        )
        .eq('status', 'approved')
        .eq('category_id', foodTruckCatId)
        .order('name', { ascending: true });

      if (error) throw error;

      const rows = data ?? [];
      const categoryById = new Map<string, { name: string; icon: string }>();
      const neighborhoodById = new Map<string, { name: string }>();
      if (rows.length > 0) {
        const [catRes, nbRes] = await Promise.all([
          supabase.from('categories').select('id, name, icon'),
          supabase.from('neighborhoods').select('id, name'),
        ]);
        (catRes.data ?? []).forEach(c => categoryById.set(c.id, { name: c.name, icon: c.icon ?? '' }));
        (nbRes.data ?? []).forEach(n => neighborhoodById.set(n.id, { name: n.name }));
      }

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        verified: row.verified,
        featured: row.featured,
        logo_url: row.logo_url,
        tier_status: row.tier_status,
        tier_badge_visible: row.tier_badge_visible,
        category: row.category_id ? categoryById.get(row.category_id) ?? null : null,
        neighborhood: row.neighborhood_id ? neighborhoodById.get(row.neighborhood_id) ?? null : null,
      })) as FoodTruckBusiness[];
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
      const { business: _business, ...dbUpdates } = updates;
      const { data, error } = await supabase
        .from('food_truck_locations')
        .update(dbUpdates as TablesUpdate<'food_truck_locations'>)
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
