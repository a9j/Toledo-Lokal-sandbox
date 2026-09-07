-- Rollback for the second resolve_address fix.
--
-- Rolling this back restores a version that answers "Broadway St, Toledo"
-- with a specific house on Broadway. Roll back all of Step 2 instead.
select 'roll back all of step 2 instead' as note;
