-- Phase 2 fix: Near Me was silently dropping the changes it most needs.
--
-- my_city_near_me matched entities by distance, which requires a location. But
-- neighborhood entities have none, and neighborhood level rows are exactly what
-- Near Me is for: closures, permits, meetings. Every one of them was being
-- filtered out, so the card looked empty even where the city was busy.
--
-- Two changes:
--   1. Give each neighborhood a centroid, computed from the parcels inside it,
--      so neighborhoods can appear on maps and in distance queries at all.
--   2. Always include changes logged against the caller's own neighborhood,
--      whatever the radius. A closure on your street is yours regardless of how
--      far the centroid happens to fall from your door.

update public.city_entities e
   set location = c.centroid, updated_at = now()
  from (
    select p.neighborhood_id,
           extensions.st_centroid(extensions.st_collect(p.location::extensions.geometry))
             ::extensions.geography as centroid
    from public.parcels p
    where p.neighborhood_id is not null and p.location is not null
    group by p.neighborhood_id
  ) c
 where e.source_table = 'neighborhoods'
   and e.source_id = c.neighborhood_id
   and e.location is distinct from c.centroid;

-- Keep it that way: a new or moved parcel nudges its neighborhood centroid.
create or replace function public.citygraph_refresh_neighborhood_centroid() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_hood uuid;
begin
  v_hood := coalesce(new.neighborhood_id, old.neighborhood_id);
  if v_hood is null then
    return coalesce(new, old);
  end if;

  update public.city_entities e
     set location = (
           select extensions.st_centroid(extensions.st_collect(p.location::extensions.geometry))
                    ::extensions.geography
           from public.parcels p
           where p.neighborhood_id = v_hood and p.location is not null),
         updated_at = now()
   where e.source_table = 'neighborhoods' and e.source_id = v_hood;

  return coalesce(new, old);
end $$;

drop trigger if exists trg_citygraph_hood_centroid on public.parcels;
create trigger trg_citygraph_hood_centroid
  after insert or update or delete on public.parcels
  for each row execute function public.citygraph_refresh_neighborhood_centroid();

revoke execute on function public.citygraph_refresh_neighborhood_centroid() from public, anon, authenticated;

-- Near Me: within the radius, OR anywhere in my own neighborhood.
create or replace function public.my_city_near_me(
  p_radius_miles numeric default 0.5,
  p_limit int default 20
)
returns table (
  log_id       uuid,
  entity_id    uuid,
  entity_name  text,
  source_table text,
  source_id    uuid,
  event_type   text,
  title        text,
  body         text,
  occurs_at    timestamptz,
  distance_miles numeric,
  scope        text
)
language sql stable security definer set search_path = public, extensions as $$
  with home as (
    select p.location as loc, p.neighborhood_id as hood
    from public.profiles pr
    join public.parcels p on p.id = pr.home_parcel_id
    where pr.user_id = auth.uid()
  )
  select l.id, e.id, e.name, e.source_table, e.source_id,
         l.event_type, l.title, l.body, coalesce(l.occurs_at, l.created_at),
         case when e.location is not null and home.loc is not null
              then round((extensions.st_distance(e.location, home.loc) / 1609.344)::numeric, 2)
         end,
         case when e.neighborhood_id is not distinct from home.hood
                   and e.source_table = 'neighborhoods'
              then 'neighborhood' else 'nearby' end
  from public.city_events_log l
  join public.city_entities e on e.id = l.entity_id
  cross join home
  where (
      -- Anything with a location, inside the radius.
      (e.location is not null and home.loc is not null
       and extensions.st_dwithin(e.location, home.loc,
             greatest(coalesce(p_radius_miles, 0.5), 0.05) * 1609.344))
      -- Plus my own neighborhood, at any distance.
      or (home.hood is not null and e.source_table = 'neighborhoods'
          and e.source_id = home.hood)
    )
  order by coalesce(l.occurs_at, l.created_at) desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

revoke execute on function public.my_city_near_me(numeric, int) from public, anon;
grant   execute on function public.my_city_near_me(numeric, int) to authenticated;
