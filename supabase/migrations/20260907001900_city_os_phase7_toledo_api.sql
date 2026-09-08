-- Phase 7, part two: the Toledo API.
--
-- Read only views over what is already public, behind per key rate limits.
--
-- Three decisions worth stating, because this is the surface where a mistake is
-- worst.
--
-- 1. Keys are stored as a SHA-256 hash, never in plaintext, and the plaintext is
--    returned exactly once at creation. SHA-256 rather than bcrypt on purpose:
--    a key is 32 characters of CSPRNG output, so there is no dictionary to
--    attack and a hash that can be looked up by index is worth more than a slow
--    one. Passwords are the opposite case, which is why the Phase 2 address
--    codes use bcrypt.
--
-- 2. The plan asks for "a separate anon role". PostgREST authenticates one anon
--    role and cannot be handed another per key, so inventing a Postgres role
--    here would look like isolation without being it. Instead every request goes
--    through api_authenticate, which resolves the key, enforces the limit and
--    records the call. The edge function is the only caller.
--
-- 3. The views expose only what is already world readable and only rows that are
--    already public: approved businesses, approved future events, developments,
--    available spaces, neighborhoods. No parcels, because a parcel plus a
--    resident is a home address, and Phase 2 established that home addresses do
--    not leave the building.

create table if not exists public.api_keys (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid references auth.users(id) on delete cascade,
  name                text not null,
  -- The first characters, kept so a key can be recognised in a list without
  -- being usable. Never the whole key.
  key_prefix          text not null,
  key_hash            text not null unique,
  scopes              text[] not null default '{read}',
  rate_limit_per_hour int not null default 1000 check (rate_limit_per_hour between 1 and 100000),
  active              boolean not null default true,
  created_at          timestamptz not null default now(),
  last_used_at        timestamptz,
  revoked_at          timestamptz
);

create index if not exists api_keys_owner_idx on public.api_keys (owner_id, active);

create table if not exists public.api_requests (
  id         bigserial primary key,
  key_id     uuid not null references public.api_keys(id) on delete cascade,
  resource   text not null,
  at         timestamptz not null default now()
);

create index if not exists api_requests_window_idx on public.api_requests (key_id, at desc);

alter table public.api_keys     enable row level security;
alter table public.api_requests enable row level security;

-- A key row is visible to the person who made it. key_hash is on that row, but
-- a hash is not a key: it cannot be replayed against the API, which compares
-- the hash of what the caller sent.
drop policy if exists api_keys_own   on public.api_keys;
drop policy if exists api_keys_admin on public.api_keys;
create policy api_keys_own on public.api_keys for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy api_keys_admin on public.api_keys for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Your own call log, so you can see what your key has been doing.
drop policy if exists api_requests_own on public.api_requests;
create policy api_requests_own on public.api_requests for select
  using (exists (select 1 from public.api_keys k
                  where k.id = key_id
                    and (k.owner_id = auth.uid() or public.is_platform_admin(auth.uid()))));

-- ------------------------------------------------------------------- views

create or replace view public.api_businesses
with (security_invoker = true) as
select b.id, b.name, b.slug, b.category::text as category, b.description,
       b.address, n.name as neighborhood, b.website, b.phone, b.created_at
from public.businesses b
left join public.neighborhoods n on n.id = b.neighborhood_id
where b.status = 'approved';

create or replace view public.api_events
with (security_invoker = true) as
select ev.id, ev.title, ev.description, ev.start_date_time, ev.end_date_time,
       ev.location_text, ev.is_free, ev.price_cents, ev.ticket_url,
       b.id as business_id, b.name as business_name, n.name as neighborhood
from public.events ev
left join public.businesses b on b.id = ev.business_id
left join public.neighborhoods n on n.id = b.neighborhood_id
where ev.status = 'approved' and ev.start_date_time > now() - interval '1 day';

create or replace view public.api_developments
with (security_invoker = true) as
select d.id, d.name, d.summary, d.developer, d.planning_case, d.kind, d.status,
       public.development_status_label(d.status) as status_label,
       d.address, n.name as neighborhood, d.est_completion, d.investment_amount,
       d.updated_at
from public.developments d
left join public.neighborhoods n on n.id = d.neighborhood_id;

create or replace view public.api_spaces
with (security_invoker = true) as
select s.id, s.name, s.kind, s.address, n.name as neighborhood,
       s.sqft, s.rent_monthly, s.available_from, s.description, s.status,
       s.updated_at
from public.spaces s
left join public.neighborhoods n on n.id = s.neighborhood_id
where s.status in ('available', 'under_offer');

create or replace view public.api_neighborhoods
with (security_invoker = true) as
select n.id, n.name,
       (select count(*) from public.businesses b
         where b.neighborhood_id = n.id and b.status = 'approved') as business_count,
       (select count(*) from public.developments d
         where d.neighborhood_id = n.id) as development_count
