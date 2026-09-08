-- City OS Phase 0, Step 3 fix: source_id already meant something else.
--
-- city_entities has had a source_id since PR #1, and it holds the primary key
-- of the row in source_table. An entity for a business carries that business's
-- id. Step 3 added, or thought it added, a source_id pointing at data_sources,
-- which is a different thing entirely under the same name.
--
-- What actually happened:
--
--   `add column if not exists source_id` found the column already there and
--   skipped the whole clause, foreign key included. So no constraint was
--   created and the registry was never corrupted. Then the backfill,
--   `... where source_id is null`, matched zero rows, because every entity
--   already has one. confidence stayed null on all 309 entities and
--   entity_provenance returned nulls for everything, which is how this was
--   found.
--
-- What would have happened had that column not existed under that name: the
-- backfill would have overwritten every entity's link to its source row with
-- one data_sources id, and the CityGraph would have lost the pointer that
-- makes it a registry at all. It survived on a technicality, not on design.
--
-- The provenance column is now data_source_id on both tables. Two different
-- meanings must not share a name, and parcels.source_id, added by Step 3 an
-- hour ago and used by nothing, is renamed to match rather than left as a
-- second trap.

-- ------------------------------------------------- 1. city_entities
alter table public.city_entities
  add column if not exists data_source_id uuid references public.data_sources(id) on delete set null;

comment on column public.city_entities.source_id is
  'The primary key of the row in source_table. Not a data source. See data_source_id.';
comment on column public.city_entities.data_source_id is
  'Which data_sources row this entity came from. Provenance, not identity.';

update public.city_entities
   set data_source_id = (select id from public.data_sources where name = 'Sandbox seed'),
       confidence     = 0.20
 where data_source_id is null;

drop index if exists public.city_entities_source_id_idx;
create index if not exists city_entities_data_source_idx on public.city_entities (data_source_id);

-- ------------------------------------------------------- 2. parcels
alter table public.parcels
  add column if not exists data_source_id uuid references public.data_sources(id) on delete set null;

update public.parcels
   set data_source_id = coalesce(data_source_id, source_id)
 where data_source_id is null;

update public.parcels
   set data_source_id = (select id from public.data_sources where name = 'Sandbox seed'),
       confidence     = coalesce(confidence, 0.20)
 where data_source_id is null;

-- Added by Step 3 and read by nothing. Dropped so parcels.source_id cannot
-- later be mistaken for the registry column of the same name.
alter table public.parcels drop column if exists source_id;

comment on column public.parcels.data_source_id is
  'Which data_sources row this parcel came from. Provenance, not identity.';

-- --------------------------------------------- 3. the badge reads the right column
create or replace function public.entity_provenance(p_entity_id uuid)
returns table (
  source_name   text,
  source_kind   text,
  confidence    numeric,
  fetched_at    timestamptz,
  verified_at   timestamptz,
  last_run_at   timestamptz,
  is_seed       boolean
)
language sql stable security invoker set search_path = public as $$
  select d.name, d.kind::text,
         coalesce(r.confidence, e.confidence),
         r.fetched_at, r.verified_at, d.last_run_at,
         coalesce(d.kind = 'manual' and not d.is_active, false)
    from public.city_entities e
    left join public.data_sources d on d.id = e.data_source_id
    left join lateral (
      select sr.confidence, sr.fetched_at, sr.verified_at
        from public.source_records sr
       where sr.entity_id = e.id
       order by sr.fetched_at desc
       limit 1
    ) r on true
   where e.id = p_entity_id;
$$;

grant execute on function public.entity_provenance(uuid) to anon, authenticated;
