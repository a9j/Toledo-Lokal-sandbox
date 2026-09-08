-- City OS Phase 0, Step 4: the change detection engine.
--
-- city_events_log already exists from PR #1, and three sources already write
-- to it: developments, spaces and issues, on a status change. What it lacks is
-- the everyday city: a business changing its hours, an event moving, a deal
-- ending, a job opening or closing, a parcel being revalued, a connector
-- bringing in something new.
--
-- This step adds a trigger to each of those, plus a daily rollup the City
-- Change Log will read.
--
-- Every trigger compares named fields with `is distinct from` and writes
-- nothing when nothing meaningful moved. A row whose updated_at ticks, or
-- whose photo changes, is not a change to the city.
--
-- Each log row carries the before and after of exactly the fields that moved,
-- so the entry can be explained later without guessing.
--
-- One deviation from the roadmap, deliberate: the column is data_source_id,
-- not source_id. city_entities.source_id already means the primary key of the
-- row in source_table, and Step 3 nearly corrupted the registry by reusing
-- that name. Two meanings must not share a name twice.

-- ------------------------------------------------------------ 1. provenance
alter table public.city_events_log
  add column if not exists data_source_id uuid references public.data_sources(id) on delete set null;

create index if not exists city_events_log_entity_idx  on public.city_events_log (entity_id, created_at desc);
create index if not exists city_events_log_type_idx    on public.city_events_log (event_type, created_at desc);
create index if not exists city_events_log_created_idx on public.city_events_log (created_at desc);

comment on column public.city_events_log.data_source_id is
  'Which data_sources row this change came from, when a connector found it.';

