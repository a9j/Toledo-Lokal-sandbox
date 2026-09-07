-- Phase 2: the functions My City runs on.
--
-- Everything here is SECURITY DEFINER and scoped to auth.uid(), because a
-- resident's home address is the most sensitive thing this app stores. No
-- function takes a user id as an argument: they all read auth.uid(), so one
-- signed in person can never ask about another's home.

-- ------------------------------------------------------- address lookup

-- Type ahead for the address picker. Public: parcel records are public data,
-- and the picker has to work before anyone has a home set.
create or replace function public.search_parcels(p_query text, p_limit int default 8)
returns table (id uuid, address text, neighborhood_id uuid, neighborhood_name text)
language sql stable set search_path = public, extensions as $$
  select p.id, p.address, p.neighborhood_id, n.name
  from public.parcels p
  left join public.neighborhoods n on n.id = p.neighborhood_id
  where p_query is not null and length(btrim(p_query)) >= 2
    and p.address ilike '%' || btrim(p_query) || '%'
  order by extensions.similarity(p.address, btrim(p_query)) desc, p.address
  limit least(greatest(coalesce(p_limit, 8), 1), 25);
$$;

-- ------------------------------------------------------------- my home

-- Set the caller's home, and follow the parcel and its neighborhood so their
-- changes start arriving in the Civic Inbox. Setting a new home clears any
-- previous verification: the code confirmed the old address, not this one.
create or replace function public.set_home_parcel(p_parcel_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_hood uuid;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;
  if p_parcel_id is null then
    raise exception 'No parcel given';
  end if;

  select neighborhood_id into v_hood from public.parcels where id = p_parcel_id;
  if not found then
    raise exception 'Unknown parcel';
  end if;

  update public.profiles
     set home_parcel_id = p_parcel_id,
         home_verified_at = null,
         updated_at = now()
   where user_id = v_user;

  -- Auto follow the home and the neighborhood it sits in.
  insert into public.entity_follows (user_id, entity_id)
  select v_user, public.citygraph_entity_id('parcels', p_parcel_id)
  where public.citygraph_entity_id('parcels', p_parcel_id) is not null
  on conflict do nothing;

  if v_hood is not null then
    insert into public.entity_follows (user_id, entity_id)
    select v_user, public.citygraph_entity_id('neighborhoods', v_hood)
    where public.citygraph_entity_id('neighborhoods', v_hood) is not null
    on conflict do nothing;
  end if;
end $$;

-- Everything the My Home card needs, in one round trip. Returns no row when the
-- caller has not set a home yet.
create or replace function public.my_home()
returns table (
  parcel_id        uuid,
  address          text,
  neighborhood_id  uuid,
  neighborhood_name text,
  council_district text,
  precinct         text,
  school_district  text,
  refuse_day       text,
  recycling_week   text,
  snow_route       text,
  tax_year_amount  numeric,
  assessed_value   numeric,
  verified_at      timestamptz,
  source           text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.address, p.neighborhood_id, n.name,
         p.council_district, p.precinct, p.school_district,
         p.refuse_day, p.recycling_week, p.snow_route,
         p.tax_year_amount, p.assessed_value,
         pr.home_verified_at,
         coalesce(p.raw ->> 'source', 'unknown')
  from public.profiles pr
  join public.parcels p on p.id = pr.home_parcel_id
  left join public.neighborhoods n on n.id = p.neighborhood_id
  where pr.user_id = auth.uid();
$$;

-- ------------------------------------------------------------- near me

-- Recent changes within a radius of the caller's home. This is the Near Me card
-- and, later, the distance half of Ask Toledo.
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
  distance_miles numeric
)
language sql stable security definer set search_path = public, extensions as $$
  with home as (
    select p.location as loc
    from public.profiles pr
    join public.parcels p on p.id = pr.home_parcel_id
    where pr.user_id = auth.uid()
  )
  select l.id, e.id, e.name, e.source_table, e.source_id,
         l.event_type, l.title, l.body, coalesce(l.occurs_at, l.created_at),
         round((extensions.st_distance(e.location, home.loc) / 1609.344)::numeric, 2)
  from public.city_events_log l
  join public.city_entities e on e.id = l.entity_id
  cross join home
  where home.loc is not null
    and e.location is not null
    and extensions.st_dwithin(e.location, home.loc,
          greatest(coalesce(p_radius_miles, 0.5), 0.05) * 1609.344)
  order by coalesce(l.occurs_at, l.created_at) desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

-- Businesses near the caller's home, newest first. Feeds "New Businesses Near
-- Me" and, with a different order, "Deals Near Me".
create or replace function public.my_city_nearby_businesses(
  p_radius_miles numeric default 1,
  p_limit int default 10
)
returns table (
  business_id uuid,
  name text,
  category text,
  address text,
  created_at timestamptz,
  distance_miles numeric
)
language sql stable security definer set search_path = public, extensions as $$
  with home as (
    select p.location as loc
    from public.profiles pr
    join public.parcels p on p.id = pr.home_parcel_id
    where pr.user_id = auth.uid()
  )
  select b.id, b.name, b.category::text, b.address, b.created_at,
         round((extensions.st_distance(e.location, home.loc) / 1609.344)::numeric, 2)
  from public.businesses b
  join public.city_entities e
    on e.source_table = 'businesses' and e.source_id = b.id
  cross join home
  where home.loc is not null
    and e.location is not null
    and b.status = 'approved'
    and extensions.st_dwithin(e.location, home.loc,
          greatest(coalesce(p_radius_miles, 1), 0.05) * 1609.344)
  order by b.created_at desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

-- ------------------------------------------------------------- grants

revoke execute on function public.search_parcels(text, int)            from public;
revoke execute on function public.set_home_parcel(uuid)                from public, anon;
revoke execute on function public.my_home()                            from public, anon;
revoke execute on function public.my_city_near_me(numeric, int)        from public, anon;
revoke execute on function public.my_city_nearby_businesses(numeric, int) from public, anon;

grant execute on function public.search_parcels(text, int)             to anon, authenticated;
grant execute on function public.set_home_parcel(uuid)                 to authenticated;
grant execute on function public.my_home()                             to authenticated;
grant execute on function public.my_city_near_me(numeric, int)         to authenticated;
grant execute on function public.my_city_nearby_businesses(numeric, int) to authenticated;
