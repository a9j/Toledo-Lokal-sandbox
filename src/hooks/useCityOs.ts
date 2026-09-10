import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { EntitySourceTable } from '@/integrations/supabase/city-os';

// Phase 0 additions only.
//
// Following, the Civic Inbox and the unread count already exist in
// useEntityFollow.ts and useCivicInbox.ts, and this file deliberately does not
// duplicate them. What lives here is what Phase 0 added: how often a person
// hears from us, and the one search box across every kind.

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
  /** 'text' for a direct match, 'related' for something one graph edge away,
   *  such as the business that offers a matching deal. */
  match_kind: string;
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

/** One search across every kind. A short query returns nothing rather than
 *  everything, which is what a nearly empty box should do. */
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

/** Where a result should take you. Every kind now has a real page, because
 *  the phases that built them are merged. */
export function resultPath(result: SearchResult): string {
  switch (result.source_table) {
    case 'businesses':         return `/business/${result.source_id}`;
    case 'events':             return `/events/${result.source_id}`;
    case 'nonprofits':         return `/community`;
    case 'jobs':               return `/jobs`;
    case 'deals':              return `/deals`;
    case 'neighborhoods':      return `/neighborhood/${result.source_id}`;
    case 'developments':       return `/built/${result.source_id}`;
    case 'spaces':             return `/spaces`;
    case 'issues':             return `/fix`;
    case 'opportunities':      return `/opportunities`;
    case 'parcels':            return `/parcel/${result.source_id}`;
    case 'business_locations': return `/discover`;
    default:                   return `/explore`;
  }
}

/** The tables the CityGraph knows how to follow. Deals and business
 *  locations are in the graph but have no follow path of their own yet, so a
 *  result from one gets no follow button rather than a button that fails. */
const FOLLOWABLE: readonly EntitySourceTable[] = [
  'businesses', 'events', 'neighborhoods', 'nonprofits', 'jobs',
  'parcels', 'issues', 'opportunities', 'developments', 'spaces',
];

export function followableSource(
  result: SearchResult,
): { table: EntitySourceTable; id: string } | null {
  const table = FOLLOWABLE.find((t) => t === result.source_table);
  return table ? { table, id: result.source_id } : null;
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
