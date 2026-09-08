-- City OS Phase 0, Step 7 addition: search follows one edge.
--
-- The roadmap's own acceptance test is that "cheap stuff for kids Saturday"
-- returns events, deals and businesses in one list. With the seeded data it
-- returned deals and events and no business, because no business description
-- contains the words cheap, kids or Saturday. The text search was working
-- exactly as written.
--
-- Padding a business description with those words to make the test pass would
-- be cheating at our own test. The real answer is that the business offering a
-- matching deal is relevant to the person who searched, and saying so is what
-- the graph is for: deals sit on an `offers` edge from their business, events
-- on `hosts`, jobs on `employs`, locations on `part_of`.
--
-- So one hop, and only one:
--
--   * A related entity is only ever pulled in by a direct text match.
--   * It ranks strictly below every direct match, by construction.
--   * It is labelled match_kind 'related', so the UI can say why it is there.
--   * A row that already matched directly is never duplicated.

create or replace function public.city_search(
  p_query   text,
  p_user_id uuid default null,
  p_limit   int  default 20
)
returns table (
  entity_id       uuid,
  kind            text,
  name            text,
  source_table    text,
  source_id       uuid,
  neighborhood_id uuid,
  neighborhood    text,
  blurb           text,
  distance_miles  numeric,
  rank            numeric,
  match_kind      text
)
language sql stable security invoker set search_path = public, extensions as $$
  with q as (
    select nullif(btrim(coalesce(p_query, '')), '') as raw
  ),
  tsq as (
    -- Any term may match, not all of them. plainto_tsquery ANDs, which makes
    -- a three word question return nothing far too often.
    select nullif(replace(plainto_tsquery('english', q.raw)::text, '&', '|'), '')::tsquery as query
      from q where q.raw is not null and length(q.raw) >= 2
  ),
  home as (
    select p.location as loc
      from public.resident_homes rh
      join public.parcels p on p.id = rh.parcel_id
     where rh.user_id = auth.uid()
       and public.privacy_allows(auth.uid(), 'share_location')
     limit 1
  ),
  direct as (
    select e.id,
           coalesce(ts_rank(e.search_text, (select query from tsq)), 0)::numeric as text_rank
      from public.city_entities e
     where (select query from tsq) is not null
       and e.search_text @@ (select query from tsq)
     order by text_rank desc
     limit 200
  ),
  -- The thing behind a match: the business that offers the deal, hosts the
  -- event, employs the job, owns the location.
  related as (
    select ed.from_entity as id, max(d.text_rank) as text_rank
      from direct d
      join public.city_edges ed on ed.to_entity = d.id
     where ed.relation in ('offers', 'hosts', 'employs')
       and not exists (select 1 from direct d2 where d2.id = ed.from_entity)
     group by ed.from_entity
    union
    select ed.to_entity as id, max(d.text_rank) as text_rank
      from direct d
      join public.city_edges ed on ed.from_entity = d.id
     where ed.relation = 'part_of'
       and not exists (select 1 from direct d2 where d2.id = ed.to_entity)
     group by ed.to_entity
  ),
  candidates as (
    select id, text_rank, 'text'::text as match_kind, 1 as tier from direct
    union all
    select id, text_rank, 'related'::text, 2 from related
  ),
  scored as (
    select e.id as entity_id, e.kind::text as kind, e.name as name,
           e.source_table, e.source_id, e.neighborhood_id, n.name as neighborhood,
           e.search_blurb as blurb,
           case when h.loc is not null and e.location is not null
                then round((extensions.st_distance(e.location, h.loc) / 1609.344)::numeric, 2)
           end as distance_miles,
           round((
             c.text_rank
             -- A place a mile away outranks the same place ten miles away, but
             -- distance never beats a real text match.
             + case when h.loc is not null and e.location is not null
                    then greatest(0, 0.05 - (extensions.st_distance(e.location, h.loc) / 1609.344)::numeric / 400)
                    else 0 end
           )::numeric, 6) as rank,
           c.match_kind, c.tier
      from candidates c
      join public.city_entities e on e.id = c.id
      left join public.neighborhoods n on n.id = e.neighborhood_id
      left join home h on true
  )
  select s.entity_id, s.kind, s.name, s.source_table, s.source_id,
         s.neighborhood_id, s.neighborhood, s.blurb, s.distance_miles, s.rank, s.match_kind
    from scored s
   -- tier first, so every direct match comes before every related one.
   order by s.tier, s.rank desc, coalesce(s.distance_miles, 9999), s.name
   limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

grant execute on function public.city_search(text, uuid, int) to anon, authenticated;
