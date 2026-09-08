-- City OS Phase 0, Step 3: the city data connector framework and source
-- confidence.
--
-- Every fact in the CityGraph today is either invented by a seed or typed in
-- by a person, and nothing on screen says which. This step gives every entity
-- a provenance: where it came from, how sure we are, and when a human last
-- checked. Nothing is dropped or renamed.
--
--   1. data_sources: what we pull from. Public columns only.
--   2. data_source_config: the url and settings a run needs, admin only.
--   3. source_records: one row per external record, with a confidence.
--   4. source_id and confidence on city_entities and on parcels.
--   5. A helper the confidence badge reads, and one an edge function calls
--      to record a run.
--
-- Two deviations from the roadmap, both deliberate, both in the report:
--
--   The roadmap puts `config jsonb` on data_sources. A connector config is
--   where an API key ends up, and `revoke select (config)` does nothing
--   against a table wide grant: that exact mistake was found in the supplier
--   spend column in PR #1. Config lives in its own admin only table instead.
--
--   The roadmap says to register both handlers with a sample public Toledo
--   URL and run them once. This environment has no outbound network, so no
--   URL here could be checked, and inventing one that looks official is worse
--   than leaving it empty. Both sources are registered with no URL and
--   status 'needs url'. The report says where to find the real ones.

-- ------------------------------------------------------------ 1. the sources
do $$
begin
  if not exists (select 1 from pg_type where typname = 'data_source_kind') then
    create type public.data_source_kind as enum ('api', 'gis', 'rss', 'ical', 'csv', 'manual');
  end if;
end $$;

create table if not exists public.data_sources (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  kind          public.data_source_kind not null,
  city_id       uuid references public.cities(id),
  url           text,
  schedule      text,
  last_run_at   timestamptz,
  last_status   text,
  last_error    text,
  record_count  int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (name)
);
create index if not exists data_sources_kind_idx on public.data_sources (kind, is_active);

comment on table public.data_sources is
  'What the city connectors pull from. Public: no credentials live here. See data_source_config.';
comment on column public.data_sources.last_status is
  'One word for the last run: ok, failed, needs url, not implemented, never run.';

-- The half nobody but an admin may read. A connector config is where an API
-- key ends up, and a column level revoke does not hold against a table wide
-- grant, so it is a table of its own.
create table if not exists public.data_source_config (
  source_id  uuid primary key references public.data_sources(id) on delete cascade,
  config     jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.data_source_config is
  'Connector settings and any credentials. Admin and service role only. Never selected by the app.';

-- --------------------------------------------------------- 2. the records
create table if not exists public.source_records (
  id               uuid primary key default gen_random_uuid(),
  source_id        uuid not null references public.data_sources(id) on delete cascade,
  external_id      text not null,
  entity_id        uuid references public.city_entities(id) on delete set null,
  confidence       numeric not null default 0.5,
  fetched_at       timestamptz not null default now(),
  verified_at      timestamptz,
  verified_by      uuid references auth.users(id) on delete set null,
  update_frequency text,
  payload          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  unique (source_id, external_id),
  constraint source_records_confidence_range check (confidence >= 0 and confidence <= 1)
);
create index if not exists source_records_entity_idx on public.source_records (entity_id);
create index if not exists source_records_source_idx on public.source_records (source_id, fetched_at desc);

comment on column public.source_records.confidence is
  '0 to 1. How much to trust this record. A human confirming it sets verified_at, not confidence.';

-- ------------------------------------- 3. provenance on entities and parcels
alter table public.city_entities
  add column if not exists source_id  uuid references public.data_sources(id) on delete set null,
  add column if not exists confidence numeric;
alter table public.parcels
  add column if not exists source_id  uuid references public.data_sources(id) on delete set null,
  add column if not exists confidence numeric;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'city_entities_confidence_range') then
    alter table public.city_entities add constraint city_entities_confidence_range
      check (confidence is null or (confidence >= 0 and confidence <= 1));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'parcels_confidence_range') then
    alter table public.parcels add constraint parcels_confidence_range
      check (confidence is null or (confidence >= 0 and confidence <= 1));
  end if;
end $$;

create index if not exists city_entities_source_id_idx on public.city_entities (source_id);

