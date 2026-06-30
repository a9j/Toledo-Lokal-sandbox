-- Charter 100 cohort counter
-- Returns the live number of beta signups without exposing any row data (emails).
-- SECURITY DEFINER lets it bypass RLS to COUNT, but it only ever returns an integer.

create or replace function public.charter_100_count()
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::int from public.beta_signups;
$$;

-- Allow the app to call it (anon = logged-out, authenticated = logged-in)
grant execute on function public.charter_100_count() to anon, authenticated;
