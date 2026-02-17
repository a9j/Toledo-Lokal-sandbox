
-- Update validate_tier_status trigger function for 5 tiers
CREATE OR REPLACE FUNCTION public.validate_tier_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tier_status NOT IN ('founding_5', 'founding_50', 'community', 'growth', 'pro') THEN
    RAISE EXCEPTION 'Invalid tier_status: %. Must be founding_5, founding_50, community, growth, or pro', NEW.tier_status;
  END IF;
  RETURN NEW;
END;
$function$;

-- Migrate existing 'general' tier_status to 'community'
UPDATE public.businesses SET tier_status = 'community' WHERE tier_status = 'general';

-- Change default for tier_status column
ALTER TABLE public.businesses ALTER COLUMN tier_status SET DEFAULT 'community';

-- Add ownership review fields
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS ownership_review_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS ownership_review_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS ownership_review_notes text;

-- Recreate businesses_public view with new columns
DROP VIEW IF EXISTS public.businesses_public;
CREATE VIEW public.businesses_public
WITH (security_invoker = true) AS
SELECT
  id, name, slug, description, address, phone, website, instagram, tiktok, facebook,
  category_id, neighborhood_id, featured, verified, average_rating, review_count,
  photos, logo_url, hours, editor_pick_image, story, status,
  tier_status, tier_badge_visible, tier_assigned_at,
  profile_picture_url, cover_image_url,
  onboarding_completed, onboarding_step,
  ownership_review_status,
  owner_user_id, created_at, updated_at
FROM public.businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();

-- Fix nonprofit security: create a public view excluding sensitive fields
CREATE OR REPLACE VIEW public.nonprofits_public
WITH (security_invoker = true) AS
SELECT
  id, name, slug, cause_category, neighborhood_id,
  community_support_types, founding_community_partner,
  claimed, claimed_by, claimed_at,
  mission_statement, what_this_helps, human_note,
  website, address, logo_url, cover_image_url, status,
  created_at, updated_at
FROM public.nonprofits
WHERE status = 'active';
