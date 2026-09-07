-- Rollback for the resolve_address fix.
--
-- Rolling this back restores the version that answers a bare zip with
-- somebody's street address. Prefer rolling back all of Step 2 instead.
-- Nothing here is dropped, because the Step 2 rollback drops the function.
select 'roll back all of step 2 instead' as note;
