-- Closed beta phase for Toledo Lokal.
--
-- When the app clears App Store review we flip from open public signups to a
-- private, invite-only "Founding Beta" cohort. The people who signed up through
-- the QR/link page (public.beta_signups: email, platform, source, created_at)
-- become the members.
--
-- This migration EXTENDS the existing Circles/cohort system (cohorts,
-- cohort_members, community_roles, can_manage_community, is_platform_admin) and
-- the existing Jobs system (public.jobs) rather than forking them. The new
-- "Founding Beta" Circle is a real row in public.cohorts, marked hidden +
-- beta_gated, whose membership/read/write is gated strictly to active beta
-- members via RLS — never the UI alone.
--
-- SAFETY (mirrors the nonprofit migration's no-surprises rule): this migration
-- creates schema, RLS, and a trigger that auto-links FUTURE signups only. It
-- NEVER backfills existing signups to existing accounts. That link step is a
-- separate, admin-gated, two-step "report then apply" flow
-- (admin_beta_backfill_report / admin_beta_backfill_apply) that waits on an
-- explicit human action in the admin view. No data is moved here.

-- ── beta_signups (idempotent — assumed to already exist from the signup page)
-- Recreated defensively so this migration is self-contained. The original anon
-- insert policy is replaced below to also respect the beta phase flag.
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

-- ════════════════════════════════════════════════════════════════════════
-- 1. Generic app settings (key/value) — home for the beta_phase flag
-- ════════════════════════════════════════════════════════════════════════
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

-- The phase flag is not a secret (the public signup page must read it to know
-- whether to accept entries), so settings are world-readable; only platform
-- admins can change them.
drop policy if exists "app_settings readable" on public.app_settings;
create policy "app_settings readable" on public.app_settings
  for select using (true);

drop policy if exists "app_settings admin manage" on public.app_settings;
create policy "app_settings admin manage" on public.app_settings
  for all using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- Seed the beta phase. open_signup (today): public QR page accepts signups.
-- cohort_live: public signups stop; the Founding Beta cohort goes active.
insert into public.app_settings (key, value)
values ('beta_phase', to_jsonb('open_signup'::text))
on conflict (key) do nothing;

-- Public read of just the phase string. Used by the anon insert policy below
-- and by the public signup page so it can show "closed to the public" copy.
create or replace function public.beta_phase()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select value #>> '{}' from public.app_settings where key = 'beta_phase'),
                  'open_signup');
$$;
grant execute on function public.beta_phase() to anon, authenticated;

-- Admin flip — single action, validated values only. Called from the admin
-- view with the admin's JWT, so auth.uid() resolves.
create or replace function public.admin_set_beta_phase(p_phase text)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;
  if p_phase not in ('open_signup', 'cohort_live') then
    raise exception 'invalid phase';
  end if;
  insert into public.app_settings (key, value, updated_by, updated_at)
  values ('beta_phase', to_jsonb(p_phase), auth.uid(), now())
  on conflict (key) do update
    set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
  perform public._log_admin_action('set_beta_phase', 'app_settings', null,
    jsonb_build_object('phase', p_phase));
  return p_phase;
end;
$$;

-- ── Re-gate anon signups on the phase flag (server-side close of the page) ──
-- Anon may still insert their own signup while open_signup; the moment an admin
-- flips to cohort_live, the table rejects new public entries. Anon can never
-- read the list (no select policy for anon).
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

-- ════════════════════════════════════════════════════════════════════════
-- 2. beta_members — promote signups into real cohort members
-- ════════════════════════════════════════════════════════════════════════
create type public.beta_member_status as enum ('invited', 'active', 'removed');

create table public.beta_members (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  email      text not null,
  platform   text not null check (platform in ('apple', 'android')),
  status     public.beta_member_status not null default 'invited',
  invited_at timestamptz,
  joined_at  timestamptz,
  created_at timestamptz not null default now()
);
-- One membership per email (matches the beta_signups unique-email key).
create unique index beta_members_email_key on public.beta_members (lower(email));
create index beta_members_user_idx on public.beta_members (user_id);
create index beta_members_status_idx on public.beta_members (status);

