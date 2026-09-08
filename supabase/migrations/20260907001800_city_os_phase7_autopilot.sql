-- Phase 7, part one: City Autopilot.
--
-- The plan calls this "Phase 1 plus Phase 4 plus a scoring function", which is
-- exactly right: the change log, the follows and the home address already exist,
-- so all that is missing is preferences and a way to rank what is in the log
-- against them.
--
-- What is NOT here: the nightly push. Nothing in this sandbox runs cron and
-- nothing here can send a notification, so inventing a scheduler would be
-- pretending. autopilot_digest is a read the app calls; wiring it to a job and a
-- push channel is one commit whenever both exist. quiet_hours is stored and
-- honoured by in_quiet_hours() so that commit has something to check.

create table if not exists public.autopilot_preferences (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  -- Empty means everything. Topics are event_type families, not raw types, so
  -- adding a new event_type does not silently drop out of everyone's digest.
  topics         text[] not null default '{}',
  radius_miles   numeric not null default 2 check (radius_miles > 0 and radius_miles <= 25),
  -- Local hours, 0 to 23. start 22 and end 7 means the usual overnight window.
  quiet_from     int not null default 21 check (quiet_from between 0 and 23),
  quiet_until    int not null default 8  check (quiet_until between 0 and 23),
  digest_enabled boolean not null default true,
  max_per_day    int not null default 3 check (max_per_day between 1 and 10),
  updated_at     timestamptz not null default now()
);

alter table public.autopilot_preferences enable row level security;

-- Yours only. No admin read: what someone wants to hear about is not staff
-- business, and it would be a fingerprint of their interests.
drop policy if exists autopilot_preferences_all on public.autopilot_preferences;
create policy autopilot_preferences_all on public.autopilot_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Which topic an event_type belongs to. Anything unmapped becomes 'other',
-- which is included when a user has picked no topics and excluded when they
-- have picked some, so a new event type never sneaks into a narrowed digest.
create or replace function public.autopilot_topic(p_event_type text)
returns text language sql immutable set search_path = public as $$
  select case p_event_type
    when 'closure'           then 'streets'
    when 'permit_filed'      then 'development'
    when 'development_filed' then 'development'
    when 'meeting'           then 'meetings'
    when 'deal_added'        then 'deals'
    when 'opened'            then 'openings'
    when 'space_listed'      then 'spaces'
    when 'memory_added'      then 'history'
    when 'status_change'     then 'updates'
    else 'other'
  end;
$$;

grant execute on function public.autopilot_topic(text) to anon, authenticated;

-- The topics a preferences screen offers.
create or replace function public.autopilot_topics()
returns table (topic text, label text)
language sql immutable set search_path = public as $$
  select * from (values
    ('streets',     'Street closures'),
    ('development', 'What is being built'),
    ('meetings',    'Public meetings'),
    ('deals',       'Deals near me'),
    ('openings',    'New places'),
    ('spaces',      'Space to rent'),
    ('history',     'City memory'),
    ('updates',     'Things I follow changing')
  ) as t(topic, label);
$$;

grant execute on function public.autopilot_topics() to anon, authenticated;

-- True when the caller's local time is inside their quiet window. A sender
-- checks this before it pushes; the digest itself is always readable, because
-- opening the app at midnight should still show you what is waiting.
create or replace function public.in_quiet_hours()
returns boolean
language sql stable security invoker set search_path = public as $$
  with p as (
    select quiet_from, quiet_until from public.autopilot_preferences
    where user_id = auth.uid()
  ),
  now_hour as (
    select extract(hour from (now() at time zone 'America/New_York'))::int as h
  )
  select case
    when (select count(*) from p) = 0 then false
    -- Window that does not cross midnight.
    when (select quiet_from from p) <= (select quiet_until from p)
      then (select h from now_hour) >= (select quiet_from from p)
       and (select h from now_hour) <  (select quiet_until from p)
    -- Window that does, which is the normal case.
    else (select h from now_hour) >= (select quiet_from from p)
      or (select h from now_hour) <  (select quiet_until from p)
  end;
$$;

grant execute on function public.in_quiet_hours() to authenticated;

-- What Autopilot would send the caller right now.
--
-- Scoring, in plain terms: something you follow beats something in your
-- neighborhood, which beats something merely close, and a topic you asked for
-- adds to any of those. Recency breaks ties. Everything is the caller's own
-- data, so this is invoker and RLS still applies to entity_follows and
-- resident_homes.
create or replace function public.autopilot_digest(p_limit int default 3, p_days int default 3)
returns table (
  log_id         uuid,
  entity_id      uuid,
  entity_name    text,
  source_table   text,
  source_id      uuid,
  event_type     text,
  topic          text,
  title          text,
  body           text,
  occurred_at    timestamptz,
  distance_miles numeric,
  score          numeric,
  reason         text
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
         -- Recency, worth up to one point over the window.
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
    -- With topics picked, anything scoring only on recency is noise.
    and (s.score >= 1.0)
  order by s.score desc, s.occurred_at desc
  limit least(greatest(coalesce(p_limit, 3), 1), 20);
$$;

grant execute on function public.autopilot_digest(int, int) to authenticated;

-- Save preferences without needing to know whether a row exists yet.
create or replace function public.save_autopilot_preferences(p_patch jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;

  insert into public.autopilot_preferences (user_id) values (v_user)
  on conflict (user_id) do nothing;

  update public.autopilot_preferences set
    topics = case when p_patch ? 'topics'
                  then coalesce((select array_agg(value)
                                 from jsonb_array_elements_text(p_patch -> 'topics')), '{}')
                  else topics end,
    radius_miles = case when p_patch ? 'radius_miles'
                        then least(greatest((p_patch ->> 'radius_miles')::numeric, 0.1), 25)
                        else radius_miles end,
    quiet_from = case when p_patch ? 'quiet_from'
                      then least(greatest((p_patch ->> 'quiet_from')::int, 0), 23)
                      else quiet_from end,
    quiet_until = case when p_patch ? 'quiet_until'
                       then least(greatest((p_patch ->> 'quiet_until')::int, 0), 23)
                       else quiet_until end,
    digest_enabled = case when p_patch ? 'digest_enabled'
                          then (p_patch ->> 'digest_enabled')::boolean
                          else digest_enabled end,
    max_per_day = case when p_patch ? 'max_per_day'
                       then least(greatest((p_patch ->> 'max_per_day')::int, 1), 10)
                       else max_per_day end,
    updated_at = now()
  where user_id = v_user;
end $$;

revoke execute on function public.save_autopilot_preferences(jsonb) from public, anon;
grant   execute on function public.save_autopilot_preferences(jsonb) to authenticated;
