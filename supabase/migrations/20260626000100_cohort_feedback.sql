-- Charter 100 feedback channel: the cohort's actual value is voice. A member
-- (or admin) submits feedback/ideas; visibility is author + admins. Kept
-- minimal — no public thread, no Loop Points, no perks.

create type public.cohort_feedback_kind as enum ('feedback','idea');

create table public.cohort_feedback (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references public.cohorts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind       public.cohort_feedback_kind not null default 'feedback',
  body       text not null,
  created_at timestamptz not null default now()
);

create index cohort_feedback_cohort_idx on public.cohort_feedback (cohort_id);

alter table public.cohort_feedback enable row level security;

-- A member sees their own submissions; admins see all. (Writes go through the
-- SECURITY DEFINER RPC below, so no INSERT policy is needed.)
create policy "feedback visible to author and admins" on public.cohort_feedback
  for select using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
    or public.has_role(auth.uid(),'admin')
  );

-- Submit feedback as the signed-in caller. Resolves profile from auth.uid(),
-- requires cohort membership (or admin), and caps body length.
create or replace function public.submit_cohort_feedback(p_slug text, p_kind text, p_body text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_profile uuid;
  v_cohort  uuid;
begin
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'empty feedback';
  end if;

  select id into v_profile from public.profiles where user_id = auth.uid();
  if v_profile is null then
    raise exception 'no profile';
  end if;

  select id into v_cohort from public.cohorts where slug = p_slug;
  if v_cohort is null then
    raise exception 'no cohort';
  end if;

  if not exists (
        select 1 from public.cohort_members
        where cohort_id = v_cohort and profile_id = v_profile
      )
     and not public.has_role(auth.uid(), 'admin') then
    raise exception 'not a member';
  end if;

  insert into public.cohort_feedback (cohort_id, profile_id, kind, body)
  values (
    v_cohort,
    v_profile,
    coalesce(nullif(p_kind, ''), 'feedback')::public.cohort_feedback_kind,
    left(trim(p_body), 4000)
  );
end;
$$;
