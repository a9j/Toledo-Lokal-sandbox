-- Flexible business profile system: a category enum + per-business module
-- content. The app reads `category` to decide which content modules render in
-- the fixed profile shell, and stores their content in `profile_modules`.

DO $$ BEGIN
  CREATE TYPE public.business_category AS ENUM (
    'restaurant', 'food_truck', 'retail', 'salon_barber', 'gym_fitness',
    'contractor_service', 'nonprofit', 'childcare', 'artist_maker',
    'event_venue', 'professional_service', 'community_org'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Existing businesses default to restaurant (reassigned manually later).
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS category public.business_category NOT NULL DEFAULT 'restaurant',
  ADD COLUMN IF NOT EXISTS profile_modules jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Recreate the public view to expose the new columns (and the visit_link_*
-- columns from the previous migration).
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
  category, profile_modules,
  owner_user_id, created_at, updated_at
FROM public.businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();
