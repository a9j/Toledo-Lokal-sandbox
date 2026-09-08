-- Phase 1 follow up: give a new follow its recent history.
--
-- The fan out trigger fires on insert into city_events_log, so it only reaches
-- people who were already following. That leaves two problems:
--
--   1. Someone who follows a business today sees an empty inbox until that
--      business next changes, which is not what following something means.
--   2. The seeded change log predates every follow, so it would never reach
--      anyone at all and the Civic Inbox would demo as permanently empty.
--
-- So a new follow pulls in what it missed: recent changes for that entity,
-- bounded so following something busy cannot flood the inbox.

create or replace function public.citygraph_backfill_follow_inbox() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.inbox_items (user_id, log_id)
  select new.user_id, l.id
  from public.city_events_log l
  where l.entity_id = new.entity_id
    and l.created_at > now() - interval '30 days'
  order by l.created_at desc
  limit 10
  on conflict (user_id, log_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_citygraph_backfill_follow_inbox on public.entity_follows;
create trigger trg_citygraph_backfill_follow_inbox
  after insert on public.entity_follows
  for each row execute function public.citygraph_backfill_follow_inbox();