-- ------------------------------------------------------- 4. the seed source
-- Everything already in the graph came from a seed. Saying so on every row is
-- the point of this step: a badge that reads "Seed data, never verified" is
-- worth more than a blank space that reads as fact.
insert into public.data_sources (name, kind, city_id, last_status, is_active)
select 'Sandbox seed', 'manual',
       (select id from public.cities where is_active order by created_at limit 1),
       'not a real source', false
where not exists (select 1 from public.data_sources where name = 'Sandbox seed');

update public.city_entities e
   set source_id  = (select id from public.data_sources where name = 'Sandbox seed'),
       confidence = 0.20
 where e.source_id is null;

update public.parcels p
   set source_id  = (select id from public.data_sources where name = 'Sandbox seed'),
       confidence = 0.20
 where p.source_id is null;

-- The two handlers the roadmap names. No URL: see the header.
insert into public.data_sources (name, kind, city_id, url, schedule, last_status)
select v.name, v.kind::public.data_source_kind,
       (select id from public.cities where is_active order by created_at limit 1),
       null, v.schedule, 'needs url'
from (values
  ('Toledo public events calendar', 'ical', '0 6 * * *'),
  ('Toledo city announcements',     'rss',  '0 * * * *')
) as v(name, kind, schedule)
where not exists (select 1 from public.data_sources d where d.name = v.name);

insert into public.data_source_config (source_id, config)
select d.id, '{"url_verified": false, "note": "No URL yet. Nobody has fetched anything from this source."}'::jsonb
from public.data_sources d
where d.name in ('Toledo public events calendar', 'Toledo city announcements')
  and not exists (select 1 from public.data_source_config c where c.source_id = d.id);

-- ----------------------------------------------------- 5. what the UI reads
-- One row per entity: where it came from, how sure, when a human last looked.
-- Runs as the caller, and every table it touches is publicly readable, so it
-- cannot leak anything the caller could not already select.
create or replace function public.entity_provenance(p_entity_id uuid)
returns table (
  source_name   text,
  source_kind   text,
  confidence    numeric,
  fetched_at    timestamptz,
  verified_at   timestamptz,
  last_run_at   timestamptz,
  is_seed       boolean
)
language sql stable security invoker set search_path = public as $$
  select d.name, d.kind::text,
         coalesce(r.confidence, e.confidence),
         r.fetched_at, r.verified_at, d.last_run_at,
         d.kind = 'manual' and not d.is_active
    from public.city_entities e
    left join public.data_sources d on d.id = e.source_id
    left join lateral (
      select sr.confidence, sr.fetched_at, sr.verified_at
        from public.source_records sr
       where sr.entity_id = e.id
       order by sr.fetched_at desc
       limit 1
    ) r on true
   where e.id = p_entity_id;
$$;

-- Called by the connectors-run edge function with the service role once a run
-- finishes. Definer so the function body owns the write, and revoked from
-- everyone, so only the service role reaches it.
create or replace function public.record_source_run(
  p_source_id uuid,
  p_status    text,
  p_count     int  default 0,
  p_error     text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.data_sources
     set last_run_at  = now(),
         last_status  = left(coalesce(p_status, 'ok'), 40),
         last_error   = left(p_error, 2000),
         record_count = greatest(coalesce(p_count, 0), 0),
         updated_at   = now()
   where id = p_source_id;
  if not found then
    raise exception 'Unknown source' using errcode = '22023';
  end if;
end $$;

revoke execute on function public.record_source_run(uuid, text, int, text)
  from public, anon, authenticated;
grant  execute on function public.entity_provenance(uuid) to anon, authenticated;

-- -------------------------------------------------------------------- 6. RLS
alter table public.data_sources       enable row level security;
alter table public.data_source_config enable row level security;
alter table public.source_records     enable row level security;

drop policy if exists data_sources_read        on public.data_sources;
drop policy if exists data_sources_write       on public.data_sources;
drop policy if exists data_source_config_admin on public.data_source_config;
drop policy if exists source_records_read      on public.source_records;
drop policy if exists source_records_write     on public.source_records;

-- Where a fact came from is part of the fact. Everyone reads it.
create policy data_sources_read  on public.data_sources for select using (true);
create policy data_sources_write on public.data_sources for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- The config half is admin only, both directions. The service role bypasses
-- RLS, which is how the edge function reads a url.
create policy data_source_config_admin on public.data_source_config for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

create policy source_records_read  on public.source_records for select using (true);
create policy source_records_write on public.source_records for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
