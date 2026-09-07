-- Phase 2 security fix: a home address must not live on `profiles`.
--
-- The plan said to add home_parcel_id and home_verified_at to profiles. Doing
-- that literally created a privacy leak, because profiles already carries:
--
--   policy "Public can read basic profile info"  for select  using (true)   [permissive]
--   policy "Require authentication ..."          for all     using (auth.uid() is not null)  [restrictive]
--
-- The restrictive policy only requires being signed in. So any signed in user
-- could select every column of every profile row, and `parcels` is publicly
-- readable, which means any account could have joined the two and read every
-- other resident's home address. A home address is the most sensitive thing
-- this app stores.
--
-- Postgres RLS is row level, not column level, so no policy on profiles fixes
-- this. Column level REVOKE would, but it breaks every existing `select *` on
-- profiles across the app. So the home moves to its own table, where the RLS is
-- simply "yours and only yours", and profiles goes back to what it was.

create table if not exists public.resident_homes (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  parcel_id   uuid not null references public.parcels(id) on delete cascade,
  verified_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Carry over anything already set before this fix.
insert into public.resident_homes (user_id, parcel_id, verified_at)
select p.user_id, p.home_parcel_id, p.home_verified_at
from public.profiles p
where p.home_parcel_id is not null
on conflict (user_id) do nothing;

alter table public.profiles drop column if exists home_parcel_id;
alter table public.profiles drop column if exists home_verified_at;

alter table public.resident_homes enable row level security;

drop policy if exists resident_homes_select on public.resident_homes;
drop policy if exists resident_homes_insert on public.resident_homes;
drop policy if exists resident_homes_update on public.resident_homes;
drop policy if exists resident_homes_delete on public.resident_homes;

-- Yours and only yours. No admin read policy either: there is no product
-- reason for staff to browse residents' home addresses.
create policy resident_homes_select on public.resident_homes for select
  using (auth.uid() = user_id);
create policy resident_homes_insert on public.resident_homes for insert
  with check (auth.uid() = user_id);
create policy resident_homes_update on public.resident_homes for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy resident_homes_delete on public.resident_homes for delete
  using (auth.uid() = user_id);

-- ------------------------------------------ functions, repointed

create or replace function public.set_home_parcel(p_parcel_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_hood uuid;
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if p_parcel_id is null then raise exception 'No parcel given'; end if;

  select neighborhood_id into v_hood from public.parcels where id = p_parcel_id;
  if not found then raise exception 'Unknown parcel'; end if;

  -- A new address clears verification: the code confirmed the old one.
  insert into public.resident_homes (user_id, parcel_id, verified_at)
  values (v_user, p_parcel_id, null)
  on conflict (user_id) do update
    set parcel_id = excluded.parcel_id, verified_at = null, updated_at = now();

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

create or replace function public.my_home()
returns table (
  parcel_id uuid, address text, neighborhood_id uuid, neighborhood_name text,
  council_district text, precinct text, school_district text,
  refuse_day text, recycling_week text, snow_route text,
  tax_year_amount numeric, assessed_value numeric,
  verified_at timestamptz, source text
)
language sql stable security definer set search_path = public as $$
  select p.id, p.address, p.neighborhood_id, n.name,
         p.council_district, p.precinct, p.school_district,
         p.refuse_day, p.recycling_week, p.snow_route,
         p.tax_year_amount, p.assessed_value,
         rh.verified_at, coalesce(p.raw ->> 'source', 'unknown')
  from public.resident_homes rh
  join public.parcels p on p.id = rh.parcel_id
  left join public.neighborhoods n on n.id = p.neighborhood_id
  where rh.user_id = auth.uid();
$$;

create or replace function public.my_city_near_me(
  p_radius_miles numeric default 0.5, p_limit int default 20
)
returns table (
  log_id uuid, entity_id uuid, entity_name text, source_table text, source_id uuid,
  event_type text, title text, body text, occurs_at timestamptz,
  distance_miles numeric, scope text
)
language sql stable security definer set search_path = public, extensions as $$
  with home as (
    select p.location as loc, p.neighborhood_id as hood
    from public.resident_homes rh
    join public.parcels p on p.id = rh.parcel_id
    where rh.user_id = auth.uid()
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
      (e.location is not null and home.loc is not null
       and extensions.st_dwithin(e.location, home.loc,
             greatest(coalesce(p_radius_miles, 0.5), 0.05) * 1609.344))
      or (home.hood is not null and e.source_table = 'neighborhoods'
          and e.source_id = home.hood)
    )
  order by coalesce(l.occurs_at, l.created_at) desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

create or replace function public.my_city_nearby_businesses(
  p_radius_miles numeric default 1, p_limit int default 10
)
returns table (
  business_id uuid, name text, category text, address text,
  created_at timestamptz, distance_miles numeric
)
language sql stable security definer set search_path = public, extensions as $$
  with home as (
    select p.location as loc
    from public.resident_homes rh
    join public.parcels p on p.id = rh.parcel_id
    where rh.user_id = auth.uid()
  )
  select b.id, b.name, b.category::text, b.address, b.created_at,
         round((extensions.st_distance(e.location, home.loc) / 1609.344)::numeric, 2)
  from public.businesses b
  join public.city_entities e
    on e.source_table = 'businesses' and e.source_id = b.id
  cross join home
  where home.loc is not null and e.location is not null
    and b.status = 'approved'
    and extensions.st_dwithin(e.location, home.loc,
          greatest(coalesce(p_radius_miles, 1), 0.05) * 1609.344)
  order by b.created_at desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

create or replace function public.confirm_address_verification(p_code text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user uuid := auth.uid();
  v_row  public.address_verifications%rowtype;
begin
  if v_user is null then raise exception 'Not signed in'; end if;

  select * into v_row from public.address_verifications where user_id = v_user;
  if not found then return jsonb_build_object('ok', false, 'reason', 'no_code'); end if;

  if v_row.expires_at < now() then
    delete from public.address_verifications where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_row.attempts >= 5 then
    delete from public.address_verifications where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'too_many_attempts');
  end if;

  if v_row.code_hash <> extensions.crypt(coalesce(p_code, ''), v_row.code_hash) then
    update public.address_verifications set attempts = attempts + 1 where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'wrong_code',
                              'attempts_left', 4 - v_row.attempts);
  end if;

  update public.resident_homes
     set verified_at = now(), updated_at = now()
   where user_id = v_user and parcel_id = v_row.parcel_id;

  if not found then
    delete from public.address_verifications where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'home_changed');
  end if;

  delete from public.address_verifications where user_id = v_user;
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.set_home_parcel(uuid)                   from public, anon;
revoke execute on function public.my_home()                               from public, anon;
revoke execute on function public.my_city_near_me(numeric, int)           from public, anon;
revoke execute on function public.my_city_nearby_businesses(numeric, int) from public, anon;
revoke execute on function public.confirm_address_verification(text)      from public, anon;

grant execute on function public.set_home_parcel(uuid)                   to authenticated;
grant execute on function public.my_home()                               to authenticated;
grant execute on function public.my_city_near_me(numeric, int)           to authenticated;
grant execute on function public.my_city_nearby_businesses(numeric, int) to authenticated;
grant execute on function public.confirm_address_verification(text)      to authenticated;
