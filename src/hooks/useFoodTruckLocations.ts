import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// ── Core interface ────────────────────────────────────────────────────────────

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
  // Live tracking
  here_until: string | null;
  tracking_enabled: boolean;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    photos: string[] | null;
    neighborhood?: { name: string } | null;
    category?: { name: string; icon: string } | null;
  } | null;
}

export interface FoodTruckSchedule {
  id: string;
  business_id: string;
  day_of_week: number;
  location_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface FoodTruckFilters {
  date?: string; // YYYY-MM-DD format
  businessId?: string;
}

const BUSINESS_SELECT = `
  id,
  name,
  logo_url,
  photos,
  neighborhood:neighborhoods(name),
  category:categories(name, icon)
`;

// ── Scheduled locations ───────────────────────────────────────────────────────

export function useFoodTruckLocations(filters?: FoodTruckFilters) {
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['food-truck-locations', filters],
    queryFn: async () => {
      let query = supabase
        .from('food_truck_locations')
        .select(`*, business:businesses(${BUSINESS_SELECT})`)
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

// ── Live trucks (tracking_enabled=true, here_until in the future) ─────────────

export function useLiveFoodTrucks() {
  return useQuery({
    queryKey: ['live-food-trucks'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('food_truck_locations')
        .select(`*, business:businesses(${BUSINESS_SELECT})`)
        .eq('status', 'active')
        .eq('tracking_enabled', true)
        .gt('here_until', now)
        .order('here_until', { ascending: true });
      if (error) throw error;
      return (data ?? []) as FoodTruckLocation[];
    },
    refetchInterval: 60_000, // refresh every minute
  });
}

// ── Business owner's own locations ────────────────────────────────────────────

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

// Current live entry for the owner's business (if any)
export function useMyLiveLocation(businessId: string | undefined) {
  return useQuery({
    queryKey: ['my-live-location', businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('food_truck_locations')
        .select('*')
        .eq('business_id', businessId)
        .eq('tracking_enabled', true)
        .gt('here_until', now)
        .maybeSingle();
      return data as FoodTruckLocation | null;
    },
    enabled: !!businessId,
  });
}

// ── CRUD mutations ────────────────────────────────────────────────────────────

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
      toast({ title: 'Location posted!', description: 'Your location is now visible to customers.' });
    },
    onError: () => {
      toast({ title: 'Error posting location', description: 'Failed to post location. Please try again.', variant: 'destructive' });
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
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-truck-locations'] });
      queryClient.invalidateQueries({ queryKey: ['business-food-locations'] });
      queryClient.invalidateQueries({ queryKey: ['live-food-trucks'] });
      queryClient.invalidateQueries({ queryKey: ['my-live-location'] });
      toast({ title: 'Location updated' });
    },
    onError: () => {
      toast({ title: 'Error updating location', description: 'Failed to update location. Please try again.', variant: 'destructive' });
    },
  });
}

export function useDeleteFoodLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('food_truck_locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-truck-locations'] });
      queryClient.invalidateQueries({ queryKey: ['business-food-locations'] });
      queryClient.invalidateQueries({ queryKey: ['live-food-trucks'] });
      toast({ title: 'Location deleted' });
    },
    onError: () => {
      toast({ title: 'Error deleting location', description: 'Failed to delete location. Please try again.', variant: 'destructive' });
    },
  });
}

// ── Live tracking mutations ───────────────────────────────────────────────────

interface SetLiveLocationParams {
  businessId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  hereUntil: string; // ISO string
}

export function useSetLiveLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ businessId, locationName, latitude, longitude, hereUntil }: SetLiveLocationParams) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      // Upsert: if there's already a live entry for today, update it; otherwise insert
      const { data, error } = await supabase
        .from('food_truck_locations')
        .upsert(
          {
            business_id: businessId,
            location_date: today,
            location_name: locationName,
            latitude,
            longitude,
            start_time: format(new Date(), 'HH:mm'),
            end_time: format(new Date(hereUntil), 'HH:mm'),
            here_until: hereUntil,
            tracking_enabled: true,
            status: 'active',
          },
          {
            onConflict: 'business_id,location_date',
            ignoreDuplicates: false,
          }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-food-trucks'] });
      queryClient.invalidateQueries({ queryKey: ['food-truck-locations'] });
      queryClient.invalidateQueries({ queryKey: ['business-food-locations'] });
      queryClient.invalidateQueries({ queryKey: ['my-live-location'] });
      toast({ title: "You're live!", description: 'Customers can now find you on the map.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Could not go live', description: error.message, variant: 'destructive' });
    },
  });
}

export function useStopLiveTracking() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (businessId: string) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { error } = await supabase
        .from('food_truck_locations')
        .update({ tracking_enabled: false })
        .eq('business_id', businessId)
        .eq('location_date', today)
        .eq('tracking_enabled', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-food-trucks'] });
      queryClient.invalidateQueries({ queryKey: ['my-live-location'] });
      toast({ title: 'Stopped sharing location' });
    },
    onError: () => {
      toast({ title: 'Error stopping tracking', variant: 'destructive' });
    },
  });
}

// ── Weekly schedule hooks ─────────────────────────────────────────────────────

export function useFoodTruckSchedules(businessId: string | undefined) {
  return useQuery({
    queryKey: ['food-truck-schedules', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('food_truck_schedules')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return (data ?? []) as FoodTruckSchedule[];
    },
    enabled: !!businessId,
  });
}

export function useUpsertScheduleEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: Omit<FoodTruckSchedule, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('food_truck_schedules')
        .insert(entry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['food-truck-schedules', variables.business_id] });
      toast({ title: 'Schedule saved' });
    },
    onError: () => {
      toast({ title: 'Error saving schedule', variant: 'destructive' });
    },
  });
}

export function useDeleteScheduleEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await supabase.from('food_truck_schedules').delete().eq('id', id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => {
      queryClient.invalidateQueries({ queryKey: ['food-truck-schedules', businessId] });
      toast({ title: 'Schedule entry removed' });
    },
    onError: () => {
      toast({ title: 'Error removing schedule entry', variant: 'destructive' });
    },
  });
}

// ── Follow / unfollow hooks ───────────────────────────────────────────────────

export function useTruckFollows(userId: string | undefined) {
  return useQuery({
    queryKey: ['truck-follows', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase
        .from('user_truck_follows')
        .select('business_id')
        .eq('user_id', userId);
      return new Set<string>((data ?? []).map((r) => r.business_id));
    },
    enabled: !!userId,
  });
}

export function useFollowTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, businessId }: { userId: string; businessId: string }) => {
      const { error } = await supabase
        .from('user_truck_follows')
        .insert({ user_id: userId, business_id: businessId });
      if (error && error.code !== '23505') throw error; // ignore unique violation
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['truck-follows', userId] });
    },
  });
}

export function useUnfollowTruck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, businessId }: { userId: string; businessId: string }) => {
      const { error } = await supabase
        .from('user_truck_follows')
        .delete()
        .eq('user_id', userId)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['truck-follows', userId] });
    },
  });
}
