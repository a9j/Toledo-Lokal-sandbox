# Phase 1 migration plan: CityGraph foundation

Status: **proposed, not applied.** This file is the review artifact. Nothing runs against
`waezoxzkvhuqjzomafee` until you approve it. On approval the SQL below is split into two files under
`supabase/migrations/` and applied to the sandbox branch only.

Target: Supabase branch `sandbox`, ref `waezoxzkvhuqjzomafee`. Parent `nnepslwwqjxfhlurwoyw` is never
touched.

## What this creates

| Object | Purpose |
|---|---|
| `entity_kind` enum | person, place, organization, event, resource, transaction, issue |
| `city_entities` | one row per thing in the city, pointing at the table that owns it |
| `city_edges` | typed relationships between entities |
| `entity_follows` | universal follow, replaces a follows table per feature |
| `city_events_log` | anything that changed, feeds Civic Inbox and later the Change Log and Autopilot |
| `inbox_items` | Civic Inbox rows, fanned out from the log to followers |
| sync triggers | keep `city_entities` in step with businesses, events, neighborhoods, nonprofits, jobs |
| fan out trigger | log row in, one inbox row per follower out |

## Decisions this plan makes, and why

**PostGIS is created first.** It is available on the sandbox but not installed, so nothing with a
`geography` column can be created until it is. It goes in the `extensions` schema, matching Supabase
convention, and `location` is referenced as `extensions.geography(point,4326)`.

**`location` is nullable.** Only `business_locations` carries coordinates today. Businesses backfill
their primary location's point, everything else backfills null. Distance ranking becomes real in
Phase 2 when parcels land. Making the column required would block the backfill for no benefit.

**`city_id` comes from the single `cities` row.** `neighborhoods` has no `city_id` column, so there
is nothing to walk. When neighborhoods gain a city link this becomes a join and the column does not
change.

**Kind mapping.** businesses and nonprofits are `organization`, neighborhoods are `place`, events are
`event`, jobs are `resource`. Businesses are organizations that *have* a place; their location is
carried on the entity row and their `located_in` edge points at the neighborhood, so map and "near me"
queries still work without calling them places.

**Foreign keys point at `auth.users(id)`.** `profiles` has a separate `id` and `user_id`, so
`profiles.id` is the wrong target for anything user scoped.

**RLS reuses `public.is_platform_admin(auth.uid())`.** That function already exists. No new admin
predicate.

**`search_text` is a stored generated column**, not trigger maintained, so it can never drift.

---

## Migration 1: schema

`supabase/migrations/<ts>_city_os_phase1_citygraph.sql`

