-- Hotfix: deploy the PUBLIC closed-beta signup schema standalone.
--
-- The QR / shared-link signup page (src/pages/BetaSignup.tsx) inserts into
-- public.beta_signups and reads public.beta_phase() / public.beta_signup_count().
-- Those objects are defined in 20260626010000_closed_beta_cohort.sql and
-- 20260627010000_beta_signup_count.sql, but that full migration depends on the
-- Circles/cohort system (public.cohorts, can_manage_community, _log_admin_action)
-- which is not yet deployed to production, so it cannot be applied as-is. With
-- beta_signups missing, the anon insert fails with "relation does not exist",
-- which the page surfaces as the generic "Something went wrong saving your spot."
--
-- This migration provisions ONLY the slice the public signup page needs. Its sole
-- dependency, public.is_platform_admin(uuid), already exists in production. Every
-- statement is idempotent (create … if not exists / or replace / drop policy if
-- exists) and matches the definitions in the full migrations verbatim, so the
-- closed_beta_cohort backlog can still be applied later without conflict.

-- ── beta_signups ───────────────────────────────────────────────────────────
create table if not exists public.beta_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  platform    text not null check (platform in ('apple', 'android')),
  source      text default 'qr',
  created_at  timestamptz not null default now()
);
create unique index if not exists beta_signups_email_key
  on public.beta_signups (lower(email));
alter table public.beta_signups enable row level security;

-- ── app_settings (key/value home for the beta_phase flag) ───────────────────
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

-- The phase flag is not a secret (the public page must read it), so settings are
-- world-readable; only platform admins can change them.
drop policy if exists "app_settings readable" on public.app_settings;
create policy "app_settings readable" on public.app_settings
  for select using (true);

drop policy if exists "app_settings admin manage" on public.app_settings;
create policy "app_settings admin manage" on public.app_settings
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- open_signup (today): the public QR page accepts signups.
-- cohort_live: public signups stop; the Founding Beta cohort goes active.
insert into public.app_settings (key, value)
values ('beta_phase', to_jsonb('open_signup'::text))
on conflict (key) do nothing;

-- ── beta_phase(): public read of just the phase string ──────────────────────
create or replace function public.beta_phase()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select value #>> '{}' from public.app_settings where key = 'beta_phase'),
                  'open_signup');
$$;
grant execute on function public.beta_phase() to anon, authenticated;

-- ── RLS: anon may insert their own signup only while open_signup ─────────────
drop policy if exists "anon can join beta" on public.beta_signups;
create policy "anon can join beta"
  on public.beta_signups
  for insert
  to anon
  with check (
    email is not null
    and platform in ('apple', 'android')
    and public.beta_phase() = 'open_signup'
  );

-- Admins (and only admins) can read the signup list for the platform split.
drop policy if exists "admins read beta signups" on public.beta_signups;
create policy "admins read beta signups"
  on public.beta_signups
  for select
  using (public.is_platform_admin(auth.uid()));

-- ── beta_signup_count(): public running total for the signup page ───────────
-- The list stays private (admins only); only the count is exposed. SECURITY
-- DEFINER so anon can read the total without read access to the rows.
create or replace function public.beta_signup_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.beta_signups;
$$;
grant execute on function public.beta_signup_count() to anon, authenticated;