alter table public.beta_members enable row level security;

-- A member sees only their own row; platform admins see all. There is NO
-- insert/update/delete policy: every write happens through the SECURITY DEFINER
-- functions below (signup trigger, bulk invite, manual add, remove, backfill),
-- so no one can self-join the cohort. This is the "not in beta_signups and not
-- added by an admin → cannot join" rule, enforced in the database.
create policy "beta_members see own" on public.beta_members
  for select using (
    user_id = auth.uid() or public.is_platform_admin(auth.uid())
  );

-- Count of active founding beta members (shown on the member page). Only
-- meaningful to members/admins; returns a simple integer, no member rows.
create or replace function public.beta_active_member_count()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.beta_members where status = 'active';
$$;
grant execute on function public.beta_active_member_count() to authenticated;

-- Active beta membership predicate — the single gate reused everywhere.
create or replace function public.is_active_beta_member(p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.beta_members
    where user_id = p_user and status = 'active'
  );
$$;
grant execute on function public.is_active_beta_member(uuid) to anon, authenticated;

-- Extend the existing app-window eligibility predicate so Founding Beta members
-- pass the BETA_WINDOW gate too. Additive — keeps the cohort + founding-business
-- arms intact.
create or replace function public.is_beta_eligible(p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    exists (
      select 1 from public.cohort_members cm
      join public.profiles p on p.id = cm.profile_id
      join public.cohorts c on c.id = cm.cohort_id
      where p.user_id = p_user and c.access_type = 'closed'
    )
    or exists (
      select 1 from public.businesses b
      where b.owner_user_id = p_user
        and b.tier_status in ('founding_5','founding_50')
    )
    or public.is_active_beta_member(p_user)
  ), false);
$$;