```sql
-- Phase 1: CityGraph foundation.
-- Registry over the existing data, universal follows, change log, civic inbox.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------- entities

do $$ begin
  create type public.entity_kind as enum (
    'person','place','organization','event','resource','transaction','issue'
  );
exception when duplicate_object then null; end $$;

create table public.city_entities (
  id              uuid primary key default gen_random_uuid(),
  kind            public.entity_kind not null,
  source_table    text not null,
  source_id       uuid not null,
  city_id         uuid references public.cities(id) on delete set null,
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  name            text not null,
  location        extensions.geography(point, 4326),
  search_text     tsvector generated always as (
                    to_tsvector('english', coalesce(name, ''))
                  ) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (source_table, source_id)
);

create index city_entities_location_idx     on public.city_entities using gist (location);
create index city_entities_search_idx       on public.city_entities using gin  (search_text);
create index city_entities_kind_hood_idx    on public.city_entities (kind, neighborhood_id);
create index city_entities_source_idx       on public.city_entities (source_table, source_id);

-- ------------------------------------------------------------------- edges

create table public.city_edges (
  id          uuid primary key default gen_random_uuid(),
  from_entity uuid not null references public.city_entities(id) on delete cascade,
  to_entity   uuid not null references public.city_entities(id) on delete cascade,
  relation    text not null,
  weight      numeric not null default 1,
  metadata    jsonb   not null default '{}',
  created_at  timestamptz not null default now(),
  unique (from_entity, to_entity, relation),
  constraint city_edges_no_self_loop check (from_entity <> to_entity)
);

create index city_edges_from_idx on public.city_edges (from_entity, relation);
create index city_edges_to_idx   on public.city_edges (to_entity, relation);

-- ----------------------------------------------------------------- follows

create table public.entity_follows (
  user_id    uuid not null references auth.users(id) on delete cascade,
  entity_id  uuid not null references public.city_entities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_id)
);

create index entity_follows_entity_idx on public.entity_follows (entity_id);

-- --------------------------------------------------------------- event log

create table public.city_events_log (
  id         uuid primary key default gen_random_uuid(),
  entity_id  uuid not null references public.city_entities(id) on delete cascade,
  event_type text not null,
  title      text not null,
  body       text,
  occurs_at  timestamptz,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index city_events_log_entity_idx on public.city_events_log (entity_id, created_at desc);
create index city_events_log_recent_idx on public.city_events_log (created_at desc);

-- ------------------------------------------------------------- civic inbox

create table public.inbox_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_id     uuid not null references public.city_events_log(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, log_id)
);

create index inbox_items_user_idx   on public.inbox_items (user_id, read_at, created_at desc);
create index inbox_items_unread_idx on public.inbox_items (user_id) where read_at is null;

-- --------------------------------------------------------------------- RLS

alter table public.city_entities   enable row level security;
alter table public.city_edges      enable row level security;
alter table public.entity_follows  enable row level security;
alter table public.city_events_log enable row level security;
alter table public.inbox_items     enable row level security;

-- Registry and graph: world readable, admin writable.
create policy city_entities_read   on public.city_entities   for select using (true);
create policy city_entities_write  on public.city_entities   for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy city_edges_read      on public.city_edges      for select using (true);
create policy city_edges_write     on public.city_edges      for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy city_events_log_read on public.city_events_log for select using (true);
create policy city_events_log_write on public.city_events_log for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Follows: yours and only yours.
create policy entity_follows_select on public.entity_follows for select
  using (auth.uid() = user_id);
create policy entity_follows_insert on public.entity_follows for insert
  with check (auth.uid() = user_id);
create policy entity_follows_delete on public.entity_follows for delete
  using (auth.uid() = user_id);

-- Inbox: read and mark read your own rows. Inserts come from the fan out
-- trigger, which is security definer, so no insert policy is granted.
create policy inbox_items_select on public.inbox_items for select
  using (auth.uid() = user_id);
create policy inbox_items_update on public.inbox_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy inbox_items_delete on public.inbox_items for delete
  using (auth.uid() = user_id);
```

## Migration 2: sync triggers and fan out

`supabase/migrations/<ts>_city_os_phase1_sync_and_fanout.sql`

