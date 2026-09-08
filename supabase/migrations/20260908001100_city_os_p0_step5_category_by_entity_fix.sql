-- City OS Phase 0, Step 5 fix: turning a category off did not always turn it off.
--
-- notification_category mapped an event type alone, and status_change is a
-- catch all used by businesses, events, deals, jobs, developments, spaces and
-- issues. Every one of them landed in the civic bucket, so:
--
--   A person who turned "Local businesses" off still got told when a business
--   changed status, because that change was filed under city news.
--
-- Found by reading a probe user's digest rather than the code: they had turned
-- business off, their business items were correctly dropped, and a
-- status_change on the very same business came through anyway.
--
-- An off switch that does not fully switch off is worse than no switch, so the
-- category now falls back to the kind of thing the change happened to. A
-- status change on a business is business news, whatever the event type is
-- called.

create or replace function public.notification_category(p_event_type text, p_entity_kind text default null)
returns text
language sql immutable as $$
  select coalesce(
    -- The event type, when it names its own category.
    case p_event_type
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
      else null
    end,
    -- Otherwise the kind of thing it happened to. status_change is used by
    -- seven different kinds, and each belongs with its own kind's news.
    case p_entity_kind
      when 'business'     then 'business'
      when 'organization' then 'business'
      when 'event'        then 'events'
      when 'job'          then 'jobs'
      when 'deal'         then 'deals'
      when 'property'     then 'property'
      when 'project'      then 'development'
      when 'place'        then 'development'
      when 'neighborhood' then 'development'
      else null
    end,
    'civic');
$$;

grant execute on function public.notification_category(text, text) to anon, authenticated;

-- The one argument form stays, so nothing that already calls it breaks. It
-- now means "I do not know the kind", which is exactly what it always meant.
create or replace function public.notification_category(p_event_type text)
returns text
language sql immutable as $$
  select public.notification_category(p_event_type, null);
$$;

grant execute on function public.notification_category(text) to anon, authenticated;

-- The digest now passes the kind, so an off switch is honoured.
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
           public.notification_category(l.event_type, e.kind::text) as category
      from public.inbox_items i
      join public.city_events_log l on l.id = i.log_id
      left join public.city_entities e on e.id = l.entity_id
     where i.digested_at is null
       and i.read_at is null
  ),
  allowed as (
    select w.*
      from wanted w
     where coalesce(
             (select p.cadence
                from public.notification_preferences p
               where p.user_id = w.user_id and p.category = w.category),
             'daily'::public.notification_cadence
           ) = v_cadence
  ),
  grouped as (
    select user_id, count(*) as item_count,
           jsonb_agg(jsonb_build_object(
             'title', title, 'event_type', event_type, 'category', category)
             order by title) as items,
           array_agg(id) as item_ids
      from allowed group by user_id
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
