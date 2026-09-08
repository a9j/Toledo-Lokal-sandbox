-- City OS Phase 0, Step 8: modular city architecture.
--
-- cities already carries slug, name, region, tagline, primary_color,
-- accent_color, logo_url and is_active. This adds the config the app needs to
-- stop hardcoding Toledo: a timezone, a centre point, a default radius,
-- feature flags and the data sources that belong to the city.
--
-- config is one jsonb column rather than fifteen columns because a second
-- city is a configuration change, not a migration. The reader function pins
-- the shape so the client is not guessing at keys.

alter table public.cities
  add column if not exists config jsonb not null default '{}'::jsonb;

comment on column public.cities.config is
  'Everything about a city that is configuration: timezone, centre, radius, flags, sources.';

-- Toledo's own values. The centre is the middle of the seeded parcels, which
-- is the honest centre of the data we hold rather than a landmark.
update public.cities c
   set config = c.config || jsonb_build_object(
     'timezone',        'America/New_York',
     'center',          jsonb_build_object(
                          'lat', round(x.lat::numeric, 6),
                          'lng', round(x.lng::numeric, 6)),
     'default_radius_miles', 3,
     'units',           'imperial',
     'feature_flags',   jsonb_build_object(
                          'city_search',    true,
                          'semantic_search', false,
                          'connectors',     true,
                          'notifications',  true,
                          'ask_toledo',     true),
     'data_source_ids', coalesce(
                          (select jsonb_agg(d.id order by d.name)
                             from public.data_sources d where d.city_id = c.id),
                          '[]'::jsonb))
  from (
    select avg(extensions.st_y(p.location::extensions.geometry)) as lat,
           avg(extensions.st_x(p.location::extensions.geometry)) as lng
      from public.parcels p where p.location is not null
  ) x
 where c.slug = 'toledo';

-- One shape, so the client is never guessing which keys exist. Readable by
-- everyone: a city's name and centre are not secrets.
create or replace function public.city_config(p_slug text default 'toledo')
returns table (
  id             uuid,
  slug           text,
  name           text,
  region         text,
  tagline        text,
  primary_color  text,
  accent_color   text,
  logo_url       text,
  timezone       text,
  center_lat     numeric,
  center_lng     numeric,
  default_radius_miles numeric,
  units          text,
  feature_flags  jsonb,
  data_source_ids jsonb,
  is_active      boolean
)
language sql stable security invoker set search_path = public as $$
  select c.id, c.slug, c.name, c.region, c.tagline,
         c.primary_color, c.accent_color, c.logo_url,
         coalesce(c.config ->> 'timezone', 'America/New_York'),
         coalesce((c.config -> 'center' ->> 'lat')::numeric, 41.6528),
         coalesce((c.config -> 'center' ->> 'lng')::numeric, -83.5379),
         coalesce((c.config ->> 'default_radius_miles')::numeric, 3),
         coalesce(c.config ->> 'units', 'imperial'),
         coalesce(c.config -> 'feature_flags', '{}'::jsonb),
         coalesce(c.config -> 'data_source_ids', '[]'::jsonb),
         c.is_active
    from public.cities c
   where c.slug = coalesce(nullif(btrim(p_slug), ''), 'toledo')
   limit 1;
$$;

grant execute on function public.city_config(text) to anon, authenticated;

-- Which public tables are scoped to a city, and which are not. The roadmap
-- asks to confirm this rather than to change it, and changing it would be a
-- data migration across tables this phase does not own. The answer is in the
-- report; this function is how it was produced, so anyone can re-check it.
create or replace function public.city_scoping_audit()
returns table (table_name text, has_city_id boolean, row_count bigint)
language plpgsql stable security definer set search_path = public as $$
declare r record; v_count bigint;
begin
  for r in
    select t.table_name::text as name,
           exists (select 1 from information_schema.columns c
                    where c.table_schema = 'public' and c.table_name = t.table_name
                      and c.column_name = 'city_id') as scoped
      from information_schema.tables t
     where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
     order by t.table_name
  loop
    execute format('select count(*) from public.%I', r.name) into v_count;
    table_name := r.name; has_city_id := r.scoped; row_count := v_count;
    return next;
  end loop;
end $$;

revoke execute on function public.city_scoping_audit() from public, anon, authenticated;
