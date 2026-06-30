-- Rename tier_status value 'founding_50' → 'founding_25'.
--
-- The Founding 50 tier was restructured into Founding 25 ("First Wave"). The UI
-- already displays "Founding 25" but the database value was still 'founding_50'.
-- This migration:
--   1. Updates the validation trigger to accept 'founding_25' instead of 'founding_50'
--   2. Remaps any existing business rows from 'founding_50' to 'founding_25'
--   3. Creates is_beta_eligible() — Founding business ownership check
--      (cohort_members check added in a later migration once that table exists)
--   4. Rebuilds the founding_members_public view with the corrected tier name

-- ── 1. Validation trigger ───────────────────────────────────────────────
create or replace function public.validate_tier_status()
  returns trigger
  language plpgsql
  set search_path to 'public'
as $fn$
begin
  if new.tier_status not in ('founding_5', 'founding_25', 'community', 'growth', 'pro', 'civic_partner') then
    raise exception 'Invalid tier_status: %. Must be founding_5, founding_25, community, growth, pro, or civic_partner', new.tier_status;
  end if;
  return new;
end;
$fn$;

-- ── 2. Remap existing rows ─────────────────────────────────────────────
update public.businesses
  set tier_status = 'founding_25'
  where tier_status = 'founding_50';

-- ── 3. Create is_beta_eligible ──────────────────────────────────────────
-- Checks Founding business ownership. Expand with cohort_members check once
-- that table is created.
create or replace function public.is_beta_eligible(p_user uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    exists (
      select 1 from public.businesses b
      where b.owner_user_id = p_user
        and b.tier_status in ('founding_5','founding_25')
    ),
    false
  );
$$;

-- ── 4. Rebuild founding_members_public view ─────────────────────────────
create or replace view public.founding_members_public as
  select
    b.id, b.slug, b.name, b.tier_status, b.founding_number,
    b.founding_quote, b.owner_name, b.owner_image_url, b.cover_image_url,
    b.neighborhood_id, n.name as neighborhood_name
  from public.businesses b
  left join public.neighborhoods n on n.id = b.neighborhood_id
  where b.status = 'approved'
    and b.tier_status in ('founding_5', 'founding_25');
