import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** A source table plus its primary key. The graph resolves that to an entity,
 *  so callers never have to know an entity id. */
export interface EntityRef {
  table: string;
  id: string;
}

export interface InboxItem {
  id: string;
  log_id: string;
  read_at: string | null;
  created_at: string;
  title: string;
  body: string | null;
  event_type: string;
  entity_name: string | null;
  source_table: string | null;
  source_id: string | null;
}

export interface NotificationPreference {
  category: string;
  label: string;
  description: string;
  cadence: string;
}

export interface SearchResult {
  entity_id: string;
  kind: string;
  name: string;
  source_table: string;
  source_id: string;
  neighborhood_id: string | null;
  neighborhood: string | null;
  blurb: string | null;
  distance_miles: number | null;
  rank: number;
  match_kind: string;
}

async function resolveEntityId(ref: EntityRef): Promise<string | null> {
  const { data, error } = await supabase
    .from('city_entities')
    .select('id')
    .eq('source_table', ref.table)
    .eq('source_id', ref.id)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export function useEntityId(ref: EntityRef | null) {
  return useQuery({
    queryKey: ['entity-id', ref?.table, ref?.id],
    enabled: !!ref,
    staleTime: 60 * 60 * 1000,
    queryFn: () => resolveEntityId(ref as EntityRef),
  });
}

export function useIsFollowing(entityId: string | null | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is-following', entityId, user?.id],
    enabled: !!entityId && !!user,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('entity_follows')
        .select('entity_id')
        .eq('entity_id', entityId as string)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useToggleFollow() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entityId, following }: { entityId: string; following: boolean }) => {
      if (!user) throw new Error('Sign in to follow.');
      if (following) {
        const { error } = await supabase
          .from('entity_follows')
          .delete()
          .eq('entity_id', entityId)
          .eq('user_id', user.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from('entity_follows')
        .insert({ entity_id: entityId, user_id: user.id });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-unread'] });
    },
  });
}

/** The Civic Inbox, newest first. The join gives each item its headline. */
export function useInbox(limit = 100) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['inbox', user?.id, limit],
    enabled: !!user,
    queryFn: async (): Promise<InboxItem[]> => {
      const { data, error } = await supabase
        .from('inbox_items')
        .select(`
          id, log_id, read_at, created_at,
          city_events_log!inner (
            title, body, event_type,
            city_entities ( name, source_table, source_id )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      return (data ?? []).map((row) => {
        const log = (row as unknown as {
          city_events_log: {
            title: string; body: string | null; event_type: string;
            city_entities: { name: string; source_table: string; source_id: string } | null;
          };
        }).city_events_log;
        const r = row as unknown as { id: string; log_id: string; read_at: string | null; created_at: string };
        return {
          id: r.id,
          log_id: r.log_id,
          read_at: r.read_at,
          created_at: r.created_at,
          title: log?.title ?? 'Something changed',
          body: log?.body ?? null,
          event_type: log?.event_type ?? 'status_change',
          entity_name: log?.city_entities?.name ?? null,
          source_table: log?.city_entities?.source_table ?? null,
          source_id: log?.city_entities?.source_id ?? null,
        };
      });
    },
  });
}

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['inbox-unread', user?.id],
    enabled: !!user,
    // The badge should feel live without hammering the database.
    refetchInterval: 60_000,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('inbox_items')
        .select('id', { count: 'exact', head: true })
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkInboxRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase
        .from('inbox_items')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['inbox-unread'] });
    },
  });
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NotificationPreference[]> => {
      const { data, error } = await supabase.rpc('my_notification_preferences');
      if (error) throw error;
      return (data ?? []) as unknown as NotificationPreference[];
    },
  });
}

export function useSetNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ category, cadence }: { category: string; cadence: string }) => {
      const { error } = await supabase.rpc('set_notification_preference', {
        p_category: category,
        p_cadence: cadence,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}

/** One search across every kind. Empty query returns nothing rather than
 *  everything, which is what a blank box should do. */
export function useCitySearch(query: string, limit = 40) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['city-search', trimmed, limit],
    enabled: trimmed.length >= 2,
    queryFn: async (): Promise<SearchResult[]> => {
      // p_user_id is deliberately not sent. The function ignores it and uses
      // the caller's own home, so passing somebody else's id cannot rank
      // results around their house.
      const { data, error } = await supabase.rpc('city_search', {
        p_query: trimmed,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as unknown as SearchResult[];
    },
  });
}

/** Where a result should take you. Kinds with no page of their own fall back
 *  to the closest list rather than a dead link. */
export function resultPath(result: SearchResult): string {
  switch (result.source_table) {
    case 'businesses':      return `/business/${result.source_id}`;
    case 'events':          return `/events/${result.source_id}`;
    case 'nonprofits':      return `/community`;
    case 'jobs':            return `/jobs`;
    case 'deals':           return `/deals`;
    case 'neighborhoods':   return `/explore`;
    case 'business_locations': return `/discover`;
    default:                return `/explore`;
  }
}

export function kindLabel(kind: string): string {
  switch (kind) {
    case 'business':     return 'Business';
    case 'organization': return 'Nonprofit';
    case 'event':        return 'Event';
    case 'job':          return 'Job';
    case 'deal':         return 'Deal';
    case 'property':     return 'Address';
    case 'neighborhood': return 'Neighborhood';
    case 'project':      return 'Building project';
    case 'place':        return 'Place';
    case 'opportunity':  return 'Help';
    case 'issue':        return 'Reported problem';
    case 'resource':     return 'Program';
    default:             return kind;
  }
}
