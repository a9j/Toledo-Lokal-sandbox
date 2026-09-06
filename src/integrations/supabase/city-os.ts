import { supabase } from '@/integrations/supabase/client';

/**
 * Phase 1 CityGraph types.
 *
 * `types.ts` is regenerated from the database and does not know about the
 * Phase 1 tables yet. Rather than hand-edit a generated file, the Phase 1
 * shapes live here and every query goes through `cityOs`, which is the one
 * place the client is loosened. Delete this module and switch back to the
 * generated types once `supabase gen types` has been re-run against a
 * database carrying the Phase 1 migrations.
 */

export type EntityKind =
  | 'person'
  | 'place'
  | 'organization'
  | 'event'
  | 'resource'
  | 'transaction'
  | 'issue';

/** The source tables Phase 1 registers. Used to look an entity up by its owner row. */
export type EntitySourceTable =
  | 'businesses'
  | 'events'
  | 'neighborhoods'
  | 'nonprofits'
  | 'jobs';

export interface CityEntity {
  id: string;
  kind: EntityKind;
  source_table: string;
  source_id: string;
  city_id: string | null;
  neighborhood_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CityEventLog {
  id: string;
  entity_id: string;
  event_type: string;
  title: string;
  body: string | null;
  occurs_at: string | null;
  created_at: string;
}

export interface InboxItem {
  id: string;
  user_id: string;
  log_id: string;
  read_at: string | null;
  created_at: string;
}

/** An inbox row joined to the change it points at and the entity that changed. */
export interface InboxEntry extends InboxItem {
  log: CityEventLog & { entity: Pick<CityEntity, 'id' | 'name' | 'kind' | 'source_table' | 'source_id'> };
}

/**
 * The Phase 1 tables are not in the generated `Database` type, so the query
 * builder cannot type them. This is the single escape hatch; everything that
 * comes back out is re-typed by hand above.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cityOs = supabase as any;

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
    default:
      return null;
  }
}
