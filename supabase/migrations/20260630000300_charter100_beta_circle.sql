-- Charter 100 Beta Circle: a members-only discussion space for Charter 100
-- badge holders. Generalizes the circle membership model so cohorts can gate
-- on a profile badge (circle_badge_key) in addition to the existing
-- beta_gated + beta_members path.

-- ── 1. Extend cohorts with badge-gated membership ──────────────────────────
alter table public.cohorts add column if not exists circle_badge_key text;

comment on column public.cohorts.circle_badge_key is
  'When set, circle membership is determined by holding this profile_badges.badge_key.';

-- ── 2. Generalized circle membership predicate ─────────────────────────────
create or replace function public.is_circle_member(p_cohort_id uuid, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select
    -- Path A: beta-gated circles (founding-beta)
    public.is_beta_circle_member(p_cohort_id, p_user)
    -- Path B: badge-gated circles (charter100-beta)
    or exists (
      select 1 from public.cohorts c
      join public.profile_badges pb on pb.badge_key = c.circle_badge_key
      join public.profiles p on p.id = pb.profile_id
      where c.id = p_cohort_id
        and c.circle_badge_key is not null
        and p.user_id = p_user
    )
    -- Path C: direct cohort membership
    or exists (
      select 1 from public.cohort_members cm
      join public.profiles p on p.id = cm.profile_id
      where cm.cohort_id = p_cohort_id and p.user_id = p_user
    );
$$;
grant execute on function public.is_circle_member(uuid, uuid) to authenticated;

-- Convenience: check by slug (used from frontend RPC calls).
create or replace function public.is_circle_member_by_slug(p_slug text, p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_circle_member(
    (select id from public.cohorts where slug = p_slug),
    p_user
  );
$$;
grant execute on function public.is_circle_member_by_slug(text, uuid) to authenticated;

-- ── 3. Generalized circle RPCs (chat + ideas) ──────────────────────────────
-- Internal helper: resolve caller's profile + circle, checking membership.
create or replace function public._circle_member_profile(p_slug text)
returns table(profile_id uuid, cohort_id uuid)
language plpgsql stable security definer set search_path = public as $$
declare v_cohort uuid; v_profile uuid;
begin
  select id into v_cohort from public.cohorts where slug = p_slug;
  if v_cohort is null then raise exception 'no circle with slug %', p_slug; end if;
  select id into v_profile from public.profiles where user_id = auth.uid();
  if v_profile is null then raise exception 'no profile'; end if;
  if not public.is_circle_member(v_cohort, auth.uid()) then raise exception 'not a member'; end if;
  return query select v_profile, v_cohort;
end;
$$;

-- Post a chat message to any circle the caller belongs to.
create or replace function public.circle_post(p_slug text, p_body text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_cohort uuid; v_id uuid;
begin
  if p_body is null or length(trim(p_body)) = 0 then raise exception 'empty message'; end if;
  select * into v_profile, v_cohort from public._circle_member_profile(p_slug);
  insert into public.cohort_posts (cohort_id, profile_id, body)
  values (v_cohort, v_profile, left(trim(p_body), 4000))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.circle_post(text, text) to authenticated;

-- Submit an idea to any circle the caller belongs to.
create or replace function public.circle_idea_submit(p_slug text, p_title text, p_description text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_cohort uuid; v_id uuid;
begin
  if p_title is null or length(trim(p_title)) = 0 then raise exception 'title required'; end if;
  select * into v_profile, v_cohort from public._circle_member_profile(p_slug);
  insert into public.beta_ideas (cohort_id, profile_id, title, description)
  values (v_cohort, v_profile, left(trim(p_title), 160), nullif(left(trim(coalesce(p_description,'')), 4000), ''))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.circle_idea_submit(text, text, text) to authenticated;

-- ── 4. Broaden RLS on cohort_posts and beta_ideas ───────────────────────────
-- Replace the beta-only read/insert policies with generalized circle membership.

drop policy if exists "cohort_posts read" on public.cohort_posts;
create policy "cohort_posts read" on public.cohort_posts
  for select using (
    (public.is_circle_member(cohort_id) and removed_at is null)
    or public.can_manage_community('cohort', cohort_id)
  );

drop policy if exists "cohort_posts insert" on public.cohort_posts;
create policy "cohort_posts insert" on public.cohort_posts
  for insert with check (
    public.is_circle_member(cohort_id)
    and profile_id in (select id from public.profiles where user_id = auth.uid())
  );

drop policy if exists "beta_ideas read" on public.beta_ideas;
create policy "beta_ideas read" on public.beta_ideas
  for select using (
    (public.is_circle_member(cohort_id) and removed_at is null)
    or public.can_manage_community('cohort', cohort_id)
  );

drop policy if exists "beta_ideas insert" on public.beta_ideas;
create policy "beta_ideas insert" on public.beta_ideas
  for insert with check (
    public.is_circle_member(cohort_id)
    and profile_id in (select id from public.profiles where user_id = auth.uid())
  );

-- Votes/comments: broaden read policies to circle members.
drop policy if exists "beta_idea_votes read" on public.beta_idea_votes;
create policy "beta_idea_votes read" on public.beta_idea_votes
  for select using (
    exists (
      select 1 from public.beta_ideas i
      where i.id = idea_id
        and (public.is_circle_member(i.cohort_id)
             or public.can_manage_community('cohort', i.cohort_id))
    )
  );

drop policy if exists "beta_idea_comments read" on public.beta_idea_comments;
create policy "beta_idea_comments read" on public.beta_idea_comments
  for select using (
    exists (
      select 1 from public.beta_ideas i
      where i.id = idea_id
        and (public.is_circle_member(i.cohort_id)
             or public.can_manage_community('cohort', i.cohort_id))
    )
  );

-- ── 5. Update cohorts RLS to include badge-gated circles ────────────────────
-- Non-hidden circles should be readable. Badge-gated circles are not hidden;
-- they show up in directory. The existing policy only covers beta_gated.
drop policy if exists "cohorts select" on public.cohorts;
create policy "cohorts select" on public.cohorts
  for select using (
    hidden = false
    or (beta_gated and public.is_active_beta_member(auth.uid()))
    or public.can_manage_community('cohort', id)
  );

-- ── 6. Seed the Charter 100 Beta Circle ─────────────────────────────────────
insert into public.cohorts (slug, name, mission, access_type, status, hidden, beta_gated, circle_badge_key)
values (
  'charter100-beta',
  'Charter 100',
  'The founding 100 residents shaping what comes next.',
  'closed',
  'active',
  false,
  false,
  'charter100'
)
on conflict (slug) do nothing;
