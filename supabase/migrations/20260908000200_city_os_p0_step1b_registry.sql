-- City OS Phase 0, Step 1b: the CityGraph registry, extended.
--
-- The sandbox already has city_entities, city_edges, the upsert function and
-- sync triggers for businesses, events, neighborhoods, nonprofits, jobs,
-- parcels, developments, spaces, issues and opportunities (PR #1). This step
-- brings the registry up to the roadmap's Step 1 without dropping or renaming
-- anything:
--
--   1. Existing rows move from the seven coarse kinds to the roadmap's finer
--      ones (businesses become business, parcels become property, and so on).
--   2. lokal_place_id and lokal_org_id become generated aliases of id. One ID.
--   3. cities, business_locations, programs and deals are registered, with
--      sync triggers, delete triggers, located_in edges and hosts edges.
--   4. citygraph_search keeps working: the coarse kind names Ask Toledo sends
--      ("organization", "place", "resource") expand to their new families.
--
-- Requires Step 1a (the enum values) to have been applied in an earlier
-- transaction.

-- ---------------------------------------------------------------- 0. tables
-- On a database that never had PR #1 these create the tables to spec. On the
-- sandbox they are no-ops.

create table if not exists public.city_entities (
  id              uuid primary key default gen_random_uuid(),
  kind            public.entity_kind not null,
  source_table    text not null,
  source_id       uuid not null,
  city_id         uuid references public.cities(id),
  neighborhood_id uuid references public.neighborhoods(id),
  name            text not null,
  location        extensions.geography(point, 4326),
  search_blurb    text,
  search_text     tsvector,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (source_table, source_id)
);
create index if not exists city_entities_location_idx  on public.city_entities using gist (location);
create index if not exists city_entities_search_idx    on public.city_entities using gin (search_text);
create index if not exists city_entities_kind_hood_idx on public.city_entities (kind, neighborhood_id);

create table if not exists public.city_edges (
  id          uuid primary key default gen_random_uuid(),
  from_entity uuid not null references public.city_entities(id) on delete cascade,
  to_entity   uuid not null references public.city_entities(id) on delete cascade,
  relation    text not null,
  weight      numeric not null default 1,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  unique (from_entity, to_entity, relation)
);
create index if not exists city_edges_from_idx on public.city_edges (from_entity, relation);
create index if not exists city_edges_to_idx   on public.city_edges (to_entity, relation);

-- ------------------------------------------------------------ 1. one ID only
-- Both aliases are the row's own id, filled only for the kinds the roadmap
-- names. Generated and stored, so they can be indexed and selected but never
-- diverge from id.

alter table public.city_entities
  add column if not exists lokal_place_id uuid
    generated always as (case when kind in ('place', 'business') then id end) stored,
  add column if not exists lokal_org_id uuid
    generated always as (case when kind = 'organization' then id end) stored;

comment on column public.city_entities.lokal_place_id is
  'Alias of id for kinds place and business. id is the canonical ID; there is no second ID system.';
comment on column public.city_entities.lokal_org_id is
  'Alias of id for kind organization. id is the canonical ID; there is no second ID system.';

-- ------------------------------------------------- 2. kind families for search
-- Ask Toledo and older callers send the coarse names. Each expands to the
-- kinds that now make it up. A fine name matches itself.

create or replace function public.citygraph_kind_matches(p_kind public.entity_kind, p_wanted text[])
returns boolean
language sql immutable as $$
  select p_kind::text = any(p_wanted)
      or ('organization' = any(p_wanted) and p_kind in ('organization', 'business'))
      or ('place'        = any(p_wanted) and p_kind in ('place', 'property', 'neighborhood', 'project'))
      or ('resource'     = any(p_wanted) and p_kind in ('resource', 'job', 'opportunity', 'deal'));
$$;

do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'citygraph_search';
  if v_def is not null then
    execute replace(v_def,
      'where e.kind::text = any(v_kinds)',
      'where public.citygraph_kind_matches(e.kind, v_kinds)');
  end if;
end $$;

-- ---------------------------------------------- 3. existing syncs, finer kinds
-- Same bodies as before; only the kind literal changes.

create or replace function public.citygraph_sync_business() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'business'::public.entity_kind, 'businesses', new.id, new.name,
    new.neighborhood_id, public.citygraph_business_point(new.id),
    concat_ws(' ', replace(new.category::text, '_', ' '), new.description, new.address, new.story));
  return new;
end $$;

