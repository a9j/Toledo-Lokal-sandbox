-- Charter 100: standalone founding-resident cohort. Circle-compatible in spirit
-- (access_type/member_cap/status) so a future Circles model is a rename + FK
-- rewire, not a re-model. No city_id (single-city today; scoping lands later).

-- ── Enums ────────────────────────────────────────────────────────────────
create type public.cohort_access_type as enum ('open','closed');
create type public.cohort_status      as enum ('forming','active','full','archived');

-- ── cohorts ──────────────────────────────────────────────────────────────
create table public.cohorts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  mission     text,
  access_type public.cohort_access_type not null default 'open',
  member_cap  int,                       -- null = uncapped; Charter 100 = 100
  status      public.cohort_status not null default 'forming',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint member_cap_positive check (member_cap is null or member_cap > 0)
);

-- ── cohort_members ───────────────────────────────────────────────────────
create table public.cohort_members (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  position   int  not null,             -- 1..cap, gap-free, unique per cohort
  joined_at  timestamptz not null default now(),
  unique (cohort_id, profile_id),
  unique (cohort_id, position),
  constraint position_positive check (position > 0)
);

-- ── profile_badges (permanent, platform-wide identity badges) ─────────────
create table public.profile_badges (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_key  text not null,             -- 'charter100'
  awarded_at timestamptz not null default now(),
  unique (profile_id, badge_key)
);

-- ── cohort_invites (tokens; QR encodes the token) ─────────────────────────
create table public.cohort_invites (
  id             uuid primary key default gen_random_uuid(),
  cohort_id      uuid not null references public.cohorts(id) on delete cascade,
  token          text not null unique,    -- unguessable; generated server-side
  single_use     boolean not null default true,
  uses_remaining int,                     -- null = unlimited (rotating/event)
  expires_at     timestamptz,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  constraint uses_remaining_nonneg check (uses_remaining is null or uses_remaining >= 0)
);

create index cohort_members_cohort_idx on public.cohort_members (cohort_id);
create index profile_badges_profile_idx on public.profile_badges (profile_id);
create index cohort_invites_cohort_idx on public.cohort_invites (cohort_id);

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.cohorts        enable row level security;
alter table public.cohort_members enable row level security;
alter table public.profile_badges enable row level security;
alter table public.cohort_invites enable row level security;

-- cohorts: readable by anyone (cover/framing); writable by admins only.
create policy "cohorts readable" on public.cohorts
  for select using (true);
create policy "cohorts admin manage" on public.cohorts
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- cohort_members: a member sees their own row; admins see all.
-- Public counts come from cohort_seat_count() (definer), NOT row reads.
create policy "members see own" on public.cohort_members
  for select using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );
-- No INSERT/UPDATE/DELETE policy: writes happen only via SECURITY DEFINER join.

-- profile_badges: world-readable (renders anywhere a profile appears).
create policy "badges readable" on public.profile_badges
  for select using (true);
-- No write policy: awarded only via the join function (definer).

-- cohort_invites: admins only; tokens are validated server-side via service role.
create policy "invites admin manage" on public.cohort_invites
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- ── Eligibility predicate (single source of truth for the beta gate) ──────
create or replace function public.is_beta_eligible(p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    -- arm 1: Charter 100 (any closed cohort) member
    exists (
      select 1 from public.cohort_members cm
      join public.profiles p on p.id = cm.profile_id
      join public.cohorts c on c.id = cm.cohort_id
      where p.user_id = p_user and c.access_type = 'closed'
    )
    -- arm 2: owner of a Founding 5 / Founding 25 business
    or exists (
      select 1 from public.businesses b
      where b.owner_user_id = p_user
        and b.tier_status in ('founding_5','founding_50')
    )
  ), false);
$$;

-- ── Public seat count (no member-row exposure) ───────────────────────────
create or replace function public.cohort_seat_count(p_slug text)
returns table (joined int, cap int)
language sql stable security definer set search_path = public as $$
  select count(cm.id)::int, c.member_cap
  from public.cohorts c
  left join public.cohort_members cm on cm.cohort_id = c.id
  where c.slug = p_slug
  group by c.member_cap;
$$;

-- ── Atomic join (token → cap → insert → badge → token decrement) ─────────
-- Called by the join-cohort edge function with service role; p_user is the
-- authenticated caller resolved from the bearer token in the edge function.
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
     or (v_inv.expires_at is not null and v_inv.expires_at < now())
     or (v_inv.uses_remaining is not null and v_inv.uses_remaining <= 0) then
    return jsonb_build_object('status','invalid_token');
  end if;

  select * into v_cohort from public.cohorts where id = v_inv.cohort_id;

  -- already a member?
  select position into v_pos from public.cohort_members
    where cohort_id = v_cohort.id and profile_id = v_profile;
  if v_pos is not null then
    return jsonb_build_object('status','already_member','position',v_pos);
  end if;

  -- serialize joins for THIS cohort so cap + position are race-free
  perform pg_advisory_xact_lock(hashtextextended(v_cohort.id::text, 0));

  select count(*) into v_count from public.cohort_members where cohort_id = v_cohort.id;
  if v_cohort.member_cap is not null and v_count >= v_cohort.member_cap then
    update public.cohorts set status = 'full', updated_at = now()
      where id = v_cohort.id and status <> 'full';
    return jsonb_build_object('status','full');
  end if;

  v_pos := v_count + 1;
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

  if v_cohort.member_cap is not null and v_pos >= v_cohort.member_cap then
    update public.cohorts set status = 'full', updated_at = now() where id = v_cohort.id;
  end if;

  return jsonb_build_object('status','success','position',v_pos);
end;
$$;

revoke all on function public.join_cohort(text, uuid) from public, anon, authenticated;

-- ── Seed the Charter 100 cohort row ──────────────────────────────────────
insert into public.cohorts (slug, name, mission, access_type, member_cap, status)
values ('charter-100','Charter 100',
        'Toledo Lokal''s founding 100 residents — first in, permanent charter.',
        'closed', 100, 'active');
