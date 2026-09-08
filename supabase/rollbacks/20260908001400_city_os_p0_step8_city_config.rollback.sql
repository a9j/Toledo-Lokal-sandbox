-- Rollback for Step 8.
drop function if exists public.city_scoping_audit();
drop function if exists public.city_config(text);
alter table public.cities drop column if exists config;