create or replace function public.citygraph_sync_neighborhood() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'neighborhood'::public.entity_kind, 'neighborhoods', new.id, new.name, new.id,
    null::extensions.geography,
    concat_ws(' ', 'neighborhood area district', new.name));
  return new;
end $$;

create or replace function public.citygraph_sync_parcel() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'property'::public.entity_kind, 'parcels', new.id, new.address,
    new.neighborhood_id, new.location,
    concat_ws(' ', 'address parcel', new.address, new.school_district));
  return new;
end $$;

create or replace function public.citygraph_sync_job() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_hood uuid; v_point extensions.geography(point,4326); v_job uuid;
begin
  select b.neighborhood_id into v_hood from public.businesses b where b.id = new.business_id;
  v_point := public.citygraph_business_point(new.business_id);
  v_job := public.citygraph_upsert_entity(
    'job'::public.entity_kind, 'jobs', new.id, new.title, v_hood, v_point,
    concat_ws(' ', 'job hiring', new.job_type, new.description, new.requirements, new.location_text));

  insert into public.city_edges (from_entity, to_entity, relation)
  select b.id, v_job, 'employs'
  from public.city_entities b
  where b.source_table = 'businesses' and b.source_id = new.business_id and b.id <> v_job
  on conflict (from_entity, to_entity, relation) do nothing;

  return new;
end $$;

create or replace function public.citygraph_sync_opportunity() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'opportunity'::public.entity_kind, 'opportunities', new.id, new.title,
    null, null,
    concat_ws(' ', 'opportunity help assistance program grant',
              new.category, new.provider, new.description,
              array_to_string(new.life_events, ' ')));
  return new;
end $$;

-- citygraph_sync_development keeps its change-log behaviour; only the kind
-- literal moves from place to project.
do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'citygraph_sync_development';
  if v_def is not null then
    execute replace(v_def,
      '''place''::public.entity_kind, ''developments''',
      '''project''::public.entity_kind, ''developments''');
  end if;
end $$;

-- Move the rows. One statement per source table, so the counts are auditable.
update public.city_entities set kind = 'business',     updated_at = now() where source_table = 'businesses'    and kind <> 'business';
update public.city_entities set kind = 'neighborhood', updated_at = now() where source_table = 'neighborhoods' and kind <> 'neighborhood';
update public.city_entities set kind = 'property',     updated_at = now() where source_table = 'parcels'       and kind <> 'property';
update public.city_entities set kind = 'job',          updated_at = now() where source_table = 'jobs'          and kind <> 'job';
update public.city_entities set kind = 'opportunity',  updated_at = now() where source_table = 'opportunities' and kind <> 'opportunity';
update public.city_entities set kind = 'project',      updated_at = now() where source_table = 'developments'  and kind <> 'project';

-- ------------------------------------------------- 4. four new source tables

-- cities: a place with no neighborhood. Its point arrives with the Step 8
-- config; until then location is null.
create or replace function public.citygraph_sync_city() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'cities', new.id, new.name, null, null,
    concat_ws(' ', 'city', new.name, new.region, new.tagline));
  return new;
end $$;

drop trigger if exists trg_citygraph_cities on public.cities;
create trigger trg_citygraph_cities
  after insert or update of name, region, tagline on public.cities
  for each row execute function public.citygraph_sync_city();
drop trigger if exists trg_citygraph_del_cities on public.cities;
create trigger trg_citygraph_del_cities
  before delete on public.cities
  for each row execute function public.citygraph_deregister_entity('cities');

-- business_locations: each address a business has is a place of its own,
-- linked to the business with part_of. The existing trigger that keeps the
-- parent business's point fresh stays as it is.
create or replace function public.citygraph_sync_business_location_entity() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_biz_name text; v_hood uuid; v_point extensions.geography(point,4326); v_entity uuid;
begin
  select b.name into v_biz_name from public.businesses b where b.id = new.business_id;
  if v_biz_name is null then return new; end if;

  -- business_locations records the neighborhood by name.
  select n.id into v_hood from public.neighborhoods n
  where new.neighborhood is not null and lower(n.name) = lower(new.neighborhood)
  limit 1;

  if new.latitude is not null and new.longitude is not null then
    v_point := extensions.st_setsrid(
      extensions.st_makepoint(new.longitude::float8, new.latitude::float8), 4326)::extensions.geography;
  end if;

  v_entity := public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'business_locations', new.id,
    case when nullif(trim(coalesce(new.label, '')), '') is not null
         then v_biz_name || ' (' || trim(new.label) || ')' else v_biz_name end,
    v_hood, v_point,
    concat_ws(' ', 'location address', v_biz_name, new.label, new.street_address, new.neighborhood));

  insert into public.city_edges (from_entity, to_entity, relation)
  select v_entity, b.id, 'part_of'
  from public.city_entities b
  where b.source_table = 'businesses' and b.source_id = new.business_id and b.id <> v_entity
  on conflict (from_entity, to_entity, relation) do nothing;

  return new;
