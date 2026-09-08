-- Rollback for Step 4. Removes the change triggers and the rollup.
-- city_events_log itself predates Step 4 and is left alone, as are the rows
-- the triggers wrote: they are a record of things that really happened.

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.unschedule('city-changes-daily');
    exception when others then null;
    end;
  end if;
end $$;

drop trigger if exists trg_citylog_source_records on public.source_records;
drop trigger if exists trg_citylog_parcels        on public.parcels;
drop trigger if exists trg_citylog_jobs           on public.jobs;
drop trigger if exists trg_citylog_deals          on public.deals;
drop trigger if exists trg_citylog_events         on public.events;
drop trigger if exists trg_citylog_businesses     on public.businesses;

drop function if exists public.citylog_source_record();
drop function if exists public.citylog_parcel();
drop function if exists public.citylog_job();
drop function if exists public.citylog_deal();
drop function if exists public.citylog_event();
drop function if exists public.citylog_business();
drop function if exists public.refresh_city_changes_daily();
drop materialized view if exists public.city_changes_daily;
drop function if exists public.citylog_delta(text, anyelement, anyelement);
drop function if exists public.citylog_write(text, uuid, text, text, text, jsonb);

drop index if exists public.city_events_log_entity_idx;
drop index if exists public.city_events_log_type_idx;
drop index if exists public.city_events_log_created_idx;
alter table public.city_events_log drop column if exists data_source_id;
