-- Phase 3 fix: the CityGraph was only searchable by name.
--
-- city_entities.search_text was generated from `name` alone. So "where can I
-- get coffee" returned nothing, even though a seeded roaster's description says
-- "Small batch coffee roaster and cafe" - the word simply was not indexed. Any
-- question phrased by what a place *does* rather than what it is *called* came
-- back empty, which for Ask Toledo is most of them.
--
-- Entities now carry a `search_blurb`: category, description, address, and
-- anything else worth matching on, maintained by the same sync triggers that
-- keep the registry current. search_text covers name and blurb together, with
-- the name weighted higher so an exact name still wins.

alter table public.city_entities add column if not exists search_blurb text;

alter table public.city_entities drop column if exists search_text;
alter table public.city_entities add column search_text tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(search_blurb, '')), 'B')
  ) stored;

create index if not exists city_entities_search_idx on public.city_entities using gin (search_text);

-- The upsert gains a blurb argument. The old five argument signature is kept
-- working by defaulting it, so nothing that calls it has to change at once.
create or replace function public.citygraph_upsert_entity(
  p_kind            public.entity_kind,
  p_source_table    text,
  p_source_id       uuid,
  p_name            text,
  p_neighborhood_id uuid,
  p_location        extensions.geography(point,4326),
  p_blurb           text default null
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_city_id uuid;
  v_id      uuid;
begin
  select id into v_city_id from public.cities where is_active order by created_at limit 1;

  insert into public.city_entities as e
    (kind, source_table, source_id, city_id, neighborhood_id, name, location, search_blurb)
  values
    (p_kind, p_source_table, p_source_id, v_city_id, p_neighborhood_id, p_name, p_location, p_blurb)
  on conflict (source_table, source_id) do update set
    kind            = excluded.kind,
    name            = excluded.name,
    neighborhood_id = coalesce(excluded.neighborhood_id, e.neighborhood_id),
    location        = coalesce(excluded.location, e.location),
    city_id         = coalesce(excluded.city_id, e.city_id),
    search_blurb    = coalesce(excluded.search_blurb, e.search_blurb),
    updated_at      = now()
  returning e.id into v_id;

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

revoke execute on function public.citygraph_upsert_entity(
  public.entity_kind, text, uuid, text, uuid, extensions.geography, text)
  from public, anon, authenticated;

-- Sync functions now pass a blurb.

create or replace function public.citygraph_sync_business() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'organization'::public.entity_kind, 'businesses', new.id, new.name,
    new.neighborhood_id, public.citygraph_business_point(new.id),
    concat_ws(' ', replace(new.category::text, '_', ' '), new.description, new.address, new.story));
  return new;
end $$;

create or replace function public.citygraph_sync_nonprofit() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'organization'::public.entity_kind, 'nonprofits', new.id, new.name,
    new.neighborhood_id, null,
    concat_ws(' ', 'nonprofit', replace(new.cause_category::text, '_', ' '),
              new.mission_statement, new.what_this_helps, new.address));
  return new;
end $$;

create or replace function public.citygraph_sync_event() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_hood uuid; v_point extensions.geography(point,4326); v_event uuid;
begin
  select b.neighborhood_id into v_hood from public.businesses b where b.id = new.business_id;
  v_point := public.citygraph_business_point(new.business_id);
  v_event := public.citygraph_upsert_entity(
    'event'::public.entity_kind, 'events', new.id, new.title, v_hood, v_point,
    concat_ws(' ', 'event', new.description, new.location_text, new.event_type));

  insert into public.city_edges (from_entity, to_entity, relation)
  select b.id, v_event, 'hosts'
  from public.city_entities b
  where b.source_table = 'businesses' and b.source_id = new.business_id and b.id <> v_event
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
    'resource'::public.entity_kind, 'jobs', new.id, new.title, v_hood, v_point,
    concat_ws(' ', 'job hiring', new.job_type, new.description, new.requirements, new.location_text));

  insert into public.city_edges (from_entity, to_entity, relation)
  select b.id, v_job, 'employs'
  from public.city_entities b
  where b.source_table = 'businesses' and b.source_id = new.business_id and b.id <> v_job
  on conflict (from_entity, to_entity, relation) do nothing;

  return new;
end $$;

create or replace function public.citygraph_sync_parcel() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'parcels', new.id, new.address,
    new.neighborhood_id, new.location,
    concat_ws(' ', 'address parcel', new.address, new.school_district));
  return new;
end $$;

revoke execute on function public.citygraph_sync_business()   from public, anon, authenticated;
revoke execute on function public.citygraph_sync_nonprofit()  from public, anon, authenticated;
revoke execute on function public.citygraph_sync_event()      from public, anon, authenticated;
revoke execute on function public.citygraph_sync_job()        from public, anon, authenticated;
revoke execute on function public.citygraph_sync_parcel()     from public, anon, authenticated;

-- Backfill blurbs for everything already registered.
update public.city_entities e set search_blurb =
  concat_ws(' ', replace(b.category::text, '_', ' '), b.description, b.address, b.story)
from public.businesses b
where e.source_table = 'businesses' and e.source_id = b.id;

update public.city_entities e set search_blurb =
  concat_ws(' ', 'nonprofit', replace(np.cause_category::text, '_', ' '),
            np.mission_statement, np.what_this_helps, np.address)
from public.nonprofits np
where e.source_table = 'nonprofits' and e.source_id = np.id;

update public.city_entities e set search_blurb =
  concat_ws(' ', 'event', ev.description, ev.location_text, ev.event_type)
from public.events ev
where e.source_table = 'events' and e.source_id = ev.id;

update public.city_entities e set search_blurb =
  concat_ws(' ', 'job hiring', j.job_type, j.description, j.requirements, j.location_text)
from public.jobs j
where e.source_table = 'jobs' and e.source_id = j.id;

update public.city_entities e set search_blurb =
  concat_ws(' ', 'address parcel', p.address, p.school_district)
from public.parcels p
where e.source_table = 'parcels' and e.source_id = p.id;

update public.city_entities e set search_blurb = concat_ws(' ', 'neighborhood', n.name)
from public.neighborhoods n
where e.source_table = 'neighborhoods' and e.source_id = n.id;
