import { useQuery } from '@tanstack/react-query';
import { cityOs, type CityEventLog } from '@/integrations/supabase/city-os';

/**
 * Recent changes for one entity, newest first. Drives the "Recent changes"
 * list on business, event, neighborhood and nonprofit detail pages.
 */
export function useEntityChanges(entityId?: string | null, limit = 5) {
  return useQuery({
    queryKey: ['entity-changes', entityId, limit],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await cityOs
        .from('city_events_log')
        .select('id, entity_id, event_type, title, body, occurs_at, created_at')
        .eq('entity_id', entityId as string)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as CityEventLog[];
    },
  });
}
