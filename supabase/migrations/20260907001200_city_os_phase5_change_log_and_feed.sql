-- Phase 5, part two: the City Change Log and one merged City Pulse feed.
--
-- Two deliberate departures from the plan, both about the same thing.
--
-- 1. The plan asks for a materialized view over city_events_log. A matview
--    carries no RLS of its own, is exposed at /rest/v1/ as a table, and is
--    stale until something refreshes it. Nothing in this sandbox runs cron, so
--    a matview here would be a permanently stale copy of public data with
--    weaker access rules than the table it copies. This is a plain view with
--    security_invoker on instead: always current, and the caller's own
--    permissions still decide what it can see. If the day counts ever get slow
--    enough to matter, it becomes a matview plus a refresh job in one commit.
--
-- 2. Both reads are security invoker, not definer. Every source table here is
--    already world readable except entity_follows and resident_homes, which are
--    self only, and under invoker those two return exactly the caller's own
--    rows. A definer function would have had to re-derive all of that by hand,
--    which is how the Phase 1 privilege escalation happened.

-- ------------------------------------------------------------- change log

-- One row per day, event type and neighborhood. The Home tab reads the top of
-- it; an admin can group it any way they like.
drop view if exists public.city_change_log;
create view public.city_change_log
with (security_invoker = true) as
select (coalesce(l.occurs_at, l.created_at) at time zone 'America/New_York')::date as day,
       l.event_type,
       e.neighborhood_id,
       count(*)::int as change_count,
       max(coalesce(l.occurs_at, l.created_at)) as latest_at
from public.city_events_log l
join public.city_entities e on e.id = l.entity_id
group by 1, 2, 3;

grant select on public.city_change_log to anon, authenticated;

-- "Toledo changed today", with a window because a quiet Tuesday is normal and
-- an empty strip reads as a broken strip.
create or replace function public.city_changed_recently(p_days int default 1)
returns table (
  event_type   text,
  change_count int,
  latest_title text,
  latest_at    timestamptz
)
language sql stable security invoker set search_path = public as $$
  select l.event_type,
         count(*)::int,
         (array_agg(l.title order by coalesce(l.occurs_at, l.created_at) desc))[1],
         max(coalesce(l.occurs_at, l.created_at))
  from public.city_events_log l
  where coalesce(l.occurs_at, l.created_at)
        >= now() - (least(greatest(coalesce(p_days, 1), 1), 90) || ' days')::interval
  group by l.event_type
  order by 2 desc, 4 desc;
$$;

grant execute on function public.city_changed_recently(int) to anon, authenticated;

-- ---------------------------------------------------------------- the feed

