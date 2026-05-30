import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { deriveNowAndNext, TruckStop, TruckStopStatus } from '@/lib/truck-stops';

export interface TruckStopInput {
  location_name: string;
  lat?: number | null;
  lng?: number | null;
  starts_at: string;
  ends_at: string;
  status?: TruckStopStatus;
}

/**
 * Read a truck's stops and the derived "Now at" / "Next stop" views, plus owner
 * create/update/delete. Stops drive the food-truck profile's schedule_stops
 * block.
 */
export function useTruckStops(businessId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['truck-stops', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('truck_stops')
        .select('id, business_id, location_name, lat, lng, starts_at, ends_at, status, checkin_code')
        .eq('business_id', businessId as string)
        .order('starts_at');
      if (error) throw error;
      return (data ?? []) as TruckStop[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['truck-stops', businessId] });

  const addStop = useMutation({
    mutationFn: async (input: TruckStopInput) => {
      if (!businessId) throw new Error('No business id');
      const { error } = await supabase
        .from('truck_stops')
        .insert({ ...input, business_id: businessId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateStop = useMutation({
    mutationFn: async ({ id, ...input }: TruckStopInput & { id: string }) => {
      const { error } = await supabase.from('truck_stops').update(input).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteStop = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('truck_stops').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const derived = deriveNowAndNext(query.data ?? []);

  return { ...query, ...derived, addStop, updateStop, deleteStop };
}
