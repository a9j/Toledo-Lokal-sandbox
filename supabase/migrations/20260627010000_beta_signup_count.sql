-- Public count of closed-beta signups. The beta_signups list itself stays
-- private (admins only), but the running total is safe to show on the public
-- signup page so it ticks up as people join. SECURITY DEFINER so anon can read
-- the count without read access to the rows.
create or replace function public.beta_signup_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.beta_signups;
$$;
grant execute on function public.beta_signup_count() to anon, authenticated;