from public.neighborhoods n;

create or replace view public.api_changes
with (security_invoker = true) as
select l.id, l.event_type, l.title, l.body,
       coalesce(l.occurs_at, l.created_at) as occurred_at,
       e.name as entity_name, e.source_table, e.source_id, n.name as neighborhood
from public.city_events_log l
join public.city_entities e on e.id = l.entity_id
left join public.neighborhoods n on n.id = e.neighborhood_id;

grant select on public.api_businesses, public.api_events, public.api_developments,
                public.api_spaces, public.api_neighborhoods, public.api_changes
  to anon, authenticated;

-- ------------------------------------------------------------ key handling

-- Issue a key. The plaintext is returned once and never stored.
create or replace function public.create_api_key(p_name text, p_rate_limit int default 1000)
returns table (id uuid, api_key text, key_prefix text)
language plpgsql security definer set search_path = public, extensions as $$
declare v_secret text; v_key text; v_id uuid; v_prefix text;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Give the key a name.' using errcode = '22023';
  end if;

  -- 32 bytes of CSPRNG, base64 without padding or slashes.
  v_secret := translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/=', 'xyz');
  v_key    := 'tl_' || v_secret;
  v_prefix := left(v_key, 11);

  insert into public.api_keys (owner_id, name, key_prefix, key_hash, rate_limit_per_hour)
  values (auth.uid(), trim(p_name), v_prefix,
          encode(extensions.digest(v_key, 'sha256'), 'hex'),
          least(greatest(coalesce(p_rate_limit, 1000), 1), 100000))
  returning public.api_keys.id into v_id;

  return query select v_id, v_key, v_prefix;
end $$;

revoke execute on function public.create_api_key(text, int) from public, anon;
grant   execute on function public.create_api_key(text, int) to authenticated;

create or replace function public.revoke_api_key(p_key_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.api_keys
     set active = false, revoked_at = now()
   where id = p_key_id
     and (owner_id = auth.uid() or public.is_platform_admin(auth.uid()));
  if not found then
    raise exception 'Not your key.' using errcode = '42501';
  end if;
end $$;

revoke execute on function public.revoke_api_key(uuid) from public, anon;
grant   execute on function public.revoke_api_key(uuid) to authenticated;

-- Resolve a key, enforce its hourly limit, record the call.
--
-- Returns a small json verdict rather than raising, so the edge function can
-- turn each case into the right HTTP status. Definer and revoked from anon: only
-- the service role, which is what the edge function runs as, may call it.
create or replace function public.api_authenticate(p_key text, p_resource text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_key public.api_keys%rowtype; v_used int;
begin
  if coalesce(p_key, '') = '' then
    return jsonb_build_object('ok', false, 'status', 401, 'error', 'Missing API key.');
  end if;

  select * into v_key from public.api_keys
   where key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex');

  if v_key.id is null then
    return jsonb_build_object('ok', false, 'status', 401, 'error', 'Unknown API key.');
  end if;
  if not v_key.active then
    return jsonb_build_object('ok', false, 'status', 403, 'error', 'This key has been revoked.');
  end if;

  select count(*) into v_used from public.api_requests
   where key_id = v_key.id and at > now() - interval '1 hour';

  if v_used >= v_key.rate_limit_per_hour then
    return jsonb_build_object(
      'ok', false, 'status', 429,
      'error', 'Rate limit reached. Try again within the hour.',
      'limit', v_key.rate_limit_per_hour, 'used', v_used);
  end if;

  insert into public.api_requests (key_id, resource) values (v_key.id, p_resource);
  update public.api_keys set last_used_at = now() where id = v_key.id;

  return jsonb_build_object(
    'ok', true, 'key_id', v_key.id, 'name', v_key.name,
    'limit', v_key.rate_limit_per_hour, 'used', v_used + 1,
    'remaining', v_key.rate_limit_per_hour - v_used - 1);
end $$;

revoke execute on function public.api_authenticate(text, text) from public, anon, authenticated;

-- What the owner sees about their own keys. Never the hash.
create or replace function public.my_api_keys()
returns table (
  id uuid, name text, key_prefix text, rate_limit_per_hour int,
  active boolean, created_at timestamptz, last_used_at timestamptz,
  calls_last_hour int, calls_total bigint
)
language sql stable security invoker set search_path = public as $$
  select k.id, k.name, k.key_prefix, k.rate_limit_per_hour, k.active,
         k.created_at, k.last_used_at,
         (select count(*)::int from public.api_requests r
           where r.key_id = k.id and r.at > now() - interval '1 hour'),
         (select count(*) from public.api_requests r where r.key_id = k.id)
  from public.api_keys k
  where k.owner_id = auth.uid()
  order by k.created_at desc;
$$;

grant execute on function public.my_api_keys() to authenticated;
