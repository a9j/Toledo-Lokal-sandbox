-- City OS Phase 0, Step 2: address intelligence and the neighborhood engine.
--
-- The sandbox already has parcels (200 seeded rows, every column the roadmap
-- names except zip), a parcel sync into the registry as kind property, and
-- a per neighborhood centroid kept on the neighborhood entity. This step adds
-- what is missing and drops nothing:
--
--   1. parcels.zip, filled from the address.
--   2. neighborhoods.geometry, a MultiPolygon per neighborhood, plus
--      boundary_source. Loaded as the padded extent of each neighborhood's
--      seeded parcels and flagged 'seed'. Virtual has no boundary.
--   3. resolve_address(text): parcels first, polygon second.
--   4. nearby(entity_id, radius_miles, kinds[]): entities by distance.
--   5. A trigger on city_entities that fills a missing neighborhood_id from
--      the polygons, and adds the located_in edge once it does.
--
-- The 200 parcels the roadmap asks for were seeded in PR #1 with
-- raw.source = 'seed'. They are not seeded twice.
--
-- Not done here, on purpose: home_parcel_id and home_verified_at on profiles.
-- See the report; the home already lives in resident_homes.

-- ------------------------------------------------------------- 1. parcels.zip
alter table public.parcels add column if not exists zip text;
update public.parcels
   set zip = substring(address from '(\d{5})(?:-\d{4})?\s*$')
 where zip is null;
create index if not exists parcels_zip_idx      on public.parcels (zip);
create index if not exists parcels_location_idx on public.parcels using gist (location);

-- ------------------------------------------------- 2. neighborhood boundaries
alter table public.neighborhoods
  add column if not exists geometry        extensions.geometry(MultiPolygon, 4326),
  add column if not exists boundary_source text;
create index if not exists neighborhoods_geometry_idx on public.neighborhoods using gist (geometry);
comment on column public.neighborhoods.boundary_source is
  'Where the polygon came from. seed = padded extent of seeded parcels, not a real boundary.';

-- Approximate boundaries: the bounding box of each neighborhood's parcels,
-- padded by 0.005 degrees (about 550 m north to south, 410 m east to west).
-- Neighbouring boxes can overlap; resolve_address and the trigger break a tie
-- by the nearest centroid. Real boundaries replace these in Step 3 when a GIS
-- source is connected.
update public.neighborhoods n
   set geometry = extensions.st_multi(
                    extensions.st_setsrid(
                      extensions.st_expand(x.ext, 0.005)::extensions.geometry, 4326)),
       boundary_source = 'seed'
  from (select p.neighborhood_id,
               extensions.st_extent(p.location::extensions.geometry) as ext
          from public.parcels p
         where p.location is not null
         group by p.neighborhood_id) x
 where x.neighborhood_id = n.id
   and n.geometry is null;

-- Which neighborhood is a point in. Polygons first, nearest centroid to break
-- a tie, then the nearest centroid within two miles when no polygon contains
-- it. Null when nothing is close.
create or replace function public.neighborhood_for_point(p_point extensions.geography)
returns uuid
language sql stable security invoker set search_path = public, extensions as $$
  with inside as (
    select n.id, e.location as centroid
      from public.neighborhoods n
      left join public.city_entities e
        on e.source_table = 'neighborhoods' and e.source_id = n.id
     where n.geometry is not null
       and extensions.st_contains(n.geometry, p_point::extensions.geometry)
     order by extensions.st_distance(e.location, p_point) nulls last
     limit 1
  ),
  near as (
    select e.source_id as id
      from public.city_entities e
     where e.source_table = 'neighborhoods' and e.location is not null
       and extensions.st_dwithin(e.location, p_point, 2 * 1609.344)
     order by extensions.st_distance(e.location, p_point)
     limit 1
  )
  select coalesce((select id from inside), (select id from near));
$$;

-- ---------------------------------------------------------- 3. resolve_address
-- Accepts an address, or "lat, lng". Parcels first (exact, then fuzzy on the
-- address text), then the street, then the zip, then point in polygon when a
-- point was given. Every answer says how it was matched and how sure it is.
create or replace function public.resolve_address(p_query text)
returns table (
  parcel_id         uuid,
  address           text,
  neighborhood_id   uuid,
  neighborhood_name text,
  latitude          double precision,
  longitude         double precision,
  match             text,
  confidence        numeric
)
language plpgsql stable security invoker set search_path = public, extensions as $$
declare
  v_q      text := btrim(coalesce(p_query, ''));
  v_lat    double precision;
  v_lng    double precision;
  v_point  extensions.geography(point, 4326);
  v_street text;
  v_zip    text;
  v_hood   uuid;
