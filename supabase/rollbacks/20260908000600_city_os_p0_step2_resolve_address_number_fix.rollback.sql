-- Rollback for the third resolve_address fix.
--
-- Rolling this back restores a version that answers "742 Broadway St" with
-- "100 Broadway St". Roll back all of Step 2 instead.
select 'roll back all of step 2 instead' as note;
