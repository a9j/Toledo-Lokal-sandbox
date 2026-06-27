-- Auto-enroll beta signups into Charter 100 when they create an account.
--
-- Previously, beta signups (beta_signups table) and Charter 100 membership
-- (cohort_members table) were completely separate systems. Beta signups were
-- just an email list; Charter 100 required an invite token. This migration
-- bridges the two: when a beta signup creates an account, they are
-- automatically enrolled as a Charter 100 member (with position and badge),
-- subject to the 100-seat cap.

-- ── Helper: auto-enroll a user into Charter 100 ─────────────────────────
-- Called from the beta-link trigger. Respects the cap, uses advisory lock
-- for serialization, assigns the lowest free position, awards the badge.
-- Returns true if enrolled, false if skipped (no profile, already member,
-- full, or cohort not found).
create or replace function public._charter100_auto_enroll(p_user uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid;
  v_cohort  public.cohorts%rowtype;
  v_count   int;
  v_pos     int;
begin
  select id into v_profile from public.profiles where user_id = p_user;
  if v_profile is null then
    return false;
  end if;

  select * into v_cohort from public.cohorts where slug = 'charter-100';
  if not found then
    return false;
  end if;

  -- Already a member?
  if exists (
    select 1 from public.cohort_members
    where cohort_id = v_cohort.id and profile_id = v_profile
  ) then
    return false;
  end if;

  -- Serialize joins for this cohort so cap + position are race-free.
  perform pg_advisory_xact_lock(hashtextextended(v_cohort.id::text, 0));

  select count(*) into v_count
  from public.cohort_members where cohort_id = v_cohort.id;

  if v_cohort.member_cap is not null and v_count >= v_cohort.member_cap then
    update public.cohorts set status = 'full', updated_at = now()
      where id = v_cohort.id and status <> 'full';
    return false;
  end if;

  -- Lowest free seat (gap-filling, matches join_cohort logic).
  if v_cohort.member_cap is null then
    v_pos := v_count + 1;
  else
    select min(g) into v_pos
    from generate_series(1, v_cohort.member_cap) g
    where g not in (
      select position from public.cohort_members where cohort_id = v_cohort.id
    );
  end if;

  insert into public.cohort_members (cohort_id, profile_id, position)
    values (v_cohort.id, v_profile, v_pos);

  insert into public.profile_badges (profile_id, badge_key)
    values (v_profile, 'charter100')
    on conflict (profile_id, badge_key) do nothing;

  -- Mark full if we just took the last seat.
  if v_cohort.member_cap is not null
     and (select count(*) from public.cohort_members where cohort_id = v_cohort.id) >= v_cohort.member_cap then
    update public.cohorts set status = 'full', updated_at = now()
      where id = v_cohort.id;
  end if;

  return true;
end;
$$;

-- ── Extend the beta-link trigger to also enroll in Charter 100 ──────────
create or replace function public.handle_new_user_beta_link()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Original behavior: link to beta_members if email is in beta_signups.
  perform public._beta_link_user(new.id, new.email);
  -- New: auto-enroll in Charter 100 if they were a beta signup.
  if exists (
    select 1 from public.beta_signups
    where lower(email) = lower(trim(new.email))
  ) then
    perform public._charter100_auto_enroll(new.id);
  end if;
  return new;
end;
$$;

-- ── Backfill: enroll existing beta signups who already have accounts ────
-- Admin-only, run-once. Returns the count of newly enrolled members.
create or replace function public.admin_charter100_backfill()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_count int := 0;
  r record;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  for r in
    select u.id as user_id
    from public.beta_signups s
    join auth.users u on lower(u.email) = lower(s.email)
  loop
    if public._charter100_auto_enroll(r.user_id) then
      v_count := v_count + 1;
    end if;
  end loop;

  perform public._log_admin_action('charter100_backfill', 'cohort_members', null,
    jsonb_build_object('enrolled', v_count));

  return jsonb_build_object('enrolled', v_count);
end;
$$;
