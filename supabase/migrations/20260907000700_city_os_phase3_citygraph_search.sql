-- Phase 3: retrieval for Ask Toledo.
--
-- One function turns a structured query spec into rows from the CityGraph. The
-- model never touches the database: it produces a spec, this runs it, and the
-- rows come back for the model to write from. That is what keeps Ask Toledo
-- answering from Toledo data instead of from its own memory.
--
-- SECURITY DEFINER and scoped to auth.uid(), because distance is measured from
-- the caller's home. It takes no user id: one signed in person can never run a
-- search "as" someone else.
--
-- Two things this got wrong on the first pass, both fixed here:
--
--   * plainto_tsquery ANDs every term, so a question was only answered when
--     every word appeared. "barber haircut" returned nothing against a
--     barbershop because "haircut" is not in its listing. Questions are phrased
--     in the asker's words, not the listing's, so terms are ORed and results
--     ranked by ts_rank.
--   * Nonprofits had no bucket. They register as 'organization' entities, but
--     the only organization query joined public.businesses, so every nonprofit
--     was silently dropped and "help with food" could never find the food
--     share. Nonprofits and jobs have their own buckets now.

create or replace function public.citygraph_search(p_spec jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_kinds        text[]  := coalesce(
                              (select array_agg(value::text)
                               from jsonb_array_elements_text(p_spec -> 'kinds')),
                              array['organization','event','resource','place']);
  v_hood         uuid    := nullif(p_spec ->> 'neighborhood_id', '')::uuid;
  v_radius       numeric := coalesce((p_spec ->> 'radius_miles')::numeric, 5);
  v_keywords     text    := btrim(coalesce(p_spec ->> 'keywords', ''));
  v_categories   text[]  := (select array_agg(value::text)
                             from jsonb_array_elements_text(p_spec -> 'categories'));
  v_from         timestamptz := coalesce((p_spec ->> 'time_from')::timestamptz, now() - interval '1 day');
  v_to           timestamptz := coalesce((p_spec ->> 'time_to')::timestamptz, now() + interval '30 days');
  v_free_only    boolean := coalesce((p_spec ->> 'free_only')::boolean, false);
  v_limit        int     := least(greatest(coalesce((p_spec ->> 'limit')::int, 12), 1), 40);
  v_home         extensions.geography(point,4326);
  v_tsq          tsquery;
  v_result       jsonb;
begin
  select p.location into v_home
  from public.resident_homes rh
  join public.parcels p on p.id = rh.parcel_id
  where rh.user_id = auth.uid();

  -- Any term may match, best match first. plainto_tsquery does the sanitising,
  -- then the ANDs become ORs.
  if v_keywords <> '' then
    v_tsq := nullif(replace(plainto_tsquery('english', v_keywords)::text, '&', '|'), '')::tsquery;
  end if;

  with scoped as (
    select e.id, e.kind::text as kind, e.name, e.source_table, e.source_id,
           e.neighborhood_id, e.location,
           case when v_home is not null and e.location is not null
                then round((extensions.st_distance(e.location, v_home) / 1609.344)::numeric, 2)
           end as distance_miles,
           case when v_tsq is null then 0 else ts_rank(e.search_text, v_tsq) end as relevance
    from public.city_entities e
    where e.kind::text = any(v_kinds)
      and (v_hood is null or e.neighborhood_id = v_hood)
      and (
        v_home is null or e.location is null
        or extensions.st_dwithin(e.location, v_home, greatest(v_radius, 0.1) * 1609.344)
      )
      and (v_tsq is null or e.search_text @@ v_tsq)
  ),
  biz as (
    select jsonb_agg(x order by x.rel desc, x.dist) as rows from (
      select jsonb_build_object(
               'type', 'business', 'entity_id', s.id, 'business_id', b.id,
               'name', b.name, 'category', b.category::text,
               'description', left(coalesce(b.description, ''), 240),
               'address', b.address, 'neighborhood', n.name,
               'distance_miles', s.distance_miles
             ) as x,
             s.relevance as rel, coalesce(s.distance_miles, 999) as dist
      from scoped s
      join public.businesses b on b.id = s.source_id and s.source_table = 'businesses'
      left join public.neighborhoods n on n.id = s.neighborhood_id
      where b.status = 'approved'
        and (v_categories is null or b.category::text = any(v_categories))
      order by s.relevance desc, coalesce(s.distance_miles, 999)
      limit v_limit
    ) x
  ),
  npo as (
    select jsonb_agg(x order by x.rel desc) as rows from (
      select jsonb_build_object(
               'type', 'nonprofit', 'entity_id', s.id, 'nonprofit_id', np.id,
               'name', np.name, 'slug', np.slug,
               'cause', replace(np.cause_category::text, '_', ' '),
               'mission', left(coalesce(np.mission_statement, ''), 240),
               'neighborhood', n.name, 'distance_miles', s.distance_miles
             ) as x,
             s.relevance as rel
      from scoped s
      join public.nonprofits np on np.id = s.source_id and s.source_table = 'nonprofits'
      left join public.neighborhoods n on n.id = s.neighborhood_id
      where np.status = 'active'
      order by s.relevance desc
      limit v_limit
    ) x
  ),
  evt as (
    select jsonb_agg(x order by x.rank) as rows from (
      select jsonb_build_object(
               'type', 'event', 'entity_id', s.id, 'event_id', ev.id,
               'title', ev.title,
               'description', left(coalesce(ev.description, ''), 240),
               'starts_at', ev.start_date_time, 'ends_at', ev.end_date_time,
               'location', ev.location_text, 'is_free', ev.is_free,
               'price_cents', ev.price_cents, 'neighborhood', n.name,
               'distance_miles', s.distance_miles
             ) as x,
             ev.start_date_time as rank
      from scoped s
      join public.events ev on ev.id = s.source_id and s.source_table = 'events'
      left join public.neighborhoods n on n.id = s.neighborhood_id
      where ev.status = 'approved'
        and ev.start_date_time between v_from and v_to
        and (not v_free_only or coalesce(ev.is_free, false))
      order by ev.start_date_time
      limit v_limit
    ) x
  ),
  jb as (
    select jsonb_agg(x order by x.rel desc) as rows from (
      select jsonb_build_object(
               'type', 'job', 'entity_id', s.id, 'job_id', j.id,
               'title', j.title, 'job_type', j.job_type,
               'description', left(coalesce(j.description, ''), 200),
               'business_name', b.name, 'business_id', b.id,
               'distance_miles', s.distance_miles
             ) as x,
             s.relevance as rel
      from scoped s
      join public.jobs j on j.id = s.source_id and s.source_table = 'jobs'
      left join public.businesses b on b.id = j.business_id
      where j.status = 'approved'
      order by s.relevance desc
      limit v_limit
    ) x
  ),
  deal as (
    select jsonb_agg(x) as rows from (
      select jsonb_build_object(
               'type', 'deal', 'deal_id', d.id, 'title', d.title,
               'description', left(coalesce(d.description, ''), 200),
               'business_id', b.id, 'business_name', b.name,
               'entity_id', s.id, 'distance_miles', s.distance_miles
             ) as x
      from scoped s
      join public.businesses b on b.id = s.source_id and s.source_table = 'businesses'
      join public.deals d on d.business_id = b.id and d.status = 'approved'
      -- Never surface a deal that has not started or has already run out.
      where (d.start_date is null or d.start_date <= current_date)
        and (d.end_date   is null or d.end_date   >= current_date)
      order by coalesce(s.distance_miles, 999)
      limit v_limit
    ) x
  ),
  chg as (
    select jsonb_agg(x order by x.rank desc) as rows from (
      select jsonb_build_object(
               'type', 'change', 'entity_id', s.id, 'entity_name', s.name,
               'source_table', s.source_table, 'source_id', s.source_id,
               'event_type', l.event_type, 'title', l.title, 'body', l.body,
               'occurs_at', coalesce(l.occurs_at, l.created_at),
               'distance_miles', s.distance_miles
             ) as x,
             coalesce(l.occurs_at, l.created_at) as rank
      from scoped s
      join public.city_events_log l on l.entity_id = s.id
      where coalesce(l.occurs_at, l.created_at) > now() - interval '30 days'
      order by coalesce(l.occurs_at, l.created_at) desc
      limit v_limit
    ) x
  )
  select jsonb_build_object(
    'has_home',   v_home is not null,
    'businesses', coalesce((select rows from biz),  '[]'::jsonb),
    'nonprofits', coalesce((select rows from npo),  '[]'::jsonb),
    'events',     coalesce((select rows from evt),  '[]'::jsonb),
    'jobs',       coalesce((select rows from jb),   '[]'::jsonb),
    'deals',      coalesce((select rows from deal), '[]'::jsonb),
    'changes',    coalesce((select rows from chg),  '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;

revoke execute on function public.citygraph_search(jsonb) from public, anon;
grant   execute on function public.citygraph_search(jsonb) to authenticated;
