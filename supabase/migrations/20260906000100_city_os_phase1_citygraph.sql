-- Phase 1: CityGraph foundation.
-- A registry over the existing data, universal follows, a change log, and the
-- civic inbox. Nothing here forks the data model: every row points back at the
-- table that already owns the thing.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------- entities

do $$ begin
  create type public.entity_kind as enum (
    'person','place','organization','event','resource','transaction','issue'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.city_entities (
  id              uuid primary key default gen_random_uuid(),
  kind            public.entity_kind not null,
  source_table    text not null,
  source_id       uuid not null,
  city_id         uuid references public.cities(id) on delete set null,
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  name            text not null,
  location        extensions.geography(point, 4326),
  search_text     tsvector generated always as (
                    to_tsvector('english', coalesce(name, ''))
                  ) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (source_table, source_id)
);

create index if not exists city_entities_location_idx  on public.city_entities using gist (location);
create index if not exists city_entities_search_idx    on public.city_entities using gin  (search_text);
create index if not exists city_entities_kind_hood_idx on public.city_entities (kind, neighborhood_id);
create index if not exists city_entities_source_idx    on public.city_entities (source_table, source_id);

-- ------------------------------------------------------------------- edges

create table if not exists public.city_edges (
  id          uuid primary key default gen_random_uuid(),
  from_entity uuid not null references public.city_entities(id) on delete cascade,
  to_entity   uuid not null references public.city_entities(id) on delete cascade,
  relation    text not null,
  weight      numeric not null default 1,
  metadata    jsonb   not null default '{}',
  created_at  timestamptz not null default now(),
  unique (from_entity, to_entity, relation),
  constraint city_edges_no_self_loop check (from_entity <> to_entity)
);

create index if not exists city_edges_from_idx on public.city_edges (from_entity, relation);
create index if not exists city_edges_to_idx   on public.city_edges (to_entity, relation);

-- ----------------------------------------------------------------- follows

create table if not exists public.entity_follows (
  user_id    uuid not null references auth.users(id) on delete cascade,
  entity_id  uuid not null references public.city_entities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_id)
);

create index if not exists entity_follows_entity_idx on public.entity_follows (entity_id);

-- --------------------------------------------------------------- event log

create table if not exists public.city_events_log (
  id         uuid primary key default gen_random_uuid(),
  entity_id  uuid not null references public.city_entities(id) on delete cascade,
  event_type text not null,
  title      text not null,
  body       text,
  occurs_at  timestamptz,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists city_events_log_entity_idx on public.city_events_log (entity_id, created_at desc);
create index if not exists city_events_log_recent_idx on public.city_events_log (created_at desc);

-- ------------------------------------------------------------- civic inbox

create table if not exists public.inbox_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_id     uuid not null references public.city_events_log(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, log_id)
);

create index if not exists inbox_items_user_idx   on public.inbox_items (user_id, read_at, created_at desc);
create index if not exists inbox_items_unread_idx on public.inbox_items (user_id) where read_at is null;

-- --------------------------------------------------------------------- RLS

alter table public.city_entities   enable row level security;
alter table public.city_edges      enable row level security;
alter table public.entity_follows  enable row level security;
alter table public.city_events_log enable row level security;
alter table public.inbox_items     enable row level security;

-- Registry and graph: world readable, admin writable.
drop policy if exists city_entities_read  on public.city_entities;
drop policy if exists city_entities_write on public.city_entities;
create policy city_entities_read  on public.city_entities for select using (true);
create policy city_entities_write on public.city_entities for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

drop policy if exists city_edges_read  on public.city_edges;
drop policy if exists city_edges_write on public.city_edges;
create policy city_edges_read  on public.city_edges for select using (true);
create policy city_edges_write on public.city_edges for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

drop policy if exists city_events_log_read  on public.city_events_log;
drop policy if exists city_events_log_write on public.city_events_log;
create policy city_events_log_read  on public.city_events_log for select using (true);
create policy city_events_log_write on public.city_events_log for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Follows: yours and only yours.
drop policy if exists entity_follows_select on public.entity_follows;
drop policy if exists entity_follows_insert on public.entity_follows;
drop policy if exists entity_follows_delete on public.entity_follows;
create policy entity_follows_select on public.entity_follows for select
  using (auth.uid() = user_id);
create policy entity_follows_insert on public.entity_follows for insert
  with check (auth.uid() = user_id);
create policy entity_follows_delete on public.entity_follows for delete
  using (auth.uid() = user_id);

-- Inbox: read and mark read your own rows. Inserts come from the fan out
-- trigger, which is security definer, so no insert policy is granted.
drop policy if exists inbox_items_select on public.inbox_items;
drop policy if exists inbox_items_update on public.inbox_items;
drop policy if exists inbox_items_delete on public.inbox_items;
create policy inbox_items_select on public.inbox_items for select
  using (auth.uid() = user_id);
create policy inbox_items_update on public.inbox_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy inbox_items_delete on public.inbox_items for delete
  using (auth.uid() = user_id);
