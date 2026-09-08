-- Phase 5, part one: what is being built, and what used to be here.
--
-- Two tables, both hanging off the Phase 1 registry rather than beside it:
--
--   developments  a planned or in progress project, usually on a parcel.
--                 Registered as a place entity so it can be followed, searched
--                 and answered by Ask Toledo like anything else. A status
--                 change is news, so it writes to city_events_log and reaches
--                 the followers' inbox through the Phase 1 fan out.
--
--   memory_items  the other direction in time: a photo, a story or a clipping
--                 attached to any entity. Nothing appears in public until a
--                 human approves it, because a community history wall is the
--                 easiest surface in the app to abuse.
--
-- Unlike an issue report, a memory is attributed on purpose. Someone adding a
-- story about their grandfather's shop wants their name on it, so contributor
-- is on the public row and the form says so before you submit.

-- ------------------------------------------------------------ developments

create table if not exists public.developments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  summary         text,
  developer       text,
  -- The city's own case number, so a resident can look it up at the counter.
  planning_case   text,
  kind            text check (kind in
                    ('housing','retail','mixed_use','industrial','civic','park','infrastructure')),
  status          text not null default 'proposed' check (status in
                    ('proposed','under_review','approved','under_construction','completed','stalled','cancelled')),
  parcel_id       uuid references public.parcels(id) on delete set null,
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  address         text,
  location        extensions.geography(point, 4326),
  est_completion  date,
  investment_amount numeric,
  -- [{label, url, filed_on}]. Also carries {"source": "..."} for seeded rows.
  documents       jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists developments_status_idx       on public.developments (status, updated_at desc);
create index if not exists developments_location_idx      on public.developments using gist (location);
create index if not exists developments_neighborhood_idx  on public.developments (neighborhood_id);
create index if not exists developments_parcel_idx        on public.developments (parcel_id);

-- ------------------------------------------------------------ memory items