end $$;

drop trigger if exists trg_citygraph_business_locations_entity on public.business_locations;
create trigger trg_citygraph_business_locations_entity
  after insert or update on public.business_locations
  for each row execute function public.citygraph_sync_business_location_entity();
drop trigger if exists trg_citygraph_del_business_locations on public.business_locations;
create trigger trg_citygraph_del_business_locations
  before delete on public.business_locations
  for each row execute function public.citygraph_deregister_entity('business_locations');

-- programs: a resource residents can use.
create or replace function public.citygraph_sync_program() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'resource'::public.entity_kind, 'programs', new.id, new.title, null, null,
    concat_ws(' ', 'program', new.overview, new.eligibility, new.benefits));
  return new;
end $$;

drop trigger if exists trg_citygraph_programs on public.programs;
create trigger trg_citygraph_programs
  after insert or update on public.programs
  for each row execute function public.citygraph_sync_program();
drop trigger if exists trg_citygraph_del_programs on public.programs;
create trigger trg_citygraph_del_programs
  before delete on public.programs
  for each row execute function public.citygraph_deregister_entity('programs');

-- deals: sit at the business, linked with offers.
create or replace function public.citygraph_sync_deal() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_hood uuid; v_point extensions.geography(point,4326); v_deal uuid;
begin
  select b.neighborhood_id into v_hood from public.businesses b where b.id = new.business_id;
  v_point := public.citygraph_business_point(new.business_id);
  v_deal := public.citygraph_upsert_entity(
    'deal'::public.entity_kind, 'deals', new.id, new.title, v_hood, v_point,
    concat_ws(' ', 'deal offer discount', new.deal_type, new.description, new.terms));

  insert into public.city_edges (from_entity, to_entity, relation)
  select b.id, v_deal, 'offers'
  from public.city_entities b
  where b.source_table = 'businesses' and b.source_id = new.business_id and b.id <> v_deal
  on conflict (from_entity, to_entity, relation) do nothing;

  return new;
end $$;

drop trigger if exists trg_citygraph_deals on public.deals;
create trigger trg_citygraph_deals
  after insert or update on public.deals
  for each row execute function public.citygraph_sync_deal();
drop trigger if exists trg_citygraph_del_deals on public.deals;
create trigger trg_citygraph_del_deals
  before delete on public.deals
  for each row execute function public.citygraph_deregister_entity('deals');

-- The trigger bodies run as definer; nobody calls them by hand.
revoke execute on function public.citygraph_sync_city() from public, anon, authenticated;
revoke execute on function public.citygraph_sync_business_location_entity() from public, anon, authenticated;
revoke execute on function public.citygraph_sync_program() from public, anon, authenticated;
revoke execute on function public.citygraph_sync_deal() from public, anon, authenticated;
grant  execute on function public.citygraph_kind_matches(public.entity_kind, text[]) to anon, authenticated;

-- ---------------------------------------------------------------- 5. backfill
-- A no-op update fires each sync trigger once per row. Businesses are
-- included so their kind and located_in edges are re-checked, and nothing
-- else about them changes.
update public.cities             set name = name;
update public.business_locations set business_id = business_id;
update public.programs           set title = title;
update public.deals              set title = title;

-- -------------------------------------------------------------------- 6. RLS
-- Read for everyone, write for platform admins. The service role bypasses RLS
-- by design. Already true on the sandbox; stated here so a fresh database gets
-- the same.
alter table public.city_entities enable row level security;
alter table public.city_edges    enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'city_entities' and policyname = 'city_entities_read') then
    create policy city_entities_read  on public.city_entities for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'city_entities' and policyname = 'city_entities_write') then
    create policy city_entities_write on public.city_entities for all
      using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'city_edges' and policyname = 'city_edges_read') then
    create policy city_edges_read  on public.city_edges for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'city_edges' and policyname = 'city_edges_write') then
    create policy city_edges_write on public.city_edges for all
      using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));
  end if;
end $$;
