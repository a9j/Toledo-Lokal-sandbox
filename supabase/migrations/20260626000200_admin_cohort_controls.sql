-- Admin cohort controls. EXTENDS the existing admin system (user_roles +
-- is_platform_admin + has_role) — does not replace it. Adds a scoped community
-- role concept designed for Circles but used by cohorts today, a single
-- authorization predicate, admin RPCs (all server-gated + logged to the existing
-- admin_audit_logs), token revocation, admin-authored pinned content, and a
-- position-aware join so member removal frees a reclaimable seat.

-- ── Scoped community governance (designed for Circles, used by cohorts) ────
create type public.community_type as enum ('cohort','circle');
create type public.community_role as enum ('steward','moderator');

create table public.community_roles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  community_type public.community_type not null,
  community_id   uuid not null,          -- cohorts.id today; generic by design
  role           public.community_role not null,
  granted_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  unique (user_id, community_type, community_id, role)
);
create index community_roles_lookup_idx
  on public.community_roles (community_type, community_id);

alter table public.community_roles enable row level security;
create policy "community_roles admin manage" on public.community_roles
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
create policy "community_roles see own" on public.community_roles
  for select using (user_id = auth.uid() or public.is_platform_admin(auth.uid()));

-- ── The single authorization predicate (RLS + every admin RPC) ────────────
create or replace function public.can_manage_community(
  p_type public.community_type, p_id uuid, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_platform_admin(p_user)
    or exists (
      select 1 from public.community_roles cr
      where cr.user_id = p_user
        and cr.community_type = p_type
        and cr.community_id = p_id
    );
$$;

-- ── Extend cohort RLS so stewards (not just platform admins) can govern ───
-- The existing "cohorts admin manage" policy stays; this is additive.
create policy "cohorts steward manage" on public.cohorts
  for all using (public.can_manage_community('cohort', id))
  with check (public.can_manage_community('cohort', id));

-- Managers can see all member rows (the member-only self policy stays).
create policy "members visible to managers" on public.cohort_members
  for select using (public.can_manage_community('cohort', cohort_id));

-- Managers can see/manage invites (the admin-only policy stays).
create policy "invites manageable by managers" on public.cohort_invites
  for all using (public.can_manage_community('cohort', cohort_id))
  with check (public.can_manage_community('cohort', cohort_id));

-- ── Token revocation ──────────────────────────────────────────────────────
alter table public.cohort_invites add column revoked_at timestamptz;

-- ── Admin-authored "What's coming" pinned content ─────────────────────────
create table public.cohort_pinned_posts (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  title      text not null,
  body       text not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
create index cohort_pinned_posts_cohort_idx on public.cohort_pinned_posts (cohort_id);

alter table public.cohort_pinned_posts enable row level security;
create policy "pinned readable" on public.cohort_pinned_posts
  for select using (true);
create policy "pinned manage" on public.cohort_pinned_posts
  for all using (public.can_manage_community('cohort', cohort_id))
  with check (public.can_manage_community('cohort', cohort_id));

-- ── Minimal action record → reuses the existing admin_audit_logs table ────
create or replace function public._log_admin_action(
  p_action text, p_table text, p_record uuid, p_details jsonb)
returns void
language sql security definer set search_path = public as $$
  insert into public.admin_audit_logs
    (admin_user_id, action, table_name, record_id, query_details)
  values (auth.uid(), p_action, p_table, p_record, p_details);
$$;

-- ── Position-aware join (replaces the count+1 version) ────────────────────
-- Fills the LOWEST free seat so a removal frees a reclaimable position, and
-- rejects revoked tokens. Still serialized per-cohort by the advisory lock.
create or replace function public.join_cohort(p_token text, p_user uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_inv     public.cohort_invites%rowtype;
  v_profile uuid;
  v_cohort  public.cohorts%rowtype;
  v_count   int;
  v_pos     int;
begin
  select id into v_profile from public.profiles where user_id = p_user;
  if v_profile is null then
    return jsonb_build_object('status','no_profile');
  end if;

  select * into v_inv from public.cohort_invites where token = p_token for update;
  if not found
     or v_inv.revoked_at is not null
     or (v_inv.expires_at is not null and v_inv.expires_at < now())
     or (v_inv.uses_remaining is not null and v_inv.uses_remaining <= 0) then
    return jsonb_build_object('status','invalid_token');
  end if;

  select * into v_cohort from public.cohorts where id = v_inv.cohort_id;

  select position into v_pos from public.cohort_members
    where cohort_id = v_cohort.id and profile_id = v_profile;
  if v_pos is not null then
    return jsonb_build_object('status','already_member','position',v_pos);
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_cohort.id::text, 0));

  select count(*) into v_count from public.cohort_members where cohort_id = v_cohort.id;
  if v_cohort.member_cap is not null and v_count >= v_cohort.member_cap then
    update public.cohorts set status = 'full', updated_at = now()
      where id = v_cohort.id and status <> 'full';
    return jsonb_build_object('status','full');
  end if;

  if v_cohort.member_cap is null then
    v_pos := v_count + 1;                       -- uncapped: monotonic
  else
    select min(g) into v_pos                    -- capped: lowest free seat
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

  if v_inv.uses_remaining is not null then
    update public.cohort_invites set uses_remaining = uses_remaining - 1
      where id = v_inv.id;
  elsif v_inv.single_use then
    update public.cohort_invites set uses_remaining = 0 where id = v_inv.id;
  end if;

  if v_cohort.member_cap is not null
     and (select count(*) from public.cohort_members where cohort_id = v_cohort.id) >= v_cohort.member_cap then
    update public.cohorts set status = 'full', updated_at = now() where id = v_cohort.id;
  end if;

  return jsonb_build_object('status','success','position',v_pos);
end;
$$;

revoke all on function public.join_cohort(text, uuid) from public, anon, authenticated;

-- ── Admin RPCs (server-gated + logged) ───────────────────────────────────

-- Remove a member: frees the seat (count drops; position reclaimable) and
-- reopens a full cohort. Badge is identity-level — NOT auto-revoked here; use
-- admin_revoke_badge for that. Eligibility (is_beta_eligible) drops since it
-- reads cohort_members.
create or replace function public.admin_remove_cohort_member(p_cohort_id uuid, p_profile_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_pos int;
begin
  if not public.can_manage_community('cohort', p_cohort_id) then
    raise exception 'not authorized';
  end if;
  delete from public.cohort_members
    where cohort_id = p_cohort_id and profile_id = p_profile_id
    returning position into v_pos;
  if v_pos is null then
    raise exception 'not a member';
  end if;
  update public.cohorts set status = 'active', updated_at = now()
    where id = p_cohort_id and status = 'full';
  perform public._log_admin_action('remove_member','cohort_members', null,
    jsonb_build_object('cohort_id', p_cohort_id, 'profile_id', p_profile_id, 'position', v_pos));
end;
$$;

create or replace function public.admin_revoke_invite(p_invite_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_cohort uuid;
begin
  select cohort_id into v_cohort from public.cohort_invites where id = p_invite_id;
  if v_cohort is null then raise exception 'no invite'; end if;
  if not public.can_manage_community('cohort', v_cohort) then
    raise exception 'not authorized';
  end if;
  update public.cohort_invites set revoked_at = now()
    where id = p_invite_id and revoked_at is null;
  perform public._log_admin_action('revoke_invite','cohort_invites', p_invite_id,
    jsonb_build_object('cohort_id', v_cohort));
end;
$$;

-- Badge award/revoke is platform-wide identity → platform admin only.
create or replace function public.admin_award_badge(p_user_id uuid, p_badge_key text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_profile uuid;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  select id into v_profile from public.profiles where user_id = p_user_id;
  if v_profile is null then raise exception 'no profile'; end if;
  insert into public.profile_badges (profile_id, badge_key)
    values (v_profile, p_badge_key)
    on conflict (profile_id, badge_key) do nothing;
  perform public._log_admin_action('award_badge','profile_badges', null,
    jsonb_build_object('user_id', p_user_id, 'badge_key', p_badge_key));
end;
$$;

create or replace function public.admin_revoke_badge(p_user_id uuid, p_badge_key text)
returns void
language plpgsql security definer set search_path = public as $$
declare v_profile uuid;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  select id into v_profile from public.profiles where user_id = p_user_id;
  if v_profile is null then raise exception 'no profile'; end if;
  delete from public.profile_badges where profile_id = v_profile and badge_key = p_badge_key;
  perform public._log_admin_action('revoke_badge','profile_badges', null,
    jsonb_build_object('user_id', p_user_id, 'badge_key', p_badge_key));
end;
$$;

-- Read-only eligibility inspector: "why is this person in/out?"
create or replace function public.admin_eligibility_report(p_email text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_user uuid; v_cohort boolean; v_biz boolean;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email));
  if v_user is null then
    return jsonb_build_object('found', false);
  end if;
  select exists(
    select 1 from public.cohort_members cm
    join public.profiles p on p.id = cm.profile_id
    join public.cohorts c on c.id = cm.cohort_id
    where p.user_id = v_user and c.access_type = 'closed') into v_cohort;
  select exists(
    select 1 from public.businesses b
    where b.owner_user_id = v_user
      and b.tier_status in ('founding_5','founding_50')) into v_biz;
  return jsonb_build_object(
    'found', true,
    'user_id', v_user,
    'eligible', (v_cohort or v_biz),
    'cohort_member', v_cohort,
    'founding_business', v_biz);
end;
$$;
