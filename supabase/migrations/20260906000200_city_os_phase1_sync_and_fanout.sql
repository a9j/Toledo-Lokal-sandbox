-- Phase 1: keep city_entities in step with the tables that own the data, and
-- fan the change log out to followers.

-- Upsert one registry row plus its located_in edge. Called by the per table
-- triggers below and by the backfill.
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

-- Primary coordinate for a business, if it has one. Only business_locations
-- carries lat/lng today, so this is the single source of geometry until the
-- Phase 2 parcels land.
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
declare v_hood uuid; v_point extensions.geography(point,4326); v_event uuid;
begin
  select b.neighborhood_id into v_hood from public.businesses b where b.id = new.business_id;
  v_point := public.citygraph_business_point(new.business_id);
  v_event := public.citygraph_upsert_entity(
    'event'::public.entity_kind, 'events', new.id, new.title, v_hood, v_point);

  -- Business hosts event.
  insert into public.city_edges (from_entity, to_entity, relation)
  select b.id, v_event, 'hosts'
  from public.city_entities b
  where b.source_table = 'businesses' and b.source_id = new.business_id
    and b.id <> v_event
  on conflict (from_entity, to_entity, relation) do nothing;

  return new;
end $$;

create or replace function public.citygraph_sync_job() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_hood uuid; v_point extensions.geography(point,4326); v_job uuid;
begin
  select b.neighborhood_id into v_hood from public.businesses b where b.id = new.business_id;
  v_point := public.citygraph_business_point(new.business_id);
  v_job := public.citygraph_upsert_entity(
    'resource'::public.entity_kind, 'jobs', new.id, new.title, v_hood, v_point);

  insert into public.city_edges (from_entity, to_entity, relation)
  select b.id, v_job, 'employs'
  from public.city_entities b
  where b.source_table = 'businesses' and b.source_id = new.business_id
    and b.id <> v_job
  on conflict (from_entity, to_entity, relation) do nothing;

  return new;
end $$;

drop trigger if exists trg_citygraph_businesses    on public.businesses;
drop trigger if exists trg_citygraph_neighborhoods on public.neighborhoods;
drop trigger if exists trg_citygraph_nonprofits    on public.nonprofits;
drop trigger if exists trg_citygraph_events        on public.events;
drop trigger if exists trg_citygraph_jobs          on public.jobs;

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

-- A business location changing moves the business point and everything that
-- inherits it.
create or replace function public.citygraph_sync_business_location() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_business uuid;
begin
  v_business := coalesce(new.business_id, old.business_id);
  update public.city_entities e
     set location = public.citygraph_business_point(v_business), updated_at = now()
   where e.source_table = 'businesses' and e.source_id = v_business;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_citygraph_business_locations on public.business_locations;
create trigger trg_citygraph_business_locations
  after insert or update or delete on public.business_locations
  for each row execute function public.citygraph_sync_business_location();

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

drop trigger if exists trg_citygraph_fanout on public.city_events_log;
create trigger trg_citygraph_fanout after insert on public.city_events_log
  for each row execute function public.citygraph_fanout_to_inbox();

-- --------------------------------------------- business_follows bridge

-- Existing business follows become entity follows so the new button and the
-- old data agree. The UI writes to entity_follows from here on;
-- business_follows stays readable legacy and is mirrored forward.
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

drop trigger if exists trg_citygraph_bridge_business_follow on public.business_follows;
create trigger trg_citygraph_bridge_business_follow
  after insert or delete on public.business_follows
  for each row execute function public.citygraph_bridge_business_follow();

-- --------------------------------------------------- read side helpers

-- Unread civic inbox count for the caller. Used by the tab bar badge.
create or replace function public.inbox_unread_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.inbox_items
  where user_id = auth.uid() and read_at is null;
$$;

-- Resolve the entity id for a source row, so the UI can pass
-- ('businesses', id) without holding the registry id.
create or replace function public.citygraph_entity_id(p_source_table text, p_source_id uuid)
returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.city_entities
  where source_table = p_source_table and source_id = p_source_id;
$$;

grant execute on function public.inbox_unread_count() to authenticated;
grant execute on function public.citygraph_entity_id(text, uuid) to anon, authenticated;

-- Follower count for an entity. entity_follows is readable only by its owner,
-- so the public count has to come through a definer function, the same shape
-- the existing business_follower_count already uses.
create or replace function public.entity_follower_count(_entity_id uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.entity_follows where entity_id = _entity_id;
$$;

grant execute on function public.entity_follower_count(uuid) to anon, authenticated;

-- Reverse bridge: entity_follows back to business_follows.
--
-- The UI writes to entity_follows from Phase 1 onward, but the admin followers
-- panel and the business dashboard still count business_follows. Without this
-- those numbers would freeze the day the new button ships.
--
-- The two bridges do not loop: each writes with on conflict do nothing (or
-- deletes rows that are already gone), and a statement that changes no row
-- fires no row level trigger, so the second hop terminates.
create or replace function public.citygraph_bridge_entity_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.business_follows (user_id, business_id)
    select new.user_id, e.source_id from public.city_entities e
    where e.id = new.entity_id and e.source_table = 'businesses'
    on conflict do nothing;
    return new;
  else
    delete from public.business_follows bf
    using public.city_entities e
    where e.id = old.entity_id and e.source_table = 'businesses'
      and bf.user_id = old.user_id and bf.business_id = e.source_id;
    return old;
  end if;
end $$;

drop trigger if exists trg_citygraph_bridge_entity_follow on public.entity_follows;
create trigger trg_citygraph_bridge_entity_follow
  after insert or delete on public.entity_follows
  for each row execute function public.citygraph_bridge_entity_follow();