-- One feed over four sources that used to be four screens:
--
--   change  city_events_log, joined to the entity that changed
--   event   approved events that have not finished
--   pulse   live pulse posts
--   signal  city signals inside their validity window
--
-- Scope is one of city, neighborhood, mile, following.
--
--   neighborhood  rows whose neighborhood matches the one asked for, or the
--                 caller's own home neighborhood when none is given
--   mile          rows with a point inside p_radius_miles of the caller's home
--   following     rows attached to an entity the caller follows
--
-- pulse_posts and city_signals record a neighborhood by name rather than by id,
-- so they are matched back by name. That is lossy where a name does not match a
-- row in neighborhoods, and those posts then appear only in the city scope.
-- Fixing it properly means adding neighborhood_id to both tables, which is a
-- change to shipped tables that Phase 5 does not need to make.
create or replace function public.city_feed(
  p_scope           text    default 'city',
  p_neighborhood_id uuid    default null,
  p_radius_miles    numeric default 1,
  p_limit           int     default 40
)
returns table (
  item_id           uuid,
  source            text,
  kind              text,
  title             text,
  body              text,
  occurred_at       timestamptz,
  neighborhood_id   uuid,
  neighborhood_name text,
  entity_id         uuid,
  source_table      text,
  source_id         uuid,
  image_url         text,
  distance_miles    numeric
)
language sql stable security invoker set search_path = public, extensions as $$
  with home as (
    select p.location as loc, p.neighborhood_id as hood
    from public.resident_homes rh
    join public.parcels p on p.id = rh.parcel_id
    where rh.user_id = auth.uid()
    limit 1
  ),
  scope as (
    select lower(coalesce(nullif(p_scope, ''), 'city')) as s,
           coalesce(p_neighborhood_id, (select hood from home)) as hood,
           least(greatest(coalesce(p_radius_miles, 1), 0.05), 25) * 1609.344 as meters
  ),
  changes as (
    select l.id                                  as item_id,
           'change'::text                        as source,
           l.event_type                          as kind,
           l.title                               as title,
           l.body                                as body,
           coalesce(l.occurs_at, l.created_at)   as occurred_at,
           e.neighborhood_id                     as neighborhood_id,
           e.id                                  as entity_id,
           e.source_table                        as source_table,
           e.source_id                           as source_id,
           null::text                            as image_url,
           e.location                            as location
    from public.city_events_log l
    join public.city_entities e on e.id = l.entity_id
    where coalesce(l.occurs_at, l.created_at) > now() - interval '90 days'
  ),
  upcoming as (
    select ev.id, 'event', coalesce(ev.event_type, 'event'), ev.title, ev.description,
           ev.start_date_time, e.neighborhood_id, e.id, 'events'::text, ev.id,
           ev.image_url, e.location
    from public.events ev
    left join public.city_entities e
      on e.source_table = 'events' and e.source_id = ev.id
    where ev.status = 'approved'
      and coalesce(ev.end_date_time, ev.start_date_time) > now()
  ),
  posts as (
    select pp.id, 'pulse', pp.category::text,
           coalesce(nullif(pp.headline, ''), left(pp.content, 90)),
           coalesce(nullif(pp.preview_text, ''), pp.content),
           pp.created_at, n.id, be.id, 'pulse_posts'::text, pp.id,
           pp.hero_image, coalesce(be.location, ne.location)
    from public.pulse_posts pp
    left join public.neighborhoods n on lower(n.name) = lower(pp.neighborhood)
    left join public.city_entities be
      on be.source_table = 'businesses' and be.source_id = pp.business_id
    left join public.city_entities ne
      on ne.source_table = 'neighborhoods' and ne.source_id = n.id
    where pp.status = 'active' and pp.expires_at > now()
  ),
  signals as (
    select cs.id, 'signal', cs.signal_type, cs.title, cs.subtitle,
           cs.valid_from, n.id, ne.id, 'city_signals'::text, cs.id,
           null::text, ne.location
    from public.city_signals cs
    left join public.neighborhoods n on lower(n.name) = lower(cs.neighborhood)
    left join public.city_entities ne
      on ne.source_table = 'neighborhoods' and ne.source_id = n.id
    where now() between cs.valid_from and cs.valid_until
  ),
  merged as (
    select * from changes
    union all select * from upcoming
    union all select * from posts
    union all select * from signals
  )
  select m.item_id, m.source, m.kind, m.title, m.body, m.occurred_at,
         m.neighborhood_id, n.name, m.entity_id, m.source_table, m.source_id,
         m.image_url,
         case when m.location is not null and h.loc is not null
              then round((extensions.st_distance(m.location, h.loc) / 1609.344)::numeric, 2)
         end
  from merged m
  cross join scope sc
  left join home h on true
  left join public.neighborhoods n on n.id = m.neighborhood_id
  where m.occurred_at is not null
    and case sc.s
          when 'neighborhood' then
            sc.hood is not null and m.neighborhood_id = sc.hood
          when 'mile' then
            h.loc is not null and m.location is not null
            and extensions.st_dwithin(m.location, h.loc, sc.meters)
          when 'following' then
            m.entity_id is not null
            and m.entity_id in (
              select f.entity_id from public.entity_follows f where f.user_id = auth.uid())
          else true
        end
  order by m.occurred_at desc
  limit least(greatest(coalesce(p_limit, 40), 1), 100);
$$;

grant execute on function public.city_feed(text, uuid, numeric, int) to anon, authenticated;

-- ------------------------------------------------------------------ radar

-- Development Radar and Around Me are the same query at two zoom levels: the
-- radar filters by status across the city, Around Me sorts by distance from
-- home. One function serves both so the map and the list can never disagree.
create or replace function public.development_radar(
  p_statuses     text[]  default null,
  p_kinds        text[]  default null,
  p_radius_miles numeric default null,
  p_limit        int     default 200
)
returns table (
  id              uuid,
  name            text,
  summary         text,
  developer       text,
  planning_case   text,
  kind            text,
  status          text,
  address         text,
  neighborhood_id uuid,
  neighborhood_name text,
  est_completion  date,
  investment_amount numeric,
  documents       jsonb,
  latitude        double precision,
  longitude       double precision,
  distance_miles  numeric,
  entity_id       uuid,
  updated_at      timestamptz
)
language sql stable security invoker set search_path = public, extensions as $$
  with home as (
    select p.location as loc
    from public.resident_homes rh
    join public.parcels p on p.id = rh.parcel_id
    where rh.user_id = auth.uid()
    limit 1
  )
  select d.id, d.name, d.summary, d.developer, d.planning_case, d.kind, d.status,
         d.address, d.neighborhood_id, n.name, d.est_completion, d.investment_amount,
         d.documents,
         extensions.st_y(d.location::extensions.geometry),
         extensions.st_x(d.location::extensions.geometry),
         case when d.location is not null and h.loc is not null
              then round((extensions.st_distance(d.location, h.loc) / 1609.344)::numeric, 2)
         end,
         e.id,
         d.updated_at
  from public.developments d
  left join home h on true
  left join public.neighborhoods n on n.id = d.neighborhood_id
  left join public.city_entities e
    on e.source_table = 'developments' and e.source_id = d.id
  where (p_statuses is null or d.status = any(p_statuses))
    and (p_kinds    is null or d.kind   = any(p_kinds))
    -- A radius only filters when the caller has a home to measure from.
    and (p_radius_miles is null
         or (select loc from home) is null
         or (d.location is not null
             and extensions.st_dwithin(d.location, (select loc from home),
                   least(greatest(p_radius_miles, 0.05), 25) * 1609.344)))
  order by
    case when (select loc from home) is not null and d.location is not null
         then extensions.st_distance(d.location, (select loc from home)) end
    nulls last,
    d.updated_at desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
$$;

grant execute on function public.development_radar(text[], text[], numeric, int) to anon, authenticated;
