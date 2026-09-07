-- Rollback for Step 1b. Returns the registry to its PR #1 shape.
-- Does not drop city_entities or city_edges: they predate this step.

-- 5/4. Remove what this step registered, and their edges (cascade on the FK).
drop trigger if exists trg_citygraph_deals on public.deals;
drop trigger if exists trg_citygraph_del_deals on public.deals;
drop trigger if exists trg_citygraph_programs on public.programs;
drop trigger if exists trg_citygraph_del_programs on public.programs;
drop trigger if exists trg_citygraph_business_locations_entity on public.business_locations;
drop trigger if exists trg_citygraph_del_business_locations on public.business_locations;
drop trigger if exists trg_citygraph_cities on public.cities;
drop trigger if exists trg_citygraph_del_cities on public.cities;
drop function if exists public.citygraph_sync_deal();
drop function if exists public.citygraph_sync_program();
drop function if exists public.citygraph_sync_business_location_entity();
drop function if exists public.citygraph_sync_city();
delete from public.city_entities
 where source_table in ('cities', 'business_locations', 'programs', 'deals');

-- 3. Coarse kinds back, in rows and in the sync functions.
update public.city_entities set kind = 'organization' where source_table = 'businesses';
update public.city_entities set kind = 'place'        where source_table in ('neighborhoods', 'parcels', 'developments');
update public.city_entities set kind = 'resource'     where source_table in ('jobs', 'opportunities');

create or replace function public.citygraph_sync_business() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'organization'::public.entity_kind, 'businesses', new.id, new.name,
    new.neighborhood_id, public.citygraph_business_point(new.id),
    concat_ws(' ', replace(new.category::text, '_', ' '), new.description, new.address, new.story));
  return new;
end $$;

create or replace function public.citygraph_sync_neighborhood() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'neighborhoods', new.id, new.name, new.id,
    null::extensions.geography,
    concat_ws(' ', 'neighborhood area district', new.name));
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

create or replace function public.citygraph_sync_opportunity() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'resource'::public.entity_kind, 'opportunities', new.id, new.title,
    null, null,
    concat_ws(' ', 'opportunity help assistance program grant',
              new.category, new.provider, new.description,
              array_to_string(new.life_events, ' ')));
  return new;
end $$;

do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'citygraph_sync_development';
  if v_def is not null then
    execute replace(v_def,
      '''project''::public.entity_kind, ''developments''',
      '''place''::public.entity_kind, ''developments''');
  end if;
end $$;

-- 2. Search back to the plain kind match.
do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'citygraph_search';
  if v_def is not null then
    execute replace(v_def,
      'where public.citygraph_kind_matches(e.kind, v_kinds)',
      'where e.kind::text = any(v_kinds)');
  end if;
end $$;
drop function if exists public.citygraph_kind_matches(public.entity_kind, text[]);

-- 1. The aliases.
alter table public.city_entities
  drop column if exists lokal_place_id,
  drop column if exists lokal_org_id;

-- 0. Tables and policies predate this step on the sandbox and are left alone.
