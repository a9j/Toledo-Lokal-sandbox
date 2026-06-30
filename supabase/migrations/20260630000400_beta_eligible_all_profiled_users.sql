-- Expand is_beta_eligible: any user with a profile passes during the beta
-- window.  The gate blocks anonymous visitors (waitlist + email capture);
-- anyone who already signed up and completed a profile is in.
--
-- Previous version only checked Founding 5/25 business ownership, which was
-- too narrow and excluded Charter 100 residents, admins, and other beta
-- testers who had already been invited.

create or replace function public.is_beta_eligible(p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = p_user
  );
$$;
