-- Rollback for Step 3. Removes the connector framework and the provenance
-- columns. Nothing that predates Step 3 is touched.

drop function if exists public.record_source_run(uuid, text, int, text);
drop function if exists public.entity_provenance(uuid);

alter table public.city_entities drop constraint if exists city_entities_confidence_range;
alter table public.parcels       drop constraint if exists parcels_confidence_range;
drop index if exists public.city_entities_source_id_idx;

alter table public.city_entities
  drop column if exists source_id,
  drop column if exists confidence;
alter table public.parcels
  drop column if exists source_id,
  drop column if exists confidence;

drop table if exists public.source_records;
drop table if exists public.data_source_config;
drop table if exists public.data_sources;
drop type  if exists public.data_source_kind;
