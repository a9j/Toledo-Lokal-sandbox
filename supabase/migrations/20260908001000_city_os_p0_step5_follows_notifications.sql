-- City OS Phase 0, Step 5: the follow engine and the notification engine.
--
-- entity_follows, inbox_items and the fan out trigger already exist from
-- PR #1, and business_follows is already bridged both ways, so following a
-- business through the old table and the new one stay in step. What is
-- missing is everything about how often a person hears from us.
--
--   1. notification_preferences: a cadence per category, defaulting to daily.
--   2. A category for each event type, so a preference means something.
--   3. inbox_items.digested_at, so a daily digest never sends the same item
--      twice.
--   4. notification_outbox: what would have been sent. Delivery is stubbed.
--   5. Two pg_cron jobs, daily and weekly.
--
-- One deviation, deliberate. The roadmap has cron call a send-notification
-- edge function. Calling an edge function from cron means putting a service
-- role key into a stored cron command, where every admin who can read
-- cron.job can read the key. The digests are built in SQL instead and written
-- to notification_outbox; the edge function reads the outbox and marks rows
-- sent. Same shape, no secret at rest in a job definition.

-- ------------------------------------------------------- 1. what a category is
-- A preference the size of an event type would be unusable. These are the
-- seven buckets the settings screen shows.
create or replace function public.notification_category(p_event_type text)
returns text
language sql immutable as $$
  select case p_event_type
    when 'opened'             then 'business'
    when 'closure'            then 'business'
    when 'hours_changed'      then 'business'
    when 'renamed'            then 'business'
    when 'moved'              then 'business'
    when 'event_added'        then 'events'
    when 'event_moved'        then 'events'
    when 'event_cancelled'    then 'events'
    when 'meeting'            then 'civic'
    when 'job_posted'         then 'jobs'
    when 'job_closed'         then 'jobs'
    when 'deal_added'         then 'deals'
    when 'deal_dates_changed' then 'deals'
    when 'value_changed'      then 'property'
    when 'tax_changed'        then 'property'
    when 'development_filed'  then 'development'
    when 'permit_filed'       then 'development'
    when 'space_listed'       then 'development'
    when 'record_imported'    then 'civic'
    else 'civic'
  end;
$$;

grant execute on function public.notification_category(text) to anon, authenticated;

create or replace function public.notification_categories()
returns table (category text, label text, description text)
language sql immutable as $$
  select * from (values
    ('business',    'Local businesses', 'Opening, closing, new hours or a move.'),
    ('events',      'Events',           'Something added, moved or called off.'),
    ('jobs',        'Jobs',             'A place near you is hiring, or has stopped.'),
    ('deals',       'Deals',            'A new offer, or one about to end.'),
    ('property',    'Property',         'A value or a tax figure changed.'),
    ('development', 'Building',         'Projects, permits and space to rent.'),
    ('civic',       'City news',        'Meetings and anything a city source sends.')
  ) as t(category, label, description);
$$;

grant execute on function public.notification_categories() to anon, authenticated;

-- --------------------------------------------------- 2. the preferences table
do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_cadence') then
    create type public.notification_cadence as enum ('immediate', 'daily', 'weekly', 'off');
  end if;
end $$;

create table if not exists public.notification_preferences (
  user_id    uuid not null references auth.users(id) on delete cascade,
  category   text not null,
  cadence    public.notification_cadence not null default 'daily',
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

comment on table public.notification_preferences is
  'How often one person hears about one category. No row means daily, which is the default.';

alter table public.notification_preferences enable row level security;
drop policy if exists notification_preferences_own on public.notification_preferences;
create policy notification_preferences_own on public.notification_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Read your own, with the default filled in for categories you never set.
create or replace function public.my_notification_preferences()
returns table (category text, label text, description text, cadence text)
language sql stable security invoker set search_path = public as $$
  select c.category, c.label, c.description,
         coalesce(p.cadence::text, 'daily')
    from public.notification_categories() c
    left join public.notification_preferences p
      on p.category = c.category and p.user_id = auth.uid()
   order by c.category;
$$;

create or replace function public.set_notification_preference(p_category text, p_cadence text)
returns void
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.notification_categories() c where c.category = p_category) then
    raise exception 'There is no category called %', p_category using errcode = '22023';
  end if;

  insert into public.notification_preferences (user_id, category, cadence)
  values (auth.uid(), p_category, p_cadence::public.notification_cadence)
  on conflict (user_id, category) do update
    set cadence = excluded.cadence, updated_at = now();
end $$;

grant execute on function public.my_notification_preferences() to authenticated;
grant execute on function public.set_notification_preference(text, text) to authenticated;

