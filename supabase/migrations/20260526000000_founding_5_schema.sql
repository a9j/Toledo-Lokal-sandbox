-- Founding 5: founding fields on the brand, an applications table, and a
-- one-primary-location invariant.
--
-- Reuse note: in this schema the existing `businesses` row IS the brand, and
-- `business_locations` (keyed by business_id, with is_primary) already provides
-- multi-location support. The founding tier already lives on
-- `businesses.tier_status` ('founding_5' | 'founding_50' | 'community' |
-- 'growth' | 'pro'), validated by the validate_tier_status() trigger. This
-- migration only adds what is missing for the Founding 5 page; it does not
-- create a parallel business_brands model.

-- 1. Founding + owner-display fields on businesses (the brand) ----------------
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS founding_number integer,
  ADD COLUMN IF NOT EXISTS founding_quote  text,
  ADD COLUMN IF NOT EXISTS owner_name      text,
  ADD COLUMN IF NOT EXISTS owner_image_url text;

COMMENT ON COLUMN public.businesses.founding_number  IS 'Permanent founding position (No. 01..05 for Founding 5, 01..50 for Founding 50). NULL until claimed.';
COMMENT ON COLUMN public.businesses.founding_quote   IS 'One-line owner quote shown on the Founding 5 card.';
COMMENT ON COLUMN public.businesses.owner_name       IS 'Owner display name shown on profile/Founding 5 cards.';
COMMENT ON COLUMN public.businesses.owner_image_url  IS 'Owner photo (small circular avatar) for profile/Founding 5 cards.';

-- founding_number is unique only when set, so unclaimed brands stay NULL.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_businesses_founding_number
  ON public.businesses (founding_number)
  WHERE founding_number IS NOT NULL;

-- Fast lookup + ordering for the Founding 5 / 50 lists.
CREATE INDEX IF NOT EXISTS idx_businesses_founding
  ON public.businesses (tier_status, founding_number)
  WHERE tier_status IN ('founding_5', 'founding_50');

-- 2. Founding 5 applications --------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.founding_5_category AS ENUM
    ('morning', 'evening', 'retail', 'experience', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.founding_5_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  owner_name    text NOT NULL,
  email         text NOT NULL,
  phone         text,
  neighborhood  text,
  category      public.founding_5_category,
  why_us        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founding_5_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (the form is public; applicants are usually signed out).
DROP POLICY IF EXISTS "Anyone can submit a founding 5 application" ON public.founding_5_applications;
CREATE POLICY "Anyone can submit a founding 5 application"
  ON public.founding_5_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read / manage submitted applications.
DROP POLICY IF EXISTS "Admins manage founding 5 applications" ON public.founding_5_applications;
CREATE POLICY "Admins manage founding 5 applications"
  ON public.founding_5_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_founding_5_applications_created
  ON public.founding_5_applications (created_at DESC);

-- 3. Multi-location data migration: exactly one primary per brand ------------
-- "Each business becomes one brand with one primary location."

-- 3a. Demote duplicate primaries (keep the oldest).
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY business_id ORDER BY created_at, id) AS rn
  FROM public.business_locations
  WHERE is_primary
)
UPDATE public.business_locations bl
SET is_primary = false
FROM ranked r
WHERE bl.id = r.id AND r.rn > 1;

-- 3b. Promote a primary for any brand that has locations but none primary.
WITH first_loc AS (
  SELECT DISTINCT ON (business_id) id, business_id
  FROM public.business_locations
  ORDER BY business_id, created_at, id
)
UPDATE public.business_locations bl
SET is_primary = true
FROM first_loc f
WHERE bl.id = f.id
  AND NOT EXISTS (
    SELECT 1 FROM public.business_locations p
    WHERE p.business_id = bl.business_id AND p.is_primary
  );

-- 3c. Brands with no location row but a usable address get one primary
--     location built from their profile, so the directory map has a pin.
--     (Online-only brands with no address are skipped.)
INSERT INTO public.business_locations
  (business_id, street_address, city, state, zip_code, neighborhood, phone, is_primary, is_active)
SELECT b.id,
       b.address,
       'Toledo',
       'OH',
       '',
       n.name,
       b.phone,
       true,
       true
FROM public.businesses b
LEFT JOIN public.neighborhoods n ON n.id = b.neighborhood_id
WHERE b.address IS NOT NULL
  AND length(trim(b.address)) > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.business_locations l WHERE l.business_id = b.id
  );

-- 3d. Enforce at most one primary location per brand going forward.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_primary_location_per_business
  ON public.business_locations (business_id)
  WHERE is_primary;

-- 4. Expose the new founding/owner fields on the public view -----------------
-- Recreated to match the current definition plus the four new columns.
-- Behaviour is preserved: approved brands are visible to everyone, and owners
-- can always see their own brand.
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public AS
SELECT
  id,
  name,
  slug,
  description,
  address,
  public.mask_phone(phone) AS phone,
  website,
  instagram,
  tiktok,
  facebook,
  category_id,
  neighborhood_id,
  featured,
  verified,
  average_rating,
  review_count,
  photos,
  logo_url,
  hours,
  editor_pick_image,
  story,
  status,
  tier_status,
  tier_badge_visible,
  tier_assigned_at,
  profile_picture_url,
  cover_image_url,
  onboarding_completed,
  onboarding_step,
  founding_number,
  founding_quote,
  owner_name,
  owner_image_url,
  created_at,
  updated_at
FROM public.businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();

GRANT SELECT ON public.businesses_public TO anon, authenticated;