-- Internal: link one auth user to beta_members IFF their email is in
-- beta_signups. Flips an existing invited row to active, or creates an active
-- row. Never invents membership for an email that did not sign up.
create or replace function public._beta_link_user(p_user uuid, p_email text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_signup public.beta_signups%rowtype;
begin
  if p_email is null then
    return false;
  end if;
  select * into v_signup from public.beta_signups
    where lower(email) = lower(trim(p_email));
  if not found then
    return false;  -- not a signup → not eligible to be auto-linked
  end if;

  insert into public.beta_members (user_id, email, platform, status, joined_at)
  values (p_user, lower(trim(p_email)), v_signup.platform, 'active', now())
  on conflict (lower(email)) do update
    set user_id   = excluded.user_id,
        platform  = coalesce(beta_members.platform, excluded.platform),
        status    = case when beta_members.status = 'removed'
                         then beta_members.status   -- stay removed
                         else 'active' end,
        joined_at = coalesce(beta_members.joined_at, now());
  return true;
end;
$$;

-- Auto-link on account creation. AFTER INSERT on auth.users, alongside the
-- existing handle_new_user trigger (separate trigger, independent of it).
create or replace function public.handle_new_user_beta_link()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public._beta_link_user(new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_beta_link on auth.users;
create trigger on_auth_user_created_beta_link
  after insert on auth.users
  for each row execute function public.handle_new_user_beta_link();

-- ════════════════════════════════════════════════════════════════════════
-- 3. Founding Beta Circle — a hidden, beta-gated row in the cohorts system
-- ════════════════════════════════════════════════════════════════════════
-- Extend cohorts with the "fully hidden, invite-only" type the spec needs.
-- hidden     → excluded from public Circle discovery.
-- beta_gated → membership/read/write gated to active beta members via RLS.
alter table public.cohorts add column if not exists hidden boolean not null default false;
alter table public.cohorts add column if not exists beta_gated boolean not null default false;

-- A hidden cohort's framing row is readable only by its members (active beta
-- members) or its managers — never the public. Non-hidden cohorts (Charter 100)
-- stay world-readable exactly as before.
drop policy if exists "cohorts readable" on public.cohorts;
create policy "cohorts readable" on public.cohorts
  for select using (
    hidden = false
    or (beta_gated and public.is_active_beta_member())
    or public.can_manage_community('cohort', id)
  );

-- "Is the caller a member of this beta-gated Circle?" — the per-cohort gate for
-- chat, ideas, and any other member-only content.
create or replace function public.is_beta_circle_member(p_cohort_id uuid, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cohorts c
    where c.id = p_cohort_id and c.beta_gated
  ) and public.is_active_beta_member(p_user);
$$;
grant execute on function public.is_beta_circle_member(uuid, uuid) to authenticated;

-- Seed the Founding Beta Circle. No member_cap (the cohort is whoever signed
-- up). Hidden + beta_gated. No invites row and no join_cohort path: membership
-- comes only through the beta invite/link flow.
insert into public.cohorts (slug, name, mission, access_type, member_cap, status, hidden, beta_gated)
values ('founding-beta', 'Founding Beta',
        'Our founding beta cohort. First in the door, shaping what we build next.',
        'closed', null, 'active', true, true)
on conflict (slug) do nothing;

-- ── Founding Beta chat (lightweight group chat — extends Circles) ──────────
create table public.cohort_posts (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  removed_at timestamptz,
  removed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index cohort_posts_cohort_idx on public.cohort_posts (cohort_id, created_at desc);

alter table public.cohort_posts enable row level security;

-- Read: active beta members of this beta-gated Circle, or managers. Removed
-- posts are hidden from members but visible to managers.
create policy "cohort_posts read" on public.cohort_posts
  for select using (
    (public.is_beta_circle_member(cohort_id) and removed_at is null)
    or public.can_manage_community('cohort', cohort_id)
  );

-- Post: only active beta members, only as themselves.
create policy "cohort_posts insert" on public.cohort_posts
  for insert with check (
    public.is_beta_circle_member(cohort_id)
    and profile_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Moderation: managers can remove (update/delete) any post.
create policy "cohort_posts manage" on public.cohort_posts
  for update using (public.can_manage_community('cohort', cohort_id))
  with check (public.can_manage_community('cohort', cohort_id));
create policy "cohort_posts delete" on public.cohort_posts
  for delete using (public.can_manage_community('cohort', cohort_id));

-- ════════════════════════════════════════════════════════════════════════
-- 4. Ideas space — feature requests with upvotes + simple comments
-- ════════════════════════════════════════════════════════════════════════
create table public.beta_ideas (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid not null references public.cohorts(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  removed_at  timestamptz,
  removed_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index beta_ideas_cohort_idx on public.beta_ideas (cohort_id, created_at desc);

create table public.beta_idea_votes (
  id         uuid primary key default gen_random_uuid(),
  idea_id    uuid not null references public.beta_ideas(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, profile_id)
);
create index beta_idea_votes_idea_idx on public.beta_idea_votes (idea_id);

create table public.beta_idea_comments (
  id         uuid primary key default gen_random_uuid(),
  idea_id    uuid not null references public.beta_ideas(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  removed_at timestamptz,
  created_at timestamptz not null default now()
);
create index beta_idea_comments_idea_idx on public.beta_idea_comments (idea_id, created_at);

alter table public.beta_ideas enable row level security;
alter table public.beta_idea_votes enable row level security;
alter table public.beta_idea_comments enable row level security;

-- Ideas: members read non-removed ideas in their Circle; managers see all.
create policy "beta_ideas read" on public.beta_ideas
  for select using (
    (public.is_beta_circle_member(cohort_id) and removed_at is null)
    or public.can_manage_community('cohort', cohort_id)
  );
create policy "beta_ideas insert" on public.beta_ideas
  for insert with check (
    public.is_beta_circle_member(cohort_id)
    and profile_id in (select id from public.profiles where user_id = auth.uid())
  );
-- Author may delete their own idea; managers moderate any.
create policy "beta_ideas author delete" on public.beta_ideas
  for delete using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
    or public.can_manage_community('cohort', cohort_id)
  );
create policy "beta_ideas manage" on public.beta_ideas
  for update using (public.can_manage_community('cohort', cohort_id))
  with check (public.can_manage_community('cohort', cohort_id));

-- Votes: visible to anyone who can read the idea; members vote/unvote as self.
create policy "beta_idea_votes read" on public.beta_idea_votes
  for select using (
    exists (
      select 1 from public.beta_ideas i
      where i.id = idea_id
        and (public.is_beta_circle_member(i.cohort_id)
             or public.can_manage_community('cohort', i.cohort_id))
    )
  );
create policy "beta_idea_votes insert" on public.beta_idea_votes
  for insert with check (
    profile_id in (select id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.beta_ideas i
      where i.id = idea_id and public.is_beta_circle_member(i.cohort_id)
    )
  );
create policy "beta_idea_votes delete" on public.beta_idea_votes
  for delete using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Comments: members read non-removed comments; members add as self; managers moderate.
create policy "beta_idea_comments read" on public.beta_idea_comments
  for select using (
    exists (
      select 1 from public.beta_ideas i
      where i.id = idea_id
        and ((public.is_beta_circle_member(i.cohort_id) and removed_at is null)
             or public.can_manage_community('cohort', i.cohort_id))
    )
  );
create policy "beta_idea_comments insert" on public.beta_idea_comments
  for insert with check (
    profile_id in (select id from public.profiles where user_id = auth.uid())
    and exists (
      select 1 from public.beta_ideas i
      where i.id = idea_id and public.is_beta_circle_member(i.cohort_id)
    )
  );
create policy "beta_idea_comments manage" on public.beta_idea_comments
  for update using (
    exists (
      select 1 from public.beta_ideas i
      where i.id = idea_id and public.can_manage_community('cohort', i.cohort_id)
    )
  ) with check (true);

-- Admin moderation of an idea (soft-remove so votes/comments stay intact).
create or replace function public.admin_remove_beta_idea(p_idea_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_cohort uuid;
begin
  select cohort_id into v_cohort from public.beta_ideas where id = p_idea_id;
  if v_cohort is null then raise exception 'no idea'; end if;
  if not public.can_manage_community('cohort', v_cohort) then
    raise exception 'not authorized';
  end if;
  update public.beta_ideas
    set removed_at = now(), removed_by = auth.uid()
    where id = p_idea_id and removed_at is null;
  perform public._log_admin_action('remove_beta_idea', 'beta_ideas', p_idea_id,
    jsonb_build_object('cohort_id', v_cohort));
end;
$$;

-- ── Member write paths (resolve profile + check membership server-side) ────
-- The UI calls these instead of inserting directly, mirroring
-- submit_cohort_feedback. RLS on the tables stays as a second layer.
create or replace function public._beta_member_profile(p_slug text, out v_profile uuid, out v_cohort uuid)
language plpgsql stable security definer set search_path = public as $$
begin
  select id into v_cohort from public.cohorts where slug = p_slug and beta_gated;
  if v_cohort is null then raise exception 'no beta circle'; end if;
  select id into v_profile from public.profiles where user_id = auth.uid();
  if v_profile is null then raise exception 'no profile'; end if;
  if not public.is_active_beta_member(auth.uid()) then raise exception 'not a member'; end if;
end;
$$;

create or replace function public.beta_circle_post(p_slug text, p_body text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_cohort uuid; v_id uuid;
begin
  if p_body is null or length(trim(p_body)) = 0 then raise exception 'empty message'; end if;
  select * into v_profile, v_cohort from public._beta_member_profile(p_slug);
  insert into public.cohort_posts (cohort_id, profile_id, body)
  values (v_cohort, v_profile, left(trim(p_body), 4000))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.beta_idea_submit(p_slug text, p_title text, p_description text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_cohort uuid; v_id uuid;
begin
  if p_title is null or length(trim(p_title)) = 0 then raise exception 'title required'; end if;
  select * into v_profile, v_cohort from public._beta_member_profile(p_slug);
  insert into public.beta_ideas (cohort_id, profile_id, title, description)
  values (v_cohort, v_profile, left(trim(p_title), 160), nullif(left(trim(coalesce(p_description,'')), 4000), ''))
  returning id into v_id;
  return v_id;
end;
$$;

-- Toggle the caller's upvote on an idea. Returns true if now voted, false if removed.
create or replace function public.beta_idea_toggle_vote(p_idea_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_cohort uuid; v_existing uuid;
begin
  select cohort_id into v_cohort from public.beta_ideas where id = p_idea_id and removed_at is null;
  if v_cohort is null then raise exception 'no idea'; end if;
  select id into v_profile from public.profiles where user_id = auth.uid();
  if v_profile is null then raise exception 'no profile'; end if;
  if not public.is_beta_circle_member(v_cohort, auth.uid()) then raise exception 'not a member'; end if;

  select id into v_existing from public.beta_idea_votes
    where idea_id = p_idea_id and profile_id = v_profile;
  if v_existing is not null then
    delete from public.beta_idea_votes where id = v_existing;
    return false;
  end if;
  insert into public.beta_idea_votes (idea_id, profile_id) values (p_idea_id, v_profile);
  return true;
end;
$$;

create or replace function public.beta_idea_add_comment(p_idea_id uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_cohort uuid; v_id uuid;
begin
  if p_body is null or length(trim(p_body)) = 0 then raise exception 'empty comment'; end if;
  select cohort_id into v_cohort from public.beta_ideas where id = p_idea_id and removed_at is null;
  if v_cohort is null then raise exception 'no idea'; end if;
  select id into v_profile from public.profiles where user_id = auth.uid();
  if v_profile is null then raise exception 'no profile'; end if;
  if not public.is_beta_circle_member(v_cohort, auth.uid()) then raise exception 'not a member'; end if;
  insert into public.beta_idea_comments (idea_id, profile_id, body)
  values (p_idea_id, v_profile, left(trim(p_body), 2000))
  returning id into v_id;
  return v_id;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════
-- 5. Beta-only job posts
-- ════════════════════════════════════════════════════════════════════════
-- public  → visible to everyone (today's behavior).
-- beta    → visible only to active beta members (and the posting business/admin).
alter table public.jobs
  add column if not exists visibility text not null default 'public'
  check (visibility in ('public', 'beta'));
create index if not exists idx_jobs_visibility on public.jobs (visibility);

-- Replace the single public read policy with two permissive SELECT policies
-- (they OR together): public approved jobs for everyone, beta approved jobs for
-- active beta members only. Owner/staff manage policies (which let them see
-- their own posts regardless of visibility) are untouched.
drop policy if exists "Anyone can view approved jobs" on public.jobs;
create policy "Anyone can view approved public jobs" on public.jobs
  for select using (status = 'approved' and visibility = 'public');
create policy "Beta members can view approved beta jobs" on public.jobs
  for select using (
    status = 'approved' and visibility = 'beta' and public.is_active_beta_member()
  );

-- Admins manage any job (needed so the admin view can create beta-only posts,
-- since admins may not own the posting business).
drop policy if exists "Admins can manage jobs" on public.jobs;
create policy "Admins can manage jobs" on public.jobs
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════════════════
-- 6. Admin actions: bulk invite, manual add, remove, signup split, backfill
-- ════════════════════════════════════════════════════════════════════════

-- Platform split for the admin dashboard (apple vs android counts).
create or replace function public.admin_beta_signup_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  select jsonb_build_object(
    'total',   count(*),
    'apple',   count(*) filter (where platform = 'apple'),
    'android', count(*) filter (where platform = 'android'),
    'invited', (select count(*) from public.beta_members where status = 'invited'),
    'active',  (select count(*) from public.beta_members where status = 'active'),
    'removed', (select count(*) from public.beta_members where status = 'removed')
  ) into v
  from public.beta_signups;
  return v;
end;
$$;

-- Bulk-invite everyone in beta_signups: flip/insert their beta_members row to
-- 'invited' (leaving already-active rows alone) and return the list that needs
-- an invite email. Called by the send-beta-invite edge function (service role),
-- which passes the validated admin id, then sends the emails.
create or replace function public.admin_beta_bulk_invite(p_admin uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_rows jsonb;
begin
  if not public.is_platform_admin(p_admin) then raise exception 'not authorized'; end if;

  insert into public.beta_members (email, platform, status, invited_at)
  select lower(s.email), s.platform, 'invited', now()
  from public.beta_signups s
  on conflict (lower(email)) do update
    set status      = case when beta_members.status = 'active'
                           then 'active' else 'invited' end,
        platform    = coalesce(beta_members.platform, excluded.platform),
        invited_at  = coalesce(beta_members.invited_at, now());

  select coalesce(jsonb_agg(jsonb_build_object('email', email, 'platform', platform)), '[]'::jsonb)
  into v_rows
  from public.beta_members
  where status = 'invited';

  perform public._log_admin_action('beta_bulk_invite', 'beta_members', null,
    jsonb_build_object('count', jsonb_array_length(v_rows)));
  return v_rows;
end;
$$;
revoke all on function public.admin_beta_bulk_invite(uuid) from public, anon, authenticated;

-- Manually add a member by email (the "added by an admin" exception). Creates
-- an invited row even when the email never signed up. Called from the admin
-- view with the admin's JWT.
create or replace function public.admin_beta_add_member(p_email text, p_platform text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  if p_email is null or length(trim(p_email)) = 0 then raise exception 'email required'; end if;
  if coalesce(p_platform, '') not in ('apple','android') then raise exception 'invalid platform'; end if;

  insert into public.beta_members (email, platform, status, invited_at)
  values (lower(trim(p_email)), p_platform, 'invited', now())
  on conflict (lower(email)) do update
    set status     = case when beta_members.status = 'removed' then 'invited'
                          else beta_members.status end,
        invited_at = coalesce(beta_members.invited_at, now());

  -- If an account with this email already exists, link it active right away.
  perform public._beta_link_user(u.id, u.email)
  from auth.users u where lower(u.email) = lower(trim(p_email));

  perform public._log_admin_action('beta_add_member', 'beta_members', null,
    jsonb_build_object('email', lower(trim(p_email)), 'platform', p_platform));
end;
$$;

-- Remove a member (revokes access; status stays as an audit trail).
create or replace function public.admin_beta_remove_member(p_member_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  update public.beta_members set status = 'removed' where id = p_member_id;
  perform public._log_admin_action('beta_remove_member', 'beta_members', p_member_id, '{}'::jsonb);
end;
$$;

-- ── Backfill safeguard (report → approve → apply) ──────────────────────────
-- Read-only DRY RUN: which beta_signups emails match an existing auth user that
-- is not yet an active beta member. NOTHING is written. The admin reviews this
-- before approving the apply step.
create or replace function public.admin_beta_backfill_report()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'signup_email',     s.email,
           'platform',         s.platform,
           'signup_created_at', s.created_at,
           'matched_user_id',  u.id,
           'matched_user_email', u.email,
           'current_status',   bm.status
         ) order by s.created_at), '[]'::jsonb)
  into v
  from public.beta_signups s
  join auth.users u on lower(u.email) = lower(s.email)
  left join public.beta_members bm on lower(bm.email) = lower(s.email)
  where coalesce(bm.status, 'none') <> 'active';
  return v;
end;
$$;

-- The APPLY step. Links every matched existing signup→user into beta_members as
-- active. Guarded by platform admin and logged. This is the ONLY function that
-- backfills existing data, and it runs only when an admin explicitly invokes it
-- from the admin view after reviewing the report — never automatically.
create or replace function public.admin_beta_backfill_apply()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_count int := 0; r record;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  for r in
    select u.id as user_id, u.email
    from public.beta_signups s
    join auth.users u on lower(u.email) = lower(s.email)
    left join public.beta_members bm on lower(bm.email) = lower(s.email)
    where coalesce(bm.status, 'none') <> 'active'
  loop
    if public._beta_link_user(r.user_id, r.email) then
      v_count := v_count + 1;
    end if;
  end loop;
  perform public._log_admin_action('beta_backfill_apply', 'beta_members', null,
    jsonb_build_object('linked', v_count));
  return jsonb_build_object('linked', v_count);
end;
$$;

-- Admin list of all members (for the admin view roster + moderation).
create or replace function public.admin_beta_members()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'not authorized'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'email', email, 'platform', platform, 'status', status,
           'invited_at', invited_at, 'joined_at', joined_at, 'has_account', user_id is not null
         ) order by created_at desc), '[]'::jsonb)
  into v from public.beta_members;
  return v;
end;
$$;