-- --------------------------------------------------------- 2. one small helper
-- Writes a log row for a source table row, if that row is in the registry.
-- Definer because the log is admin writable and these run from triggers on
-- tables an ordinary user may update.
create or replace function public.citylog_write(
  p_source_table text,
  p_source_id    uuid,
  p_event_type   text,
  p_title        text,
  p_body         text default null,
  p_payload      jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public as $$
declare v_entity uuid;
begin
  v_entity := public.citygraph_entity_id(p_source_table, p_source_id);
  if v_entity is null then
    return;  -- not registered, so there is nothing to attach this to
  end if;
  insert into public.city_events_log (entity_id, event_type, title, body, occurs_at, payload)
  values (v_entity, p_event_type, left(p_title, 300), left(p_body, 2000), now(), coalesce(p_payload, '{}'::jsonb));
end $$;

revoke execute on function public.citylog_write(text, uuid, text, text, text, jsonb)
  from public, anon, authenticated;

-- Before and after for one field, as jsonb, so a reader can see what moved.
create or replace function public.citylog_delta(p_field text, p_before anyelement, p_after anyelement)
returns jsonb
language sql immutable as $$
  select jsonb_build_object(p_field, jsonb_build_object(
    'before', to_jsonb(p_before), 'after', to_jsonb(p_after)));
$$;

-- ------------------------------------------------------------ 3. businesses
-- Status, hours, name and address. Not the photo, not the description.
create or replace function public.citylog_business() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_delta jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    if new.status = 'approved' then
      perform public.citylog_write('businesses', new.id, 'opened',
        new.name || ' is on Toledo Lokal', null,
        jsonb_build_object('status', jsonb_build_object('before', null, 'after', new.status)));
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    v_delta := v_delta || public.citylog_delta('status', old.status, new.status);
    perform public.citylog_write('businesses', new.id,
      case when new.status = 'approved' then 'opened'
           when new.status = 'closed'   then 'closure'
           else 'status_change' end,
      new.name || ' is now ' || replace(new.status::text, '_', ' '), null, v_delta);
  end if;

  if new.hours is distinct from old.hours then
    perform public.citylog_write('businesses', new.id, 'hours_changed',
      new.name || ' changed their hours', 'Check before you go.',
      public.citylog_delta('hours', old.hours, new.hours));
  end if;

  if new.name is distinct from old.name then
    perform public.citylog_write('businesses', new.id, 'renamed',
      old.name || ' is now called ' || new.name, null,
      public.citylog_delta('name', old.name, new.name));
  end if;

  if new.address is distinct from old.address then
    perform public.citylog_write('businesses', new.id, 'moved',
      new.name || ' moved', 'New address: ' || coalesce(new.address, 'not listed'),
      public.citylog_delta('address', old.address, new.address));
  end if;

  return new;
end $$;

drop trigger if exists trg_citylog_businesses on public.businesses;
create trigger trg_citylog_businesses
  after insert or update of status, hours, name, address on public.businesses
  for each row execute function public.citylog_business();

-- ---------------------------------------------------------------- 4. events
create or replace function public.citylog_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'approved' then
      perform public.citylog_write('events', new.id, 'event_added',
        new.title || ' was added', new.location_text,
        jsonb_build_object('starts_at', jsonb_build_object('before', null, 'after', new.start_date_time)));
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    perform public.citylog_write('events', new.id,
      case when new.status = 'cancelled' then 'event_cancelled' else 'status_change' end,
      new.title || ' is now ' || replace(new.status::text, '_', ' '), null,
      public.citylog_delta('status', old.status, new.status));
  end if;

  if new.start_date_time is distinct from old.start_date_time
     or new.end_date_time is distinct from old.end_date_time then
    perform public.citylog_write('events', new.id, 'event_moved',
      new.title || ' changed time', null,
      public.citylog_delta('starts_at', old.start_date_time, new.start_date_time)
        || public.citylog_delta('ends_at', old.end_date_time, new.end_date_time));
  end if;

  if new.location_text is distinct from old.location_text then
    perform public.citylog_write('events', new.id, 'event_moved',
      new.title || ' changed place',
      'Now at ' || coalesce(new.location_text, 'a place not listed'),
      public.citylog_delta('location', old.location_text, new.location_text));
  end if;

  return new;
end $$;

drop trigger if exists trg_citylog_events on public.events;
create trigger trg_citylog_events
  after insert or update of status, start_date_time, end_date_time, location_text on public.events
  for each row execute function public.citylog_event();

-- ----------------------------------------------------------------- 5. deals
create or replace function public.citylog_deal() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select b.name into v_name from public.businesses b where b.id = coalesce(new.business_id, old.business_id);

  if tg_op = 'INSERT' then
    if new.status = 'approved' then
      perform public.citylog_write('deals', new.id, 'deal_added',
        coalesce(v_name || ': ', '') || new.title,
        case when new.end_date is not null then 'Ends ' || to_char(new.end_date, 'Mon FMDD') else null end,
        jsonb_build_object('window', jsonb_build_object(
          'before', null,
          'after', jsonb_build_object('start_date', new.start_date, 'end_date', new.end_date))));
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    perform public.citylog_write('deals', new.id, 'status_change',
      coalesce(v_name || ': ', '') || new.title || ' is now ' || replace(new.status::text, '_', ' '),
      null, public.citylog_delta('status', old.status, new.status));
  end if;

  if new.start_date is distinct from old.start_date or new.end_date is distinct from old.end_date then
    perform public.citylog_write('deals', new.id, 'deal_dates_changed',
      coalesce(v_name || ': ', '') || new.title || ' changed dates',
      case when new.end_date is not null then 'Now ends ' || to_char(new.end_date, 'Mon FMDD') else null end,
      public.citylog_delta('start_date', old.start_date, new.start_date)
        || public.citylog_delta('end_date', old.end_date, new.end_date));
  end if;

  return new;
end $$;

drop trigger if exists trg_citylog_deals on public.deals;
create trigger trg_citylog_deals
  after insert or update of status, start_date, end_date on public.deals
  for each row execute function public.citylog_deal();

-- ------------------------------------------------------------------ 6. jobs
create or replace function public.citylog_job() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  select b.name into v_name from public.businesses b where b.id = coalesce(new.business_id, old.business_id);

  if tg_op = 'INSERT' then
    if new.status = 'approved' then
      perform public.citylog_write('jobs', new.id, 'job_posted',
        coalesce(v_name || ' is hiring: ', 'Hiring: ') || new.title,
        new.location_text,
        jsonb_build_object('status', jsonb_build_object('before', null, 'after', new.status)));
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    perform public.citylog_write('jobs', new.id,
      case when new.status = 'approved' then 'job_posted' else 'job_closed' end,
      case when new.status = 'approved'
           then coalesce(v_name || ' is hiring: ', 'Hiring: ') || new.title
           else new.title || ' is no longer open' end,
      null, public.citylog_delta('status', old.status, new.status));
  end if;

  if new.hiring_now is distinct from old.hiring_now then
    perform public.citylog_write('jobs', new.id,
      case when coalesce(new.hiring_now, false) then 'job_posted' else 'job_closed' end,
      new.title || case when coalesce(new.hiring_now, false) then ' is hiring now' else ' stopped hiring' end,
      null, public.citylog_delta('hiring_now', old.hiring_now, new.hiring_now));
  end if;

  return new;
end $$;

drop trigger if exists trg_citylog_jobs on public.jobs;
create trigger trg_citylog_jobs
  after insert or update of status, hiring_now on public.jobs
  for each row execute function public.citylog_job();

-- --------------------------------------------------------------- 7. parcels
-- The roadmap says owner or assessed value. parcels has no owner column, so
-- value and the tax figure are what there is to watch. An owner column, when
-- a real county source brings one, belongs on this trigger too.
create or replace function public.citylog_parcel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    return new;  -- a parcel appearing is not news; what happens to it is
  end if;

  if new.assessed_value is distinct from old.assessed_value then
    perform public.citylog_write('parcels', new.id, 'value_changed',
      new.address || ' was revalued',
      case
        when old.assessed_value is null or new.assessed_value is null then null
        when new.assessed_value > old.assessed_value then 'The assessed value went up.'
        else 'The assessed value went down.'
      end,
      public.citylog_delta('assessed_value', old.assessed_value, new.assessed_value));
  end if;

  if new.tax_year_amount is distinct from old.tax_year_amount then
    perform public.citylog_write('parcels', new.id, 'tax_changed',
      new.address || ' has a new tax figure', null,
      public.citylog_delta('tax_year_amount', old.tax_year_amount, new.tax_year_amount));
  end if;

  if new.address is distinct from old.address then
    perform public.citylog_write('parcels', new.id, 'renamed',
      'An address was corrected', null,
      public.citylog_delta('address', old.address, new.address));
  end if;

  return new;
end $$;

drop trigger if exists trg_citylog_parcels on public.parcels;
create trigger trg_citylog_parcels
  after update of assessed_value, tax_year_amount, address on public.parcels
  for each row execute function public.citylog_parcel();

-- -------------------------------------------------------- 8. source_records
-- A connector finding something new is a change in the city, and this is the
-- one place the log learns which source a change came from.
create or replace function public.citylog_source_record() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_source text; v_title text;
begin
  if new.entity_id is null then
    return new;  -- nothing to attach it to yet
  end if;

  select d.name into v_source from public.data_sources d where d.id = new.source_id;
  v_title := coalesce(nullif(new.payload ->> 'title', ''), 'A new record');

  insert into public.city_events_log
    (entity_id, event_type, title, body, occurs_at, payload, data_source_id)
  values (
    new.entity_id, 'record_imported',
    left(v_title, 300),
    case when v_source is not null then 'Found by ' || v_source || '.' else null end,
    now(),
    jsonb_build_object('external_id', new.external_id, 'confidence', new.confidence),
    new.source_id);

  return new;
end $$;

drop trigger if exists trg_citylog_source_records on public.source_records;
create trigger trg_citylog_source_records
  after insert on public.source_records
  for each row execute function public.citylog_source_record();

revoke execute on function public.citylog_business()      from public, anon, authenticated;
revoke execute on function public.citylog_event()         from public, anon, authenticated;
revoke execute on function public.citylog_deal()          from public, anon, authenticated;
revoke execute on function public.citylog_job()           from public, anon, authenticated;
revoke execute on function public.citylog_parcel()        from public, anon, authenticated;
revoke execute on function public.citylog_source_record() from public, anon, authenticated;

-- ------------------------------------------------------- 9. the daily rollup
-- What changed in Toledo, by day and by kind. A materialized view because the
-- City Change Log reads it on every visit and the underlying log only grows.
drop materialized view if exists public.city_changes_daily;
create materialized view public.city_changes_daily as
  select date_trunc('day', coalesce(l.occurs_at, l.created_at))::date as day,
         l.event_type,
         count(*)                                as change_count,
         count(distinct l.entity_id)             as entity_count,
         count(distinct e.neighborhood_id)       as neighborhood_count,
         max(coalesce(l.occurs_at, l.created_at)) as last_change_at
    from public.city_events_log l
    left join public.city_entities e on e.id = l.entity_id
   group by 1, 2;

create unique index if not exists city_changes_daily_key
  on public.city_changes_daily (day, event_type);
create index if not exists city_changes_daily_day_idx
  on public.city_changes_daily (day desc);

comment on materialized view public.city_changes_daily is
  'What changed each day, by kind. Refreshed nightly. Feeds the City Change Log.';

grant select on public.city_changes_daily to anon, authenticated;

-- Concurrently, so a nightly refresh never blocks a reader. It needs the
-- unique index above, which is why that is not optional.
create or replace function public.refresh_city_changes_daily() returns void
language plpgsql security definer set search_path = public as $$
begin
  refresh materialized view concurrently public.city_changes_daily;
exception when others then
  -- Concurrently fails if the view has never been populated. Fall back once.
  refresh materialized view public.city_changes_daily;
end $$;

revoke execute on function public.refresh_city_changes_daily() from public, anon;
grant  execute on function public.refresh_city_changes_daily() to authenticated;

-- ------------------------------------------------------------- 10. the timer
-- pg_cron if this project has it. If not, the view is still correct the
-- moment anyone calls refresh_city_changes_daily, and the report says plainly
-- that nothing is scheduled.
do $$
begin
  execute 'create extension if not exists pg_cron';
exception when others then
  raise notice 'pg_cron could not be installed here: %', sqlerrm;
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('city-changes-daily');
    exception when others then
      null;  -- not scheduled yet
    end;
    perform cron.schedule('city-changes-daily', '10 4 * * *',
                          'select public.refresh_city_changes_daily()');
  end if;
end $$;
