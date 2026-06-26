-- Hotfix: let signed-in visitors join the closed beta too.
--
-- The public signup page (src/pages/BetaSignup.tsx, route /beta) is reachable by
-- anyone, including logged-in users (founding members or anyone with an existing
-- session who scans the QR / opens the shared link). The original insert policy
-- ("anon can join beta") was scoped `to anon` only, so an authenticated user's
-- insert had a table-level grant but NO matching RLS policy and was rejected with
-- 42501. The page surfaces that as "The beta is now closed to the public." even
-- while beta_phase() is still 'open_signup' — so some visitors could never save
-- their spot.
--
-- Fix: extend the same insert policy to `authenticated` as well. The guard is
-- unchanged (valid email + platform + phase is open_signup), so the moment an
-- admin flips to cohort_live the table still closes to everyone. Idempotent.

drop policy if exists "anon can join beta" on public.beta_signups;
drop policy if exists "public can join beta" on public.beta_signups;
create policy "public can join beta"
  on public.beta_signups
  for insert
  to anon, authenticated
  with check (
    email is not null
    and platform in ('apple', 'android')
    and public.beta_phase() = 'open_signup'
  );
