-- Review fixes, found by a full pass over the branch after Phase 7.
--
-- Seven problems, in order of how much they mattered. Each one is stated with
-- what would actually have gone wrong, because "fixed a bug" is not a record.

-- 1. The neighborhoods trigger has been broken since Phase 3.
--
-- Phase 3 added a seven argument citygraph_upsert_entity(..., p_blurb) beside
-- the six argument Phase 1 version and redefined the business, nonprofit,
-- event, job and parcel syncs to use it. It did not redefine the neighborhood
-- sync. A six argument call with a null in the last position matches both
-- overloads, so every insert or update on public.neighborhoods raised
-- "function citygraph_upsert_entity(...) is not unique" and rolled back.
-- Confirmed live: `update neighborhoods set name = name` failed. Nothing had
-- touched a neighborhood row since Phase 3, which is why four phases passed
-- without noticing. Fix: give the neighborhood sync a blurb, then drop the six
-- argument overload so this cannot recur.

create or replace function public.citygraph_sync_neighborhood() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'neighborhoods', new.id, new.name, new.id,
    null::extensions.geography,
    concat_ws(' ', 'neighborhood area district', new.name));
  return new;
end $$;

drop function if exists public.citygraph_upsert_entity(
  public.entity_kind, text, uuid, text, uuid, extensions.geography);

-- 2. A key's owner could raise their own rate limit or un-revoke a key.
--
-- api_keys_own was FOR ALL, and authenticated holds UPDATE on the table by
-- default, so `PATCH /rest/v1/api_keys?id=eq.<mine>` with
-- {"rate_limit_per_hour": 100000, "active": true} passed RLS and
-- api_authenticate read the new limit on the next call. Owners now read only;
-- every change goes through create_api_key and revoke_api_key.

drop policy if exists api_keys_own on public.api_keys;
create policy api_keys_own_read on public.api_keys for select
  using (auth.uid() = owner_id);

-- 3. Anyone could mint themselves a gift card.
--
-- wallet_items_write was FOR ALL with an ownership check, and authenticated
-- holds INSERT, so a resident could insert a 500 dollar gift card from any
-- business with any code into their own wallet, and my_wallet_items would
-- render it like an issued one. Owners now read, and mark an item used through
-- one function that changes nothing else. Issuing is an admin action until a
-- business facing path exists.

