-- Rollback for the category fix.
--
-- Rolling this back restores a version where turning "Local businesses" off
-- still let a business status change through as city news. Roll back all of
-- Step 5 instead.
select 'roll back all of step 5 instead' as note;
