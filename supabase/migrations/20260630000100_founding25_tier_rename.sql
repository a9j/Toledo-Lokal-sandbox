-- Rename tier_status value 'founding_50' → 'founding_25'.
--
-- The Founding 50 tier was restructured into Founding 25 ("First Wave"). The UI
-- already displays "Founding 25" but the database value was still 'founding_50'.
-- This migration:
--   1. Updates the validation trigger to accept 'founding_25' instead of 'founding_50'
--   2. Remaps any existing business rows from 'founding_50' to 'founding_25'
--   3. Rebuilds is_beta_eligible() with the corrected tier name
--   4. Rebuilds admin_eligibility_report() with the corrected tier name
--   5. Rebuilds the founding_members_public view with the corrected tier name

-- ── 1. Validation trigger ───────────────────────────────────────────────
create or replace function public.validate_tier_status()
  returns trigger
  language plpgsql
  set search_path to 'public'
as $function$
begin
  if new.tier_status not in ('founding_5', 'founding_25', 'community', 'growth', 'pro', 'civic_partner') then
    raise exception 'Invalid tier_status: %. Must be founding_5, founding_25, community, growth, pro, or civic_partner', new.tier_status;
  end if;
  return new;
end;
$function$;

-- ── 2. Remap existing rows ─────────────────────────────────────────────
update public.businesses
  set tier_status = 'founding_25'
  where tier_status = 'founding_50';

-- ── 3. Rebuild is_beta_eligible with corrected tier name ────────────────
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
        and b.tier_status in ('founding_5','founding_25')
    )
    or public.is_active_beta_member(p_user)
  ), false);
$$;

-- ── 4. Rebuild admin_eligibility_report with corrected tier name ────────
create or replace function public.admin_eligibility_report(p_user_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_profile uuid;
  v_cohort  boolean;
  v_biz     boolean;
  v_beta    boolean;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  select id into v_profile from public.profiles where user_id = p_user_id;

  v_cohort := exists (
    select 1 from public.cohort_members cm
    join public.cohorts c on c.id = cm.cohort_id
    where cm.profile_id = v_profile and c.access_type = 'closed'
  );

  v_biz := exists (
    select 1 from public.businesses b
    where b.owner_user_id = p_user_id
      and b.tier_status in ('founding_5','founding_25')
  );

  v_beta := public.is_active_beta_member(p_user_id);

  return jsonb_build_object(
    'user_id',        p_user_id,
    'profile_id',     v_profile,
    'cohort_member',  v_cohort,
    'founding_biz',   v_biz,
    'active_beta',    v_beta,
    'eligible',       v_cohort or v_biz or v_beta
  );
end;
$$;

-- ── 5. Rebuild founding_members_public view ─────────────────────────────
create or replace view public.founding_members_public as
  select
    b.id, b.slug, b.name, b.tier_status, b.founding_number,
    b.founding_quote, b.owner_name, b.owner_image_url, b.cover_image_url,
    b.neighborhood_id, n.name as neighborhood_name
  from public.businesses b
  left join public.neighborhoods n on n.id = b.neighborhood_id
  where b.status = 'approved'
    and b.tier_status in ('founding_5', 'founding_25');