```sql
-- Keep city_entities in step with the tables that own the data, and fan the
-- change log out to followers.

-- Upsert one registry row. Called by the per table triggers below.
create or replace function public.citygraph_upsert_entity(
  p_kind            public.entity_kind,
  p_source_table    text,
  p_source_id       uuid,
  p_name            text,
  p_neighborhood_id uuid,
  p_location        extensions.geography(point,4326)
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_city_id uuid;
  v_id      uuid;
begin
  -- Single city today. Becomes a join when neighborhoods gain a city link.
  select id into v_city_id from public.cities where is_active order by created_at limit 1;

  insert into public.city_entities as e
    (kind, source_table, source_id, city_id, neighborhood_id, name, location)
  values
    (p_kind, p_source_table, p_source_id, v_city_id, p_neighborhood_id, p_name, p_location)
  on conflict (source_table, source_id) do update set
    kind            = excluded.kind,
    name            = excluded.name,
    neighborhood_id = coalesce(excluded.neighborhood_id, e.neighborhood_id),
    location        = coalesce(excluded.location, e.location),
    city_id         = coalesce(excluded.city_id, e.city_id),
    updated_at      = now()
  returning e.id into v_id;

  -- Every entity that knows its neighborhood gets a located_in edge.
  if p_neighborhood_id is not null then
    insert into public.city_edges (from_entity, to_entity, relation)
    select v_id, n.id, 'located_in'
    from public.city_entities n
    where n.source_table = 'neighborhoods' and n.source_id = p_neighborhood_id
      and n.id <> v_id
    on conflict (from_entity, to_entity, relation) do nothing;
  end if;

  return v_id;
end $$;

-- Primary coordinate for a business, if it has one.
create or replace function public.citygraph_business_point(p_business_id uuid)
returns extensions.geography(point,4326)
language sql stable security definer set search_path = public, extensions as $$
  select extensions.st_setsrid(
           extensions.st_makepoint(l.longitude::float8, l.latitude::float8), 4326
         )::extensions.geography
  from public.business_locations l
  where l.business_id = p_business_id
    and l.latitude is not null and l.longitude is not null
    and coalesce(l.is_active, true)
  order by coalesce(l.is_primary, false) desc, l.created_at
  limit 1;
$$;

-- --------------------------------------------------------- per table syncs

create or replace function public.citygraph_sync_business() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'organization'::public.entity_kind,
    'businesses', new.id, new.name, new.neighborhood_id,
    public.citygraph_business_point(new.id));
  return new;
end $$;

create or replace function public.citygraph_sync_neighborhood() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'neighborhoods', new.id, new.name, new.id, null);
  return new;
end $$;

create or replace function public.citygraph_sync_nonprofit() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'organization'::public.entity_kind, 'nonprofits', new.id, new.name,
    new.neighborhood_id, null);
  return new;
end $$;

-- events and jobs inherit neighborhood and point from their parent business.
create or replace function public.citygraph_sync_event() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_hood uuid; v_point extensions.geography(point,4326);
begin
  select b.neighborhood_id into v_hood from public.businesses b where b.id = new.business_id;
  v_point := public.citygraph_business_point(new.business_id);
  perform public.citygraph_upsert_entity(
    'event'::public.entity_kind, 'events', new.id, new.title, v_hood, v_point);

  -- Business hosts event.
  insert into public.city_edges (from_entity, to_entity, relation)
  select b.id, e.id, 'hosts'
  from public.city_entities b, public.city_entities e
  where b.source_table = 'businesses' and b.source_id = new.business_id
    and e.source_table = 'events'     and e.source_id = new.id
  on conflict (from_entity, to_entity, relation) do nothing;

  return new;
end $$;

create or replace function public.citygraph_sync_job() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_hood uuid; v_point extensions.geography(point,4326);
begin
  select b.neighborhood_id into v_hood from public.businesses b where b.id = new.business_id;
  v_point := public.citygraph_business_point(new.business_id);
  perform public.citygraph_upsert_entity(
    'resource'::public.entity_kind, 'jobs', new.id, new.title, v_hood, v_point);

  insert into public.city_edges (from_entity, to_entity, relation)
  select b.id, j.id, 'employs'
  from public.city_entities b, public.city_entities j
  where b.source_table = 'businesses' and b.source_id = new.business_id
    and j.source_table = 'jobs'       and j.source_id = new.id
  on conflict (from_entity, to_entity, relation) do nothing;

  return new;
end $$;

create trigger trg_citygraph_businesses    after insert or update on public.businesses
  for each row execute function public.citygraph_sync_business();
create trigger trg_citygraph_neighborhoods after insert or update on public.neighborhoods
  for each row execute function public.citygraph_sync_neighborhood();
create trigger trg_citygraph_nonprofits    after insert or update on public.nonprofits
  for each row execute function public.citygraph_sync_nonprofit();
create trigger trg_citygraph_events        after insert or update on public.events
  for each row execute function public.citygraph_sync_event();
create trigger trg_citygraph_jobs          after insert or update on public.jobs
  for each row execute function public.citygraph_sync_job();

-- ------------------------------------------------------------------ fan out

create or replace function public.citygraph_fanout_to_inbox() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.inbox_items (user_id, log_id)
  select f.user_id, new.id
  from public.entity_follows f
  where f.entity_id = new.entity_id
  on conflict (user_id, log_id) do nothing;
  return new;
end $$;

create trigger trg_citygraph_fanout after insert on public.city_events_log
  for each row execute function public.citygraph_fanout_to_inbox();

-- ------------------------------------------- business_follows bridge

-- Existing business follows become entity follows so the new button and the
-- old data agree. Kept in sync both ways is out of scope; the UI writes to
-- entity_follows from here on and business_follows is read only legacy.
create or replace function public.citygraph_bridge_business_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.entity_follows (user_id, entity_id)
    select new.user_id, e.id from public.city_entities e
    where e.source_table = 'businesses' and e.source_id = new.business_id
    on conflict do nothing;
    return new;
  else
    delete from public.entity_follows f using public.city_entities e
    where f.user_id = old.user_id and f.entity_id = e.id
      and e.source_table = 'businesses' and e.source_id = old.business_id;
    return old;
  end if;
end $$;

create trigger trg_citygraph_bridge_business_follow
  after insert or delete on public.business_follows
  for each row execute function public.citygraph_bridge_business_follow();
```

