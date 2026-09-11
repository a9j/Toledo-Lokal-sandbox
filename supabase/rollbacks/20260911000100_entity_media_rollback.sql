-- Rollback for 20260911000100_entity_media.sql
--
-- entity_media is a new table with no dependents. Nothing was dropped,
-- renamed or altered to create it, so undoing it is exact: the schema returns
-- to precisely what it was, and nothing that existed beforehand is touched.
--
-- The only thing lost is rows written into entity_media itself, which are
-- placeholder art assignments and any uploads made after the migration.

drop trigger if exists entity_media_gallery_cap_trg on public.entity_media;
drop trigger if exists entity_media_touch_trg on public.entity_media;

drop table if exists public.entity_media;

drop function if exists public.entity_media_gallery_cap();
drop function if exists public.entity_media_touch();