begin
  if length(v_q) < 2 then return; end if;

  -- "41.65, -83.54"
  if v_q ~ '^-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$' then
    v_lat := split_part(v_q, ',', 1)::double precision;
    v_lng := split_part(v_q, ',', 2)::double precision;
    v_point := extensions.st_setsrid(extensions.st_makepoint(v_lng, v_lat), 4326)::extensions.geography;

    -- a parcel within 50 m is that parcel
    return query
      select p.id, p.address, p.neighborhood_id, n.name,
             extensions.st_y(p.location::extensions.geometry),
             extensions.st_x(p.location::extensions.geometry),
             'parcel', 0.90::numeric
        from public.parcels p
        left join public.neighborhoods n on n.id = p.neighborhood_id
       where p.location is not null
         and extensions.st_dwithin(p.location, v_point, 50)
       order by extensions.st_distance(p.location, v_point)
       limit 1;
    if found then return; end if;

    v_hood := public.neighborhood_for_point(v_point);
    if v_hood is not null then
      return query
        select null::uuid, null::text, n.id, n.name, v_lat, v_lng,
               case when n.geometry is not null
                     and extensions.st_contains(n.geometry, v_point::extensions.geometry)
                    then 'polygon' else 'nearest' end,
               case when n.geometry is not null
                     and extensions.st_contains(n.geometry, v_point::extensions.geometry)
                    then 0.60 else 0.40 end::numeric
          from public.neighborhoods n where n.id = v_hood;
    end if;
    return;
  end if;

  -- an address: best parcel by trigram similarity, as long as it is a real match
  return query
    select p.id, p.address, p.neighborhood_id, n.name,
           extensions.st_y(p.location::extensions.geometry),
           extensions.st_x(p.location::extensions.geometry),
           case when lower(p.address) = lower(v_q)
                  or lower(p.address) like lower(v_q) || ',%' then 'parcel' else 'parcel_fuzzy' end,
           case when lower(p.address) = lower(v_q)
                  or lower(p.address) like lower(v_q) || ',%' then 0.95
                else round(least(extensions.similarity(p.address, v_q), 0.90)::numeric, 2) end
      from public.parcels p
      left join public.neighborhoods n on n.id = p.neighborhood_id
     where p.address ilike '%' || replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
        or extensions.similarity(p.address, v_q) >= 0.45
     order by (lower(p.address) = lower(v_q)) desc, extensions.similarity(p.address, v_q) desc
     limit 1;
  if found then return; end if;

  -- same street: the neighborhood most of that street's parcels are in
  v_street := btrim(regexp_replace(split_part(v_q, ',', 1), '^\s*\d+[A-Za-z]?\s+', ''));
  if length(v_street) >= 3 then
    return query
      select null::uuid, null::text, s.neighborhood_id, n.name, null::double precision, null::double precision,
             'street', 0.50::numeric
        from (select p.neighborhood_id, count(*) as c
                from public.parcels p
               where p.neighborhood_id is not null
                 and p.address ilike '%' || v_street || '%'
               group by p.neighborhood_id
               order by c desc limit 1) s
        join public.neighborhoods n on n.id = s.neighborhood_id;
    if found then return; end if;
  end if;

  -- zip only
  v_zip := substring(v_q from '(\d{5})(?:-\d{4})?\s*$');
  if v_zip is not null then
    return query
      select null::uuid, null::text, s.neighborhood_id, n.name, null::double precision, null::double precision,
             'zip', 0.30::numeric
        from (select p.neighborhood_id, count(*) as c
                from public.parcels p
               where p.neighborhood_id is not null and p.zip = v_zip
               group by p.neighborhood_id
               order by c desc limit 1) s
        join public.neighborhoods n on n.id = s.neighborhood_id;
  end if;
  return;
end $$;

-- ----------------------------------------------------------------- 4. nearby
create or replace function public.nearby(
  p_entity_id    uuid,
  p_radius_miles numeric default 1,
  p_kinds        text[]  default null,
  p_limit        int     default 50
)
returns table (
  entity_id       uuid,
  kind            text,
  name            text,
  source_table    text,
  source_id       uuid,
  neighborhood_id uuid,
  distance_miles  numeric
)
language sql stable security invoker set search_path = public, extensions as $$
  with origin as (
    select e.location from public.city_entities e where e.id = p_entity_id and e.location is not null
  )
  select e.id, e.kind::text, e.name, e.source_table, e.source_id, e.neighborhood_id,
         round((extensions.st_distance(e.location, o.location) / 1609.344)::numeric, 2)
    from public.city_entities e
   cross join origin o
   where e.id <> p_entity_id
     and e.location is not null
     and extensions.st_dwithin(e.location, o.location,
                               least(greatest(coalesce(p_radius_miles, 1), 0.05), 50) * 1609.344)
     and (p_kinds is null or cardinality(p_kinds) = 0 or public.citygraph_kind_matches(e.kind, p_kinds))
   order by extensions.st_distance(e.location, o.location), e.name
   limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

grant execute on function public.neighborhood_for_point(extensions.geography) to anon, authenticated;
grant execute on function public.resolve_address(text) to anon, authenticated;
grant execute on function public.nearby(uuid, numeric, text[], int) to anon, authenticated;

-- ------------------------------------------- 5. auto assign the neighborhood
create or replace function public.citygraph_assign_neighborhood() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.neighborhood_id is null and new.location is not null then
    new.neighborhood_id := public.neighborhood_for_point(new.location);
  end if;
  return new;
end $$;

create or replace function public.citygraph_link_neighborhood() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.neighborhood_id is not null and new.source_table <> 'neighborhoods' then
    insert into public.city_edges (from_entity, to_entity, relation)
    select new.id, n.id, 'located_in'
      from public.city_entities n
     where n.source_table = 'neighborhoods' and n.source_id = new.neighborhood_id
       and n.id <> new.id
    on conflict (from_entity, to_entity, relation) do nothing;
  end if;
  return new;
end $$;

revoke execute on function public.citygraph_assign_neighborhood() from public, anon, authenticated;
revoke execute on function public.citygraph_link_neighborhood()   from public, anon, authenticated;

drop trigger if exists trg_citygraph_assign_neighborhood on public.city_entities;
create trigger trg_citygraph_assign_neighborhood
  before insert or update of location, neighborhood_id on public.city_entities
  for each row execute function public.citygraph_assign_neighborhood();

drop trigger if exists trg_citygraph_link_neighborhood on public.city_entities;
create trigger trg_citygraph_link_neighborhood
  after insert or update of neighborhood_id on public.city_entities
  for each row execute function public.citygraph_link_neighborhood();

-- Anything already located but unassigned gets its neighborhood now.
update public.city_entities
   set updated_at = now()
 where neighborhood_id is null and location is not null;