## Backfill (run once, after the migrations)

Order matters: neighborhoods first so the `located_in` edges have a target.

```sql
-- Neighborhoods first, they are the edge target for everything else.
insert into public.city_entities (kind, source_table, source_id, city_id, neighborhood_id, name)
select 'place', 'neighborhoods', n.id,
       (select id from public.cities where is_active order by created_at limit 1),
       n.id, n.name
from public.neighborhoods n
on conflict (source_table, source_id) do nothing;

-- Then let the trigger functions do the rest, uniformly.
select public.citygraph_upsert_entity('organization','businesses', b.id, b.name,
         b.neighborhood_id, public.citygraph_business_point(b.id))
from public.businesses b;

select public.citygraph_upsert_entity('organization','nonprofits', p.id, p.name,
         p.neighborhood_id, null)
from public.nonprofits p;

select public.citygraph_upsert_entity('event','events', e.id, e.title,
         b.neighborhood_id, public.citygraph_business_point(e.business_id))
from public.events e left join public.businesses b on b.id = e.business_id;

select public.citygraph_upsert_entity('resource','jobs', j.id, j.title,
         b.neighborhood_id, public.citygraph_business_point(j.business_id))
from public.jobs j left join public.businesses b on b.id = j.business_id;

-- Existing business follows carried over.
insert into public.entity_follows (user_id, entity_id)
select bf.user_id, e.id
from public.business_follows bf
join public.city_entities e on e.source_table = 'businesses' and e.source_id = bf.business_id
on conflict do nothing;

-- Report.
select kind, count(*) from public.city_entities group by kind order by kind;
select relation, count(*) from public.city_edges group by relation order by relation;
```

**Expected counts on the sandbox as it stands today: 9 `place`, 0 everything else.** The sandbox has
no businesses, events, nonprofits or jobs. So Phase 1 also seeds demo content (roughly 12 businesses
across the 9 neighborhoods with primary locations, 10 events, 6 nonprofits, 8 jobs) before the 20
`city_events_log` rows, otherwise the inbox, the follow button and the "Recent changes" lists all
render empty and there is nothing to screenshot. Seeds are a separate reversible script, not part of
the schema migration.

## Rollback

Drops everything this phase adds and nothing else. `postgis` is left installed; removing it is
riskier than leaving it and it is inert if unused.

```sql
drop trigger if exists trg_citygraph_bridge_business_follow on public.business_follows;
drop trigger if exists trg_citygraph_fanout        on public.city_events_log;
drop trigger if exists trg_citygraph_jobs          on public.jobs;
drop trigger if exists trg_citygraph_events        on public.events;
drop trigger if exists trg_citygraph_nonprofits    on public.nonprofits;
drop trigger if exists trg_citygraph_neighborhoods on public.neighborhoods;
drop trigger if exists trg_citygraph_businesses    on public.businesses;

drop function if exists public.citygraph_bridge_business_follow();
drop function if exists public.citygraph_fanout_to_inbox();
drop function if exists public.citygraph_sync_job();
drop function if exists public.citygraph_sync_event();
drop function if exists public.citygraph_sync_nonprofit();
drop function if exists public.citygraph_sync_neighborhood();
drop function if exists public.citygraph_sync_business();
drop function if exists public.citygraph_business_point(uuid);
drop function if exists public.citygraph_upsert_entity(
  public.entity_kind, text, uuid, text, uuid, extensions.geography);

drop table if exists public.inbox_items;
drop table if exists public.city_events_log;
drop table if exists public.entity_follows;
drop table if exists public.city_edges;
drop table if exists public.city_entities;

drop type if exists public.entity_kind;
```

No existing table is altered by Phase 1, so rollback cannot lose pre-existing data. The only writes
outside the new tables are the two triggers attached to `business_follows`, `businesses`, `events`,
`jobs`, `neighborhoods` and `nonprofits`, and dropping those leaves the source rows untouched.

## What I need from you

1. Approve or amend the SQL above.
2. Confirm the kind mapping (businesses and nonprofits as `organization`, jobs as `resource`).
3. Confirm the demo seed is wanted. Without it Phase 1 ships a working but visibly empty feature.

On approval: apply to `waezoxzkvhuqjzomafee` only, run the backfill, report row counts by kind, then
build the fan out check and the UI.
