-- Rollback for Step 5. entity_follows, inbox_items and the fan out trigger
-- predate this step and are left alone.

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin perform cron.unschedule('notifications-daily'); exception when others then null; end;
    begin perform cron.unschedule('notifications-weekly'); exception when others then null; end;
  end if;
end $$;

drop function if exists public.mark_notification_sent(uuid, text, text);
drop function if exists public.pending_notifications(int);
drop function if exists public.build_notification_digests(text);
drop function if exists public.set_notification_preference(text, text);
drop function if exists public.my_notification_preferences();
drop table if exists public.notification_outbox;
drop table if exists public.notification_preferences;
drop type if exists public.notification_cadence;
drop function if exists public.notification_categories();
drop function if exists public.notification_category(text);

drop index if exists public.inbox_items_user_unread_idx;
drop index if exists public.inbox_items_pending_digest_idx;
alter table public.inbox_items drop column if exists digested_at;