create table if not exists public.memory_items (
  id             uuid primary key default gen_random_uuid(),
  entity_id      uuid not null references public.city_entities(id) on delete cascade,
  -- Loose bounds on purpose. Toledo was founded in 1833; the upper bound just
  -- stops a typo putting a memory in the year 20260.
  year           int check (year between 1800 and 2100),
  kind           text not null check (kind in ('photo','story','clipping')),
  title          text not null,
  body           text,
  media_url      text,
  contributor_id uuid references auth.users(id) on delete set null,
  approved       boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists memory_items_entity_idx      on public.memory_items (entity_id, year);
create index if not exists memory_items_contributor_idx on public.memory_items (contributor_id);
create index if not exists memory_items_pending_idx     on public.memory_items (created_at desc)
  where not approved;

-- --------------------------------------------------------------------- RLS

alter table public.developments enable row level security;
alter table public.memory_items enable row level security;

-- What is being built is public record. Only admins write it, the same shape
-- the rest of the civic tables use.
drop policy if exists developments_read  on public.developments;
drop policy if exists developments_admin on public.developments;
create policy developments_read  on public.developments for select using (true);
create policy developments_admin on public.developments for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- A memory is visible once it is approved. Before that only its contributor
-- and an admin can see it, so a rejected submission is not quietly public.
drop policy if exists memory_items_read   on public.memory_items;
drop policy if exists memory_items_insert on public.memory_items;
drop policy if exists memory_items_own    on public.memory_items;
drop policy if exists memory_items_admin  on public.memory_items;
create policy memory_items_read on public.memory_items for select
  using (approved or auth.uid() = contributor_id or public.is_platform_admin(auth.uid()));
-- You may submit only as yourself, and never pre approved.
create policy memory_items_insert on public.memory_items for insert
  with check (auth.uid() = contributor_id and not approved);
-- You may withdraw your own submission while it is still waiting.
create policy memory_items_own on public.memory_items for delete
  using (auth.uid() = contributor_id and not approved);
create policy memory_items_admin on public.memory_items for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- ------------------------------------------------- parcel derived geometry

-- A development on a parcel inherits the parcel's point, neighborhood and
-- address unless it was given its own. Without this the radar would be blank
-- for every row an admin filed by case number alone.
create or replace function public.developments_fill_from_parcel() returns trigger
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

drop trigger if exists trg_developments_fill on public.developments;
create trigger trg_developments_fill before insert or update on public.developments
  for each row execute function public.developments_fill_from_parcel();

-- ---------------------------------------------------------- CityGraph sync

-- Human wording for a status. 'under_construction' reads badly in a headline.
create or replace function public.development_status_label(p_status text)
returns text language sql immutable set search_path = public as $$
  select case p_status
    when 'proposed'           then 'proposed'
    when 'under_review'       then 'under review'
    when 'approved'           then 'approved'
    when 'under_construction' then 'under construction'
    when 'completed'          then 'finished'
    when 'stalled'            then 'on hold'
    when 'cancelled'          then 'cancelled'
    else replace(coalesce(p_status, ''), '_', ' ')
  end;
$$;

create or replace function public.citygraph_sync_development() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_entity uuid;
begin
  v_entity := public.citygraph_upsert_entity(
    'place'::public.entity_kind, 'developments', new.id, new.name,
    new.neighborhood_id, new.location,
    concat_ws(' ', 'development construction project being built',
              new.kind, new.developer, new.address, new.summary));

  -- The project sits on a parcel. Recording the edge lets a parcel page show
  -- what is coming without a second query shape.
  if new.parcel_id is not null then
    insert into public.city_edges (from_entity, to_entity, relation)
    select v_entity, p.id, 'occupies'
    from public.city_entities p
    where p.source_table = 'parcels' and p.source_id = new.parcel_id
      and p.id <> v_entity
    on conflict (from_entity, to_entity, relation) do nothing;
  end if;

  if tg_op = 'INSERT' then
    insert into public.city_events_log (entity_id, event_type, title, body, occurs_at)
    values (v_entity, 'development_filed',
            new.name || ' is ' || public.development_status_label(new.status),
            new.summary, now());
  elsif new.status is distinct from old.status then
    insert into public.city_events_log (entity_id, event_type, title, body, occurs_at)
    values (v_entity, 'status_change',
            new.name || ' is now ' || public.development_status_label(new.status),
            case new.status
              when 'under_construction' then 'Work has started on this one.'
              when 'completed'          then 'This one is finished.'
              when 'stalled'            then 'This one has stopped for now.'
              when 'cancelled'          then 'This one is not going ahead.'
              else null
            end,
            now());
  end if;

  return new;
end $$;

drop trigger if exists trg_citygraph_developments on public.developments;
create trigger trg_citygraph_developments after insert or update on public.developments
  for each row execute function public.citygraph_sync_development();

-- Phase 4 lesson: a deleted source row used to leave a registry entity behind
-- that stayed searchable and followable. Developments join that sweep.
drop trigger if exists trg_citygraph_developments_delete on public.developments;
create trigger trg_citygraph_developments_delete after delete on public.developments
  for each row execute function public.citygraph_deregister_entity('developments');

-- An approved memory is news to whoever follows the place it belongs to.
create or replace function public.memory_items_announce() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.approved and not coalesce(old.approved, false) then
    insert into public.city_events_log (entity_id, event_type, title, body, occurs_at)
    values (new.entity_id, 'memory_added',
            coalesce(new.title, 'A new memory'),
            case when new.year is not null
                 then 'Someone added a memory from ' || new.year || '.'
                 else 'Someone added a memory.' end,
            now());
  end if;
  return new;
end $$;

drop trigger if exists trg_memory_items_announce on public.memory_items;
create trigger trg_memory_items_announce after update on public.memory_items
  for each row execute function public.memory_items_announce();

-- ------------------------------------------------------------------ reads

-- The approved timeline for one entity, oldest first. Public data, so this is
-- an ordinary invoker function and RLS still decides what comes back.
create or replace function public.entity_memory(p_entity_id uuid, p_limit int default 50)
returns table (
  id           uuid,
  year         int,
  kind         text,
  title        text,
  body         text,
  media_url    text,
  contributor  text,
  created_at   timestamptz
)
language sql stable security invoker set search_path = public as $$
  select m.id, m.year, m.kind, m.title, m.body, m.media_url,
         p.name, m.created_at
  from public.memory_items m
  left join public.profiles p on p.user_id = m.contributor_id
  where m.entity_id = p_entity_id
  order by m.year nulls last, m.created_at
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

grant execute on function public.entity_memory(uuid, int) to anon, authenticated;
grant execute on function public.development_status_label(text) to anon, authenticated;

-- Trigger bodies are not an API surface. Phase 1 shipped 15 of these reachable
-- at /rest/v1/rpc/ by anon; that is not happening twice.
revoke execute on function public.developments_fill_from_parcel() from public, anon, authenticated;
revoke execute on function public.citygraph_sync_development()    from public, anon, authenticated;
revoke execute on function public.memory_items_announce()         from public, anon, authenticated;
