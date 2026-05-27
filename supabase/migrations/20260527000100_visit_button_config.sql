-- Configurable Visit button: businesses choose a destination type + URL, and the
-- public Visit button renders a matching label and target.

-- Enum of supported destinations.
DO $$ BEGIN
  CREATE TYPE public.visit_link_type AS ENUM (
    'website', 'facebook', 'instagram', 'google_maps',
    'phone', 'menu', 'booking', 'order_online'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Nullable: NULL/unset => the app falls back to the website.
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS visit_link_type public.visit_link_type,
  ADD COLUMN IF NOT EXISTS visit_link_url  text;

-- Recreate the public view so the new columns are readable on public profiles.
-- (Views with explicit column lists don't auto-pick up new table columns.)
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
  visit_link_type, visit_link_url,
  owner_user_id, created_at, updated_at
FROM public.businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();
