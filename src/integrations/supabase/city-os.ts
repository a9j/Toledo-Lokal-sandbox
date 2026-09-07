import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Phase 1 CityGraph types and helpers.
 *
 * The row shapes come straight from the generated `Database` type now that
 * types.ts has been regenerated against the migrated database, so these are
 * aliases rather than hand written duplicates. Only the joined `InboxEntry`
 * shape is spelled out, because PostgREST embeds are not expressed in the
 * generated types.
 */

export type EntityKind = Database['public']['Enums']['entity_kind'];

/** The source tables Phase 1 registers. Used to look an entity up by its owner row. */
export type EntitySourceTable =
  | 'businesses'
  | 'events'
  | 'neighborhoods'
  | 'nonprofits'
  | 'jobs'
  | 'parcels'
  | 'issues'
  | 'opportunities';

export type CityEntity = Database['public']['Tables']['city_entities']['Row'];
export type CityEventLog = Database['public']['Tables']['city_events_log']['Row'];
export type InboxItem = Database['public']['Tables']['inbox_items']['Row'];

/**
 * An inbox row joined to the change it points at and the entity that changed.
 * PostgREST embeds have no generated type, so this one is written out.
 */
export interface InboxEntry extends InboxItem {
  log: CityEventLog & {
    entity: Pick<CityEntity, 'id' | 'name' | 'kind' | 'source_table' | 'source_id'> | null;
  };
}

/**
 * The Phase 1 tables are in the generated types now, so this is the ordinary
 * typed client. Kept as a named export so callers do not all have to change
 * when the underlying client does.
 */
export const cityOs = supabase;

/** Human label for a change log event_type. Unknown types fall back to the raw value. */
const EVENT_TYPE_LABELS: Record<string, string> = {
  opened: 'Opened',
  closure: 'Closure',
  permit_filed: 'Permit filed',
  deal_added: 'New deal',
  meeting: 'Meeting',
  status_change: 'Update',
};

export function eventTypeLabel(eventType: string): string {
  return EVENT_TYPE_LABELS[eventType] ?? eventType.replace(/_/g, ' ');
}

/** Where an entity's detail page lives, or null when it has no page of its own. */
export function entityPath(
  entity: Pick<CityEntity, 'source_table' | 'source_id'>,
): string | null {
  switch (entity.source_table) {
    case 'businesses':
      return `/business/${entity.source_id}`;
    case 'events':
      return `/events/${entity.source_id}`;
    case 'issues':
      return `/fix/${entity.source_id}`;
    default:
      return null;
  }
}
