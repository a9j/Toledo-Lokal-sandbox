-- Rollback for Step 1a.
--
-- Postgres has no "alter type drop value". The nine added values stay in the
-- enum but are inert once Step 1b is rolled back, because no row and no
-- function refers to them. Removing them for real would mean creating a new
-- type and rewriting the kind column, which is a destructive rewrite of
-- city_entities and is deliberately not done here.
--
-- Nothing to run.
select 'entity_kind values are additive; nothing to undo' as note;
