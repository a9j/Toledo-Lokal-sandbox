-- City OS Phase 0, Step 7: city search and semantic search.
--
-- city_entities.search_text is a generated column built from name and
-- search_blurb. A generated column can only see its own row, so it cannot
-- reach the neighborhoods table, and the roadmap wants the neighborhood name
-- searchable. Rather than rebuild the column, a before trigger folds the
-- neighborhood and city names into search_blurb, which the generated column
-- then picks up. Nothing is dropped and the column keeps its shape.
--
-- Then city_search, which is one query across every kind, ranked by text match
-- and nudged by distance from the caller's home when they have allowed that.
--
-- Then pgvector, an embedding column, and semantic_search. Generating the
-- vectors needs an embeddings provider. Anthropic does not offer one, so this
-- migration creates the column, the index and the search, and the report names
-- the secret somebody has to add before a single vector exists. Nothing here
-- pretends to have embeddings it does not have: semantic_search over an empty
-- column returns nothing, and search_everything falls back to text alone.

-- --------------------------------------------- 1. the neighborhood is searchable
create or replace function public.citygraph_enrich_blurb() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_hood text; v_city text;
begin
  if new.neighborhood_id is not null then
    select n.name into v_hood from public.neighborhoods n where n.id = new.neighborhood_id;
  end if;
  if new.city_id is not null then
    select c.name into v_city from public.cities c where c.id = new.city_id;
  end if;

  -- Only append what is not already in there, so repeated syncs do not grow
  -- the blurb without bound.
  if v_hood is not null and coalesce(position(lower(v_hood) in lower(coalesce(new.search_blurb, ''))), 0) = 0 then
    new.search_blurb := concat_ws(' ', new.search_blurb, v_hood);
  end if;
  if v_city is not null and coalesce(position(lower(v_city) in lower(coalesce(new.search_blurb, ''))), 0) = 0 then
    new.search_blurb := concat_ws(' ', new.search_blurb, v_city);
  end if;

  return new;
end $$;

revoke execute on function public.citygraph_enrich_blurb() from public, anon, authenticated;

drop trigger if exists trg_citygraph_enrich_blurb on public.city_entities;
create trigger trg_citygraph_enrich_blurb
  before insert or update of search_blurb, neighborhood_id, city_id on public.city_entities
  for each row execute function public.citygraph_enrich_blurb();

-- Fold the names into everything already registered.
update public.city_entities set search_blurb = search_blurb
 where neighborhood_id is not null or city_id is not null;

-- ------------------------------------------------------------ 2. city_search
-- One list, every kind, ranked. The roadmap's signature takes a user_id; it is
-- accepted so existing callers keep working, but the home used for the
-- distance nudge is always the caller's own. Passing somebody else's id must
-- not rank results around their house.
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
  scored as (
    select e.id as entity_id, e.kind::text as kind, e.name as name,
           e.source_table, e.source_id, e.neighborhood_id, n.name as neighborhood,
           e.search_blurb as blurb,
           case when h.loc is not null and e.location is not null
                then round((extensions.st_distance(e.location, h.loc) / 1609.344)::numeric, 2)
           end as distance_miles,
           round((
             coalesce(ts_rank(e.search_text, (select query from tsq)), 0)::numeric
             -- A place a mile away outranks the same place ten miles away, but
             -- distance never beats a real text match.
             + case when h.loc is not null and e.location is not null
                    then greatest(0, 0.05 - (extensions.st_distance(e.location, h.loc) / 1609.344)::numeric / 400)
                    else 0 end
           )::numeric, 6) as rank,
           'text'::text as match_kind
      from public.city_entities e
      left join public.neighborhoods n on n.id = e.neighborhood_id
      left join home h on true
     where (select query from tsq) is not null
       and e.search_text @@ (select query from tsq)
  )
  select s.entity_id, s.kind, s.name, s.source_table, s.source_id,
         s.neighborhood_id, s.neighborhood, s.blurb, s.distance_miles, s.rank, s.match_kind
    from scored s
   order by s.rank desc, coalesce(s.distance_miles, 9999), s.name
   limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

grant execute on function public.city_search(text, uuid, int) to anon, authenticated;

-- ------------------------------------------------------------- 3. pgvector
do $$
begin
  execute 'create extension if not exists vector with schema extensions';
exception when others then
  raise notice 'pgvector could not be installed here: %', sqlerrm;
end $$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'vector') then
    if not exists (select 1 from information_schema.columns
                    where table_schema='public' and table_name='city_entities' and column_name='embedding') then
      execute 'alter table public.city_entities add column embedding extensions.vector(1536)';
    end if;
    if not exists (select 1 from information_schema.columns
                    where table_schema='public' and table_name='city_entities' and column_name='embedded_at') then
      execute 'alter table public.city_entities add column embedded_at timestamptz';
    end if;
    -- hnsw rather than ivfflat: ivfflat needs a populated table to build good
    -- lists, and this column is empty until a provider exists.
    if not exists (select 1 from pg_indexes where indexname = 'city_entities_embedding_idx') then
      execute 'create index city_entities_embedding_idx on public.city_entities
               using hnsw (embedding extensions.vector_cosine_ops)';
    end if;
  end if;
end $$;

-- --------------------------------------------------------- 4. semantic_search
-- Only created when pgvector is present, because the parameter type does not
-- exist otherwise.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'vector') then
    execute $fn$
      create or replace function public.semantic_search(
        p_embedding extensions.vector(1536),
        p_user_id   uuid default null,
        p_limit     int  default 20
      )
      returns table (
        entity_id uuid, kind text, name text, source_table text, source_id uuid,
        neighborhood_id uuid, neighborhood text, blurb text,
        distance_miles numeric, rank numeric, match_kind text
      )
      language sql stable security invoker set search_path = public, extensions as $body$
        with home as (
          select p.location as loc
            from public.resident_homes rh
            join public.parcels p on p.id = rh.parcel_id
           where rh.user_id = auth.uid()
             and public.privacy_allows(auth.uid(), 'share_location')
           limit 1
        )
        select e.id, e.kind::text, e.name, e.source_table, e.source_id,
               e.neighborhood_id, n.name, e.search_blurb,
               case when h.loc is not null and e.location is not null
                    then round((extensions.st_distance(e.location, h.loc) / 1609.344)::numeric, 2)
               end,
               round((1 - (e.embedding <=> p_embedding))::numeric, 6),
               'semantic'
          from public.city_entities e
          left join public.neighborhoods n on n.id = e.neighborhood_id
          left join home h on true
         where e.embedding is not null
         order by e.embedding <=> p_embedding
         limit least(greatest(coalesce(p_limit, 20), 1), 100);
      $body$;
    $fn$;
    execute 'grant execute on function public.semantic_search(extensions.vector, uuid, int) to anon, authenticated';
  end if;
end $$;

-- Which entities still need a vector. Read by the embed-entities function.
create or replace function public.entities_needing_embeddings(p_limit int default 50)
returns table (entity_id uuid, name text, kind text, blurb text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema='public' and table_name='city_entities' and column_name='embedding') then
    return;
  end if;
  return query execute format($q$
    select e.id, e.name, e.kind::text, e.search_blurb
      from public.city_entities e
     where e.embedding is null
     order by e.updated_at desc
     limit %s
  $q$, least(greatest(coalesce(p_limit, 50), 1), 200));
end $$;

revoke execute on function public.entities_needing_embeddings(int) from public, anon, authenticated;
