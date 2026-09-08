import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { cityOs, type InboxEntry } from '@/integrations/supabase/city-os';

/**
 * Civic Inbox, Phase 1.
 *
 * Rows are written by the fan out trigger on `city_events_log`: one row per
 * follower of the entity that changed. Nothing is written from the client.
 */

const INBOX_SELECT = `
  id, user_id, log_id, read_at, created_at,
  log:city_events_log (
    id, entity_id, event_type, title, body, occurs_at, created_at,
    entity:city_entities ( id, name, kind, source_table, source_id )
  )
`;

/** A day's worth of inbox entries, newest day first. */
export interface InboxDay {
  /** ISO date, yyyy-mm-dd, in the reader's own time zone. */
  date: string;
  label: string;
  entries: InboxEntry[];
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  // Local date, not UTC: "yesterday" should mean the reader's yesterday.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayLabel(key: string): string {
  const today = dayKey(new Date().toISOString());
  if (key === today) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === dayKey(yesterday.toISOString())) return 'Yesterday';

  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Group entries into days, newest day first, newest entry first inside a day. */
export function groupByDay(entries: InboxEntry[]): InboxDay[] {
  const byDay = new Map<string, InboxEntry[]>();

  for (const entry of entries) {
    const key = dayKey(entry.log?.occurs_at ?? entry.created_at);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(entry);
    else byDay.set(key, [entry]);
  }

  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, dayEntries]) => ({ date, label: dayLabel(date), entries: dayEntries }));
}

export function useCivicInbox() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const inboxQuery = useQuery({
    queryKey: ['civic-inbox', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await cityOs
        .from('inbox_items')
        .select(INBOX_SELECT)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      // A log row whose entity was deleted comes back without a join target.
      return ((data ?? []) as InboxEntry[]).filter((entry) => !!entry.log);
    },
  });

  const markRead = useMutation({
    mutationFn: async (itemIds: string[]) => {
      if (itemIds.length === 0) return;
      const { error } = await cityOs
        .from('inbox_items')
        .update({ read_at: new Date().toISOString() })
        .in('id', itemIds)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['civic-inbox', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
    },
  });

  const entries = inboxQuery.data ?? [];

  return {
    entries,
    days: groupByDay(entries),
    unreadIds: entries.filter((e) => !e.read_at).map((e) => e.id),
    isLoading: inboxQuery.isLoading,
    error: inboxQuery.error,
    markRead,
  };
}

/** Unread count for the tab bar badge. Cheap enough to poll on focus. */
export function useInboxUnreadCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['inbox-unread-count', user?.id],
    enabled: !!user,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await cityOs.rpc('inbox_unread_count');
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });
}
