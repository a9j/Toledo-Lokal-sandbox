-- Phase 4: Issues and Opportunities.
--
-- Fix Toledo (report something broken), Toledo Needs You (things the city will
-- not fix that neighbours can), and the Opportunity Engine (money and help you
-- may qualify for).
--
-- Two privacy decisions are baked in, both learned the hard way in Phase 2:
--
--   * An issue is public, but who reported it is not. reporter_id lives in a
--     separate table rather than on the public row, because "pothole outside
--     123 Elm, reported by Jane" is a different thing from "pothole outside
--     123 Elm".
--   * resident_profiles holds income band, veteran and children status. It is
--     its own table with strict self only RLS and no admin read policy. It is
--     never joined onto anything world readable.

-- ------------------------------------------------------------------ issues

create table if not exists public.issues (
  id              uuid primary key default gen_random_uuid(),
  kind            text not null,
  title           text not null,
  description     text,
  photo_url       text,
  location        extensions.geography(point, 4326),
  neighborhood_id uuid references public.neighborhoods(id) on delete set null,
  status          text not null default 'reported'
                  check (status in ('reported','assigned','scheduled','completed','declined')),
  -- false means Toledo Needs You: the city will not do it, neighbours might.
  is_government   boolean not null default true,
  needs           jsonb not null default '{}',
  progress        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists issues_status_idx       on public.issues (status, created_at desc);
create index if not exists issues_location_idx     on public.issues using gist (location);
create index if not exists issues_neighborhood_idx on public.issues (neighborhood_id);

-- Who reported it, kept off the public row.
create table if not exists public.issue_reporters (
  issue_id    uuid primary key references public.issues(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists issue_reporters_user_idx on public.issue_reporters (reporter_id);

-- ----------------------------------------------------------- opportunities

create table if not exists public.opportunities (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  provider     text,
  category     text,
  description  text,
  url          text,
  phone        text,
  deadline     date,
  -- {max_income_band: '30-60k', homeowner: true, renter: true, senior: true,
  --  veteran: true, has_children: true, business_owner: true,
  --  neighborhoods: [...], min_household_size: 1}
  eligibility  jsonb not null default '{}',
  life_events  text[] not null default '{}',
  active       boolean not null default true,
  -- Where this row came from and whether anyone has checked it.
  -- {source: 'web_search'|'staff'|'seed', sourced_at: '...', url_verified: false}
  provenance   jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists opportunities_active_idx      on public.opportunities (active, category);
create index if not exists opportunities_life_events_idx on public.opportunities using gin (life_events);

-- ------------------------------------------------------- resident profiles

create table if not exists public.resident_profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  household_size  int,
  income_band     text check (income_band in ('<30k','30-60k','60-100k','100k+')),
  homeowner       boolean,
  renter          boolean,
  business_owner  boolean,
  veteran         boolean,
  senior          boolean,
  has_children    boolean,
  life_events     text[] not null default '{}',
  updated_at      timestamptz not null default now()
);

-- --------------------------------------------------------------------- RLS

alter table public.issues            enable row level security;
alter table public.issue_reporters   enable row level security;
alter table public.opportunities     enable row level security;
alter table public.resident_profiles enable row level security;

-- Issues are civic and public. Anyone may read, any signed in person may
-- report, only admins may change status.
drop policy if exists issues_read   on public.issues;
drop policy if exists issues_insert on public.issues;
drop policy if exists issues_admin  on public.issues;
create policy issues_read   on public.issues for select using (true);
create policy issues_insert on public.issues for insert
  with check (auth.uid() is not null);
create policy issues_admin  on public.issues for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Reporter identity: yours, or an admin's, and nobody else's.
drop policy if exists issue_reporters_select on public.issue_reporters;
drop policy if exists issue_reporters_insert on public.issue_reporters;
create policy issue_reporters_select on public.issue_reporters for select
  using (auth.uid() = reporter_id or public.is_platform_admin(auth.uid()));
create policy issue_reporters_insert on public.issue_reporters for insert
  with check (auth.uid() = reporter_id);

-- Opportunities are a public directory.
drop policy if exists opportunities_read  on public.opportunities;
drop policy if exists opportunities_admin on public.opportunities;
create policy opportunities_read  on public.opportunities for select
  using (active or public.is_platform_admin(auth.uid()));
create policy opportunities_admin on public.opportunities for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Resident profile: yours and only yours. No admin read policy: there is no
-- product reason for staff to browse who is a veteran or what someone earns.
drop policy if exists resident_profiles_select on public.resident_profiles;
drop policy if exists resident_profiles_write  on public.resident_profiles;
create policy resident_profiles_select on public.resident_profiles for select
  using (auth.uid() = user_id);
create policy resident_profiles_write on public.resident_profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------- CityGraph

create or replace function public.citygraph_sync_issue() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare v_entity uuid;
begin
  v_entity := public.citygraph_upsert_entity(
    'issue'::public.entity_kind, 'issues', new.id, new.title,
    new.neighborhood_id, new.location,
    concat_ws(' ', case when new.is_government then 'issue report' else 'volunteer help needed' end,
              new.kind, new.description));

  -- A status change is news to everyone following it.
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.city_events_log (entity_id, event_type, title, body, occurs_at)
    values (v_entity, 'status_change',
            new.title || ' is now ' || new.status,
            case new.status
              when 'assigned'  then 'Someone has picked this up.'
              when 'scheduled' then 'This is on the schedule.'
              when 'completed' then 'This one is done.'
              when 'declined'  then 'This will not be worked on. Check the notes.'
              else null
            end,
            now());
  end if;

  return new;
end $$;

drop trigger if exists trg_citygraph_issues on public.issues;
create trigger trg_citygraph_issues after insert or update on public.issues
  for each row execute function public.citygraph_sync_issue();

create or replace function public.citygraph_sync_opportunity() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public.citygraph_upsert_entity(
    'resource'::public.entity_kind, 'opportunities', new.id, new.title,
    null, null,
    concat_ws(' ', 'opportunity help assistance program grant',
              new.category, new.provider, new.description,
              array_to_string(new.life_events, ' ')));
  return new;
end $$;

drop trigger if exists trg_citygraph_opportunities on public.opportunities;
create trigger trg_citygraph_opportunities after insert or update on public.opportunities
  for each row execute function public.citygraph_sync_opportunity();

revoke execute on function public.citygraph_sync_issue()       from public, anon, authenticated;
revoke execute on function public.citygraph_sync_opportunity() from public, anon, authenticated;
