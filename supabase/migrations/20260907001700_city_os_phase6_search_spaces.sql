-- Phase 6 fix: the same search gap as Phase 5, one phase later.
--
-- Spaces register as place entities with a search blurb, so they reach
-- citygraph_search's scoped set and their listing shows up in the changes
-- bucket. But with no spaces bucket, "where can I rent a small shop downtown"
-- came back as a line of log text with no rent, no size and no contact.
--
-- Having named this exact shape as a Phase 5 defect, leaving it open for spaces
-- would have been a choice rather than an oversight. This adds the bucket.
-- Everything else about the function is unchanged from the Phase 5 version.

create or replace function public.citygraph_search(p_spec jsonb)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_keywords     text    := nullif(trim(coalesce(p_spec ->> 'keywords', '')), '');
  v_kinds        text[]  := coalesce(
                              (select array_agg(value)
                               from jsonb_array_elements_text(p_spec -> 'kinds')),
                              array['organization','event','resource','place']);
  v_categories   text[]  := (select array_agg(value)
                             from jsonb_array_elements_text(p_spec -> 'categories'));
  v_hood         uuid    := nullif(p_spec ->> 'neighborhood_id', '')::uuid;
  v_radius       numeric := coalesce((p_spec ->> 'radius_miles')::numeric, 25);
  v_free_only    boolean := coalesce((p_spec ->> 'free_only')::boolean, false);
  v_from         timestamptz := coalesce((p_spec ->> 'time_from')::timestamptz, now());
  v_to           timestamptz := coalesce((p_spec ->> 'time_to')::timestamptz, now() + interval '30 days');
  v_limit        int     := least(greatest(coalesce((p_spec ->> 'limit')::int, 12), 1), 40);
  v_statuses     text[]  := (select array_agg(value)
                             from jsonb_array_elements_text(p_spec -> 'development_statuses'));
  v_home         extensions.geography(point,4326);
  v_tsq          tsquery;
  v_result       jsonb;
begin
  select p.location into v_home
  from public.resident_homes rh
  join public.parcels p on p.id = rh.parcel_id
  where rh.user_id = auth.uid()
  limit 1;

  -- plainto_tsquery ANDs every word, so "barber haircut" matched nothing. OR
  -- the terms and let ts_rank decide the order instead.
  if v_keywords is not null then
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
      where (d.start_date is null or d.start_date <= current_date)
        and (d.end_date   is null or d.end_date   >= current_date)
      order by coalesce(s.distance_miles, 999)
      limit v_limit
    ) x
  ),
  -- New in Phase 5. Ordered so the projects people mean by "being built" come
  -- first, then everything else by how well it matched.
  dev as (
    select jsonb_agg(x order by x.pri, x.rel desc, x.dist) as rows from (
      select jsonb_build_object(
               'type', 'development', 'entity_id', s.id, 'development_id', d.id,
               'name', d.name, 'status', d.status,
               'status_label', public.development_status_label(d.status),
               'kind', d.kind, 'developer', d.developer,
               'summary', left(coalesce(d.summary, ''), 240),
               'address', d.address, 'neighborhood', n.name,
               'planning_case', d.planning_case,
               'est_completion', d.est_completion,
               'investment_amount', d.investment_amount,
               'distance_miles', s.distance_miles
             ) as x,
             case d.status
               when 'under_construction' then 0
               when 'approved'           then 1
               when 'under_review'       then 2
               when 'proposed'           then 3
               else 4
             end as pri,
             s.relevance as rel, coalesce(s.distance_miles, 999) as dist
      from scoped s
      join public.developments d on d.id = s.source_id and s.source_table = 'developments'
      left join public.neighborhoods n on n.id = s.neighborhood_id
      where (v_statuses is null or d.status = any(v_statuses))
      order by pri, s.relevance desc, coalesce(s.distance_miles, 999)
      limit v_limit
    ) x
  ),
  spc as (
    select jsonb_agg(x order by x.rel desc, x.dist) as rows from (
      select jsonb_build_object(
               'type', 'space', 'entity_id', s.id, 'space_id', sp.id,
               'name', sp.name, 'kind', sp.kind, 'status', sp.status,
               'sqft', sp.sqft, 'rent_monthly', sp.rent_monthly,
               'available_from', sp.available_from,
               'description', left(coalesce(sp.description, ''), 240),
               'address', sp.address, 'neighborhood', n.name,
               'contact_name', sp.contact_name, 'contact_email', sp.contact_email,
               'distance_miles', s.distance_miles
             ) as x,
             s.relevance as rel, coalesce(s.distance_miles, 999) as dist
      from scoped s
      join public.spaces sp on sp.id = s.source_id and s.source_table = 'spaces'
      left join public.neighborhoods n on n.id = s.neighborhood_id
      where sp.status in ('available', 'under_offer')
      order by s.relevance desc, coalesce(s.distance_miles, 999)
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
    'has_home',     v_home is not null,
    'businesses',   coalesce((select rows from biz),  '[]'::jsonb),
    'nonprofits',   coalesce((select rows from npo),  '[]'::jsonb),
    'events',       coalesce((select rows from evt),  '[]'::jsonb),
    'jobs',         coalesce((select rows from jb),   '[]'::jsonb),
    'deals',        coalesce((select rows from deal), '[]'::jsonb),
    'developments', coalesce((select rows from dev),  '[]'::jsonb),
    'spaces',       coalesce((select rows from spc),  '[]'::jsonb),
    'changes',      coalesce((select rows from chg),  '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;

revoke execute on function public.citygraph_search(jsonb) from public, anon;
grant   execute on function public.citygraph_search(jsonb) to authenticated;
