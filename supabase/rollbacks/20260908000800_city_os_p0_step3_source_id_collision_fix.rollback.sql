-- Rollback for the source_id collision fix.
--
-- Rolling this back leaves provenance unreadable, because entity_provenance
-- would join on city_entities.source_id, which holds source row keys and not
-- data source ids. Roll back all of Step 3 instead.
--
-- Restoring parcels.source_id is deliberately not attempted: it existed for
-- about an hour, was read by nothing, and recreating it would put the same
-- ambiguous name back.
select 'roll back all of step 3 instead' as note;
