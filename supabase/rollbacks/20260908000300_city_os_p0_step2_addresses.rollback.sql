-- Rollback for Step 2. Removes what it added. parcels and neighborhoods stay.
drop trigger if exists trg_citygraph_link_neighborhood   on public.city_entities;
drop trigger if exists trg_citygraph_assign_neighborhood on public.city_entities;
drop function if exists public.citygraph_link_neighborhood();
drop function if exists public.citygraph_assign_neighborhood();
drop function if exists public.nearby(uuid, numeric, text[], int);
drop function if exists public.resolve_address(text);
drop function if exists public.neighborhood_for_point(extensions.geography);
drop index if exists public.neighborhoods_geometry_idx;
alter table public.neighborhoods
  drop column if exists geometry,
  drop column if exists boundary_source;
drop index if exists public.parcels_zip_idx;
drop index if exists public.parcels_location_idx;
alter table public.parcels drop column if exists zip;
-- Neighborhood assignments the trigger made stay on their entities; they are
-- data, and removing them would remove information the polygon fallback
-- computed correctly. Entities that had a neighborhood before Step 2 are
-- untouched either way.
