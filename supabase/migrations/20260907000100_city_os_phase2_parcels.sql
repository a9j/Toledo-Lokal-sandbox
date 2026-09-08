-- Phase 2: My City. A home address becomes the personal key to the city.
--
-- Trash day, snow route, council district, precinct and school district are all
-- lookups by address, and Toledo does not expose them through one API. This
-- builds the lookup layer so it works off seeded rows now and swaps to live
-- sources later without the shape changing: every row carries `raw` saying
-- where it came from.

create table if not exists public.parcels (
  id              uuid primary key default gen_random_uuid(),
  parcel_number   text unique,
  address         text not null,
  location        extensions.geography(point, 4326),
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  council_district text,
  precinct        text,
  school_district text,
  refuse_day      text,   -- 'Monday' ... 'Friday'
  recycling_week  text,   -- 'A' or 'B'
  snow_route      text,
  assessed_value  numeric,
  tax_year_amount numeric,
  raw             jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists parcels_location_idx     on public.parcels using gist (location);
create index if not exists parcels_neighborhood_idx on public.parcels (neighborhood_id);

-- Address search needs trigram matching: people type "512 Jefferson", not the
-- full normalized string.
create extension if not exists pg_trgm with schema extensions;
create index if not exists parcels_address_trgm_idx
  on public.parcels using gin (address extensions.gin_trgm_ops);

-- Home address on the profile. home_verified_at is Lokal ID: set only after the
-- resident confirms a code emailed to them.
alter table public.profiles add column if not exists home_parcel_id uuid references public.parcels(id) on delete set null;
alter table public.profiles add column if not exists home_verified_at timestamptz;

-- ---------------------------------------------------------------- registry

-- Every parcel is a place in the CityGraph, so it can be followed and can carry
-- change log rows (permits, closures) like anything else.
create or replace function public.citygraph_sync_parcel() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'parcels', new.id, new.address,
    new.neighborhood_id, new.location);
  return new;
end $$;

drop trigger if exists trg_citygraph_parcels on public.parcels;
create trigger trg_citygraph_parcels after insert or update on public.parcels
  for each row execute function public.citygraph_sync_parcel();

revoke execute on function public.citygraph_sync_parcel() from public, anon, authenticated;

-- --------------------------------------------------------------------- RLS

alter table public.parcels enable row level security;

-- Parcel records are public information. Readable by everyone, admin writable.
drop policy if exists parcels_read  on public.parcels;
drop policy if exists parcels_write on public.parcels;
create policy parcels_read  on public.parcels for select using (true);
create policy parcels_write on public.parcels for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