drop policy if exists wallet_items_write on public.wallet_items;
drop policy if exists wallet_items_admin on public.wallet_items;
create policy wallet_items_admin on public.wallet_items for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create or replace function public.mark_wallet_item_used(p_item_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.wallet_items wi
     set used_at = now()
   where wi.id = p_item_id
     and wi.used_at is null
     and exists (select 1 from public.loop_wallets w
                  where w.id = wi.wallet_id and w.user_id = auth.uid());
  if not found then
    raise exception 'Not your item, or already used.' using errcode = '42501';
  end if;
end $$;

revoke execute on function public.mark_wallet_item_used(uuid) from public, anon;
grant   execute on function public.mark_wallet_item_used(uuid) to authenticated;

-- 4. Moving house kept you following the old one.
--
-- set_home_parcel followed the new parcel and neighborhood but never unfollowed
-- the previous ones, while the My City page says "Your old one stops following
-- along". Every closure on the old street kept reaching the inbox. The old
-- follows now go when the home changes, and only when they actually differ.

create or replace function public.set_home_parcel(p_parcel_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user     uuid := auth.uid();
  v_hood     uuid;
  v_old_parcel uuid;
  v_old_hood   uuid;
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if p_parcel_id is null then raise exception 'No parcel given'; end if;

  select neighborhood_id into v_hood from public.parcels where id = p_parcel_id;
  if not found then raise exception 'Unknown parcel'; end if;

  select rh.parcel_id, p.neighborhood_id into v_old_parcel, v_old_hood
  from public.resident_homes rh
  left join public.parcels p on p.id = rh.parcel_id
  where rh.user_id = v_user;

  insert into public.resident_homes (user_id, parcel_id, verified_at)
  values (v_user, p_parcel_id, null)
  on conflict (user_id) do update
    set parcel_id = excluded.parcel_id, verified_at = null, updated_at = now();

  -- Stop following the old home, and the old neighborhood if it changed.
  if v_old_parcel is not null and v_old_parcel <> p_parcel_id then
    delete from public.entity_follows f
    where f.user_id = v_user
      and f.entity_id = public.citygraph_entity_id('parcels', v_old_parcel);
  end if;
  if v_old_hood is not null and v_old_hood is distinct from v_hood then
    delete from public.entity_follows f
    where f.user_id = v_user
      and f.entity_id = public.citygraph_entity_id('neighborhoods', v_old_hood);
  end if;

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

-- 5. Autopilot was empty for anyone who had not set anything up.
--
-- The `score >= 1.0` floor applied to everyone, and recency alone is always
-- below 1, so a new user with no follows, no home and no topics got nothing,
-- while the page said "Pick none and you get everything near you". The floor
-- now applies only once topics are picked, which is when it means something.

create or replace function public.autopilot_digest(p_limit int default 3, p_days int default 3)
returns table (
  log_id uuid, entity_id uuid, entity_name text, source_table text, source_id uuid,
  event_type text, topic text, title text, body text, occurred_at timestamptz,
  distance_miles numeric, score numeric, reason text
)
language sql stable security invoker set search_path = public, extensions as $$
  with prefs as (
    select coalesce(p.topics, '{}'::text[]) as topics,
           coalesce(p.radius_miles, 2) as radius,
           coalesce(p.digest_enabled, true) as enabled
    from (select 1) one
    left join public.autopilot_preferences p on p.user_id = auth.uid()
  ),
  home as (
    select pa.location as loc, pa.neighborhood_id as hood
    from public.resident_homes rh
    join public.parcels pa on pa.id = rh.parcel_id
    where rh.user_id = auth.uid()
    limit 1
  ),
  candidates as (
    select l.id as log_id, e.id as entity_id, e.name as entity_name,
           e.source_table, e.source_id, l.event_type,
           public.autopilot_topic(l.event_type) as topic,
           l.title, l.body,
           coalesce(l.occurs_at, l.created_at) as occurred_at,
           e.neighborhood_id,
           case when e.location is not null and h.loc is not null
                then round((extensions.st_distance(e.location, h.loc) / 1609.344)::numeric, 2)
           end as distance_miles,
           exists (select 1 from public.entity_follows f
                    where f.user_id = auth.uid() and f.entity_id = e.id) as followed,
           h.hood as home_hood
    from public.city_events_log l
    join public.city_entities e on e.id = l.entity_id
    left join home h on true
    where coalesce(l.occurs_at, l.created_at)
          > now() - (least(greatest(coalesce(p_days, 3), 1), 30) || ' days')::interval
  ),
  scored as (
    select c.*,
           (case when c.followed then 5 else 0 end)
         + (case when c.home_hood is not null and c.neighborhood_id = c.home_hood then 3 else 0 end)
         + (case when c.distance_miles is not null
                  and c.distance_miles <= (select radius from prefs) then 2 else 0 end)
         + (case when (select cardinality(topics) from prefs) > 0
                  and c.topic = any((select topics from prefs)::text[]) then 2 else 0 end)
         + greatest(0, 1 - extract(epoch from (now() - c.occurred_at)) / 259200.0)::numeric
           as score,
           case
             when c.followed then 'You follow this'
             when c.home_hood is not null and c.neighborhood_id = c.home_hood then 'In your neighborhood'
             when c.distance_miles is not null
                  and c.distance_miles <= (select radius from prefs) then 'Close to you'
             when (select cardinality(topics) from prefs) > 0
                  and c.topic = any((select topics from prefs)::text[]) then 'A topic you picked'
             else 'Happening in Toledo'
           end as reason
    from candidates c
  )
  select s.log_id, s.entity_id, s.entity_name, s.source_table, s.source_id,
         s.event_type, s.topic, s.title, s.body, s.occurred_at,
         s.distance_miles, round(s.score, 2), s.reason
  from scored s
  where (select enabled from prefs)
    -- With topics picked, anything scoring on recency alone is noise. With
    -- none picked, recency is the whole point.
    and ((select cardinality(topics) from prefs) = 0 or s.score >= 1.0)
  order by s.score desc, s.occurred_at desc
  limit least(greatest(coalesce(p_limit, 3), 1), 20);
$$;

-- 6. The procurement board was empty for anyone signed out.
--
-- b2b_requests is granted to anon and runs as the caller, but every policy on
-- requests is `to authenticated`, so a visitor to /economy saw nothing. Open
-- B2B requests are public by design; the policy now says so.

drop policy if exists requests_b2b_public on public.requests;
create policy requests_b2b_public on public.requests for select to anon
  using (is_b2b and status = 'open');

-- 7. Typing % or _ into the address search matched everything or nothing.

create or replace function public.search_parcels(p_query text, p_limit int default 8)
returns table (id uuid, address text, neighborhood_id uuid, neighborhood_name text)
language sql stable set search_path = public, extensions as $$
  with q as (
    select btrim(p_query) as raw,
           replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') as escaped
  )
  select p.id, p.address, p.neighborhood_id, n.name
  from public.parcels p
  left join public.neighborhoods n on n.id = p.neighborhood_id
  cross join q
  where q.raw is not null and length(q.raw) >= 2
    and p.address ilike '%' || q.escaped || '%' escape '\'
  order by extensions.similarity(p.address, q.raw) desc, p.address
  limit least(greatest(coalesce(p_limit, 8), 1), 25);
$$;