-- ------------------------------------------- 3. an item is digested only once
alter table public.inbox_items
  add column if not exists digested_at timestamptz;

create index if not exists inbox_items_user_unread_idx
  on public.inbox_items (user_id, created_at desc) where read_at is null;
create index if not exists inbox_items_pending_digest_idx
  on public.inbox_items (user_id) where digested_at is null;

-- ---------------------------------------------------------- 4. what was sent
create table if not exists public.notification_outbox (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  cadence    public.notification_cadence not null,
  item_count int not null,
  summary    text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at    timestamptz,
  channel    text not null default 'stub',
  send_error text
);

create index if not exists notification_outbox_pending_idx
  on public.notification_outbox (created_at) where sent_at is null;

comment on table public.notification_outbox is
  'One row per digest that would be sent. Delivery is stubbed: nothing leaves the database yet.';

alter table public.notification_outbox enable row level security;
drop policy if exists notification_outbox_own on public.notification_outbox;
create policy notification_outbox_own on public.notification_outbox for select
  using (auth.uid() = user_id);

-- --------------------------------------------------------- 5. build a digest
-- Groups every undigested inbox item for one cadence into one row per person,
-- and marks the items so tomorrow's run does not repeat them. Immediate and
-- off are not built here: off means never, and immediate is a push channel
-- that does not exist yet.
create or replace function public.build_notification_digests(p_cadence text)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_cadence public.notification_cadence := p_cadence::public.notification_cadence;
  v_made    int := 0;
begin
  if v_cadence not in ('daily', 'weekly') then
    raise exception 'Only daily and weekly digests are built' using errcode = '22023';
  end if;

  with wanted as (
    select i.id, i.user_id, l.title, l.event_type,
           public.notification_category(l.event_type) as category
      from public.inbox_items i
      join public.city_events_log l on l.id = i.log_id
     where i.digested_at is null
       and i.read_at is null
       and coalesce(
             (select p.cadence
                from public.notification_preferences p
               where p.user_id = i.user_id
                 and p.category = public.notification_category(l.event_type)),
             'daily'::public.notification_cadence
           ) = v_cadence
  ),
  grouped as (
    select user_id, count(*) as item_count,
           jsonb_agg(jsonb_build_object(
             'title', title, 'event_type', event_type, 'category', category)
             order by title) as items,
           array_agg(id) as item_ids
      from wanted group by user_id
  ),
  written as (
    insert into public.notification_outbox (user_id, cadence, item_count, summary, payload)
    select g.user_id, v_cadence, g.item_count,
           case when g.item_count = 1
                then 'One thing changed in Toledo'
                else g.item_count || ' things changed in Toledo' end,
           jsonb_build_object('items', g.items)
      from grouped g
    returning user_id
  ),
  marked as (
    update public.inbox_items i set digested_at = now()
     where i.id in (select unnest(item_ids) from grouped)
    returning 1
  )
  select count(*) into v_made from written;

  return v_made;
end $$;

revoke execute on function public.build_notification_digests(text) from public, anon, authenticated;

-- What a stub sender would pick up. Service role only.
create or replace function public.pending_notifications(p_limit int default 100)
returns table (id uuid, user_id uuid, cadence text, item_count int, summary text, payload jsonb, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.id, o.user_id, o.cadence::text, o.item_count, o.summary, o.payload, o.created_at
    from public.notification_outbox o
   where o.sent_at is null
   order by o.created_at
   limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

create or replace function public.mark_notification_sent(p_id uuid, p_channel text, p_error text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.notification_outbox
     set sent_at = now(), channel = left(coalesce(p_channel, 'stub'), 40), send_error = left(p_error, 1000)
   where id = p_id and sent_at is null;
  if not found then
    raise exception 'No unsent notification with that id' using errcode = '22023';
  end if;
end $$;

revoke execute on function public.pending_notifications(int) from public, anon, authenticated;
revoke execute on function public.mark_notification_sent(uuid, text, text) from public, anon, authenticated;

-- ------------------------------------------------------------- 6. the timers
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin perform cron.unschedule('notifications-daily'); exception when others then null; end;
    begin perform cron.unschedule('notifications-weekly'); exception when others then null; end;
    -- 07:00 UTC is early morning in Toledo. Weekly goes out on Monday.
    perform cron.schedule('notifications-daily',  '0 11 * * *',
                          'select public.build_notification_digests(''daily'')');
    perform cron.schedule('notifications-weekly', '0 12 * * 1',
                          'select public.build_notification_digests(''weekly'')');
  end if;
end $$;
