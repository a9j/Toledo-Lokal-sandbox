-- Phase 6, part one: the wallet, empty space, business to business requests,
-- and jobs you can actually get to.
--
-- Four changes, three of them extensions of tables that already ship. The rule
-- from the plan holds: extend, do not fork.
--
--   wallet_items  a new table beside loop_wallets. Points stay where they are.
--   spaces        a new table, registered as place entities like developments.
--   requests      four columns, so the same table carries a resident asking for
--                 a plumber and a bakery asking for a flour supplier.
--   jobs          ten boolean filters and a travel estimate from home.

-- ------------------------------------------------------------ wallet items
--
-- loop_wallets holds points and only points: a balance, lifetime earned,
-- lifetime redeemed. A gift card, a bus pass and a museum membership are not
-- points and would be lies if written as points, which is the same reasoning
-- that kept pledges out of loop_transactions in Phase 4. They get their own
-- table, keyed to the wallet, and the wallet screen shows both.

create table if not exists public.wallet_items (
  id          uuid primary key default gen_random_uuid(),
  wallet_id   uuid not null references public.loop_wallets(id) on delete cascade,
  kind        text not null check (kind in
                ('gift_card','ticket','coupon','transit','volunteer_credit','membership')),
  title       text not null,
  issuer      text,
  business_id uuid references public.businesses(id) on delete set null,
  -- Money value in cents, or a count of rides or hours, depending on kind.
  -- Null when the thing has no number on it, like a membership card.
  value_cents int,
  quantity    int not null default 1 check (quantity >= 0),
  code        text,
  barcode_url text,
  expires_at  timestamptz,
  used_at     timestamptz,
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists wallet_items_wallet_idx on public.wallet_items (wallet_id, kind);
create index if not exists wallet_items_live_idx   on public.wallet_items (wallet_id, expires_at)
  where used_at is null;

alter table public.wallet_items enable row level security;

-- A wallet item is yours. There is no admin read policy: staff have no reason
-- to browse which gift cards a resident is holding.
drop policy if exists wallet_items_select on public.wallet_items;
drop policy if exists wallet_items_write  on public.wallet_items;
create policy wallet_items_select on public.wallet_items for select
  using (exists (select 1 from public.loop_wallets w
                  where w.id = wallet_items.wallet_id and w.user_id = auth.uid()));
create policy wallet_items_write on public.wallet_items for all
  using (exists (select 1 from public.loop_wallets w
                  where w.id = wallet_items.wallet_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.loop_wallets w
                       where w.id = wallet_items.wallet_id and w.user_id = auth.uid()));

-- Everything in the caller's wallet that is not points, live items first.
create or replace function public.my_wallet_items(p_include_used boolean default false)
returns table (
  id            uuid,
  kind          text,
  title         text,
  issuer        text,
  business_id   uuid,
  business_name text,
  value_cents   int,
  quantity      int,
  code          text,
  expires_at    timestamptz,
  used_at       timestamptz,
  expired       boolean,
  notes         text
)
language sql stable security invoker set search_path = public as $$
  select wi.id, wi.kind, wi.title, wi.issuer, wi.business_id, b.name,
         wi.value_cents, wi.quantity, wi.code, wi.expires_at, wi.used_at,
         wi.expires_at is not null and wi.expires_at < now(),
         wi.notes
  from public.wallet_items wi
  join public.loop_wallets w on w.id = wi.wallet_id
  left join public.businesses b on b.id = wi.business_id
  where w.user_id = auth.uid()
    and (p_include_used or wi.used_at is null)
  order by wi.used_at nulls first,
           wi.expires_at nulls last,
           wi.created_at desc;
$$;

grant execute on function public.my_wallet_items(boolean) to authenticated;

-- ---------------------------------------------------------------- spaces
--
-- Empty storefronts, offices, yards and kitchens. Registered as place entities
-- so a space can be followed and answered by Ask Toledo like anything else.

create table if not exists public.spaces (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  kind            text not null check (kind in
                    ('storefront','office','warehouse','kitchen','studio','land','popup')),
  parcel_id       uuid references public.parcels(id) on delete set null,
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  address         text,
  location        extensions.geography(point, 4326),
  sqft            int,
  rent_monthly    numeric,
  available_from  date,
  description     text,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  listed_by       uuid references auth.users(id) on delete set null,
  status          text not null default 'available'
                  check (status in ('available','under_offer','let','withdrawn')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists spaces_status_idx       on public.spaces (status, updated_at desc);
create index if not exists spaces_location_idx     on public.spaces using gist (location);
create index if not exists spaces_neighborhood_idx on public.spaces (neighborhood_id);

alter table public.spaces enable row level security;

-- A listing is public while it is live. The person who listed it and admins can
-- see and change it at any status.
drop policy if exists spaces_read   on public.spaces;
drop policy if exists spaces_insert on public.spaces;
drop policy if exists spaces_own    on public.spaces;
drop policy if exists spaces_admin  on public.spaces;
create policy spaces_read on public.spaces for select
  using (status in ('available','under_offer')
         or auth.uid() = listed_by
         or public.is_platform_admin(auth.uid()));
create policy spaces_insert on public.spaces for insert
  with check (auth.uid() = listed_by);
create policy spaces_own on public.spaces for all
  using (auth.uid() = listed_by) with check (auth.uid() = listed_by);
create policy spaces_admin on public.spaces for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Same parcel inheritance as developments: a listing filed against a parcel
-- gets that parcel's point, neighborhood and address for free.
create or replace function public.spaces_fill_from_parcel() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.parcel_id is not null then
    select coalesce(new.location, p.location),
           coalesce(new.neighborhood_id, p.neighborhood_id),
           coalesce(new.address, p.address)
      into new.location, new.neighborhood_id, new.address
    from public.parcels p
    where p.id = new.parcel_id;
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_spaces_fill on public.spaces;
create trigger trg_spaces_fill before insert or update on public.spaces
  for each row execute function public.spaces_fill_from_parcel();

create or replace function public.citygraph_sync_space() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_entity uuid;
begin
  v_entity := public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'spaces', new.id, new.name,
    new.neighborhood_id, new.location,
    concat_ws(' ', 'space to rent lease empty available commercial',
              new.kind, new.address, new.description));

  if new.parcel_id is not null then
    insert into public.city_edges (from_entity, to_entity, relation)
    select v_entity, p.id, 'occupies'
    from public.city_entities p
    where p.source_table = 'parcels' and p.source_id = new.parcel_id
      and p.id <> v_entity
    on conflict (from_entity, to_entity, relation) do nothing;
  end if;

  if tg_op = 'INSERT' and new.status = 'available' then
    insert into public.city_events_log (entity_id, event_type, title, body, occurs_at)
    values (v_entity, 'space_listed',
            new.name || ' is available',
            new.description, now());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.city_events_log (entity_id, event_type, title, body, occurs_at)
    values (v_entity, 'status_change',
            new.name || ' is now ' || replace(new.status, '_', ' '),
            null, now());
  end if;

  return new;
end $$;

drop trigger if exists trg_citygraph_spaces on public.spaces;
create trigger trg_citygraph_spaces after insert or update on public.spaces
  for each row execute function public.citygraph_sync_space();

drop trigger if exists trg_citygraph_spaces_delete on public.spaces;
create trigger trg_citygraph_spaces_delete after delete on public.spaces
  for each row execute function public.citygraph_deregister_entity('spaces');

-- ------------------------------------------------- requests, extended for B2B
--
-- The plan offers a new requests_b2b table or reuse of the existing one. The
-- existing shape fits: title, description, budget range, category, neighborhood,
-- status and an author are exactly what a procurement post needs. Four nullable
-- columns carry the difference, and the shipped RLS still applies unchanged
-- because the author is still a user either way.

alter table public.requests
  add column if not exists poster_entity_id uuid references public.city_entities(id) on delete set null,
  add column if not exists is_b2b           boolean not null default false,
  add column if not exists is_barter        boolean not null default false,
  -- Free text rather than a foreign key: "a sign writer" is not a business
  -- category, and forcing it into one would lose the ask.
  add column if not exists need_category    text;

create index if not exists requests_b2b_idx on public.requests (is_b2b, status, created_at desc);

-- Post a business to business request as one of your own businesses. The
-- poster entity is derived from ownership rather than taken on trust.
create or replace function public.post_b2b_request(
  p_business_id   uuid,
  p_title         text,
  p_description   text default null,
  p_need_category text default null,
  p_budget_min    numeric default null,
  p_budget_max    numeric default null,
  p_is_barter     boolean default false,
  p_needed_by     timestamptz default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_entity uuid; v_hood uuid; v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in to post a request.' using errcode = '42501';
  end if;
  if not public.user_owns_business(p_business_id) then
    raise exception 'You can only post for a business you run.' using errcode = '42501';
  end if;
  if coalesce(trim(p_title), '') = '' then
    raise exception 'Give the request a title.' using errcode = '22023';
  end if;

  select e.id, b.neighborhood_id into v_entity, v_hood
  from public.city_entities e
  join public.businesses b on b.id = e.source_id
  where e.source_table = 'businesses' and e.source_id = p_business_id;

  insert into public.requests
    (created_by_user_id, title, description, budget_min, budget_max,
     needed_by_date_time, status, poster_entity_id, is_b2b, is_barter,
     need_category, neighborhood_id)
  values
    (auth.uid(), trim(p_title), p_description, p_budget_min, p_budget_max,
     p_needed_by, 'open', v_entity, true, coalesce(p_is_barter, false),
     p_need_category, v_hood)
  returning id into v_id;

  return v_id;
end $$;

revoke execute on function public.post_b2b_request(uuid, text, text, text, numeric, numeric, boolean, timestamptz)
  from public, anon;
grant execute on function public.post_b2b_request(uuid, text, text, text, numeric, numeric, boolean, timestamptz)
  to authenticated;

-- Open B2B requests with the posting business resolved. Barter only is the
-- Skill Exchange; everything is Procurement.
create or replace function public.b2b_requests(
  p_barter_only boolean default false,
  p_limit       int default 50
)
returns table (
  id              uuid,
  title           text,
  description     text,
  need_category   text,
  budget_min      numeric,
  budget_max      numeric,
  is_barter       boolean,
  needed_by       timestamptz,
  poster_entity_id uuid,
  poster_name     text,
  poster_business_id uuid,
  neighborhood_name text,
  created_at      timestamptz
)
language sql stable security invoker set search_path = public as $$
  select r.id, r.title, r.description, r.need_category, r.budget_min, r.budget_max,
         r.is_barter, r.needed_by_date_time, r.poster_entity_id, e.name, e.source_id,
         n.name, r.created_at
  from public.requests r
  left join public.city_entities e on e.id = r.poster_entity_id
  left join public.neighborhoods n on n.id = r.neighborhood_id
  where r.is_b2b and r.status = 'open'
    and (not p_barter_only or r.is_barter)
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

grant execute on function public.b2b_requests(boolean, int) to anon, authenticated;

-- ------------------------------------------------------------------- jobs
--
-- Ten filters, as boolean columns. These are the things that actually decide
-- whether someone can take a job here: a car, a record, a shift that fits
-- school. hiring_now already exists and is not duplicated.

alter table public.jobs
  add column if not exists no_experience_needed boolean not null default false,
  add column if not exists transit_accessible   boolean not null default false,
  add column if not exists weekends_only        boolean not null default false,
  add column if not exists evenings_nights      boolean not null default false,
  add column if not exists teen_friendly        boolean not null default false,
  -- "Records considered". Named for what it does, not the euphemism.
  add column if not exists second_chance        boolean not null default false,
  add column if not exists benefits_offered     boolean not null default false,
  add column if not exists training_provided    boolean not null default false,
  add column if not exists weekly_pay           boolean not null default false,
  add column if not exists remote_ok            boolean not null default false;

create index if not exists jobs_filters_idx on public.jobs
  (status, hiring_now, no_experience_needed, transit_accessible);

-- Jobs sorted by how far they are from your front door, with rough travel
-- times.
--
-- These are straight line estimates from speed constants, not routed times:
-- 3 mph walking, 22 mph driving in city traffic, 11 mph on the bus plus ten
-- minutes of waiting. A real routing service replaces this function and
-- nothing above it changes. The UI says they are estimates, because someone
-- deciding whether they can reach a shift on time deserves to know that.
create or replace function public.jobs_near_home(
  p_filters      text[]  default null,
  p_radius_miles numeric default null,
  p_limit        int     default 50
)
returns table (
  id                uuid,
  title             text,
  business_id       uuid,
  business_name     text,
  job_type          text,
  pay_min           numeric,
  pay_max           numeric,
  pay_type          text,
  schedule          text,
  hiring_now        boolean,
  neighborhood_name text,
  distance_miles    numeric,
  walk_minutes      int,
  drive_minutes     int,
  bus_minutes       int,
  flags             text[],
  created_at        timestamptz
)
language sql stable security invoker set search_path = public, extensions as $$
  with home as (
    select p.location as loc
    from public.resident_homes rh
    join public.parcels p on p.id = rh.parcel_id
    where rh.user_id = auth.uid()
    limit 1
  ),
  scored as (
    select j.id, j.title, j.business_id, b.name as business_name, j.job_type,
           j.pay_min, j.pay_max, j.pay_type, j.schedule, j.hiring_now,
           n.name as neighborhood_name,
           case when e.location is not null and (select loc from home) is not null
                then round((extensions.st_distance(e.location, (select loc from home)) / 1609.344)::numeric, 2)
           end as distance_miles,
           array_remove(array[
             case when j.no_experience_needed then 'no_experience_needed' end,
             case when j.transit_accessible   then 'transit_accessible'   end,
             case when j.weekends_only        then 'weekends_only'        end,
             case when j.evenings_nights      then 'evenings_nights'      end,
             case when j.teen_friendly        then 'teen_friendly'        end,
             case when j.second_chance        then 'second_chance'        end,
             case when j.benefits_offered     then 'benefits_offered'     end,
             case when j.training_provided    then 'training_provided'    end,
             case when j.weekly_pay           then 'weekly_pay'           end,
             case when j.remote_ok            then 'remote_ok'            end,
             case when j.hiring_now           then 'hiring_now'           end
           ], null) as flags,
           j.created_at
    from public.jobs j
    join public.businesses b on b.id = j.business_id
    left join public.city_entities e
      on e.source_table = 'jobs' and e.source_id = j.id
    left join public.neighborhoods n on n.id = b.neighborhood_id
    where j.status = 'approved'
  )
  select s.id, s.title, s.business_id, s.business_name, s.job_type,
         s.pay_min, s.pay_max, s.pay_type, s.schedule, s.hiring_now,
         s.neighborhood_name, s.distance_miles,
         case when s.distance_miles is not null
              then ceil(s.distance_miles / 3.0  * 60)::int end,
         case when s.distance_miles is not null
              then greatest(ceil(s.distance_miles / 22.0 * 60)::int, 2) end,
         case when s.distance_miles is not null
              then (ceil(s.distance_miles / 11.0 * 60) + 10)::int end,
         s.flags, s.created_at
  from scored s
  where (p_filters is null or s.flags @> p_filters)
    and (p_radius_miles is null
         or s.distance_miles is null
         or s.distance_miles <= least(greatest(p_radius_miles, 0.1), 50))
  order by s.distance_miles nulls last, s.hiring_now desc, s.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

grant execute on function public.jobs_near_home(text[], numeric, int) to anon, authenticated;

-- Trigger bodies stay off the API surface.
revoke execute on function public.spaces_fill_from_parcel() from public, anon, authenticated;
revoke execute on function public.citygraph_sync_space()    from public, anon, authenticated;
