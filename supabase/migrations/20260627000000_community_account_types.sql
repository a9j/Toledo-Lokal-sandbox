-- Community account types and verification system
-- Adds account_type and verification_status to businesses, plus
-- tables for nonprofit verification data, community project sponsors,
-- and community promotions.

-- 1. Account type enum
CREATE TYPE public.account_type AS ENUM ('business', 'nonprofit', 'community_partner');

-- 2. Verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- 3. Add fields to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS account_type public.account_type NOT NULL DEFAULT 'business',
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status,
  ADD COLUMN IF NOT EXISTS ein text,
  ADD COLUMN IF NOT EXISTS determination_letter_url text,
  ADD COLUMN IF NOT EXISTS community_partner_mission text,
  ADD COLUMN IF NOT EXISTS community_partner_reason text,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by uuid REFERENCES auth.users(id);

-- 4. Community project sponsors (businesses participating in nonprofit projects)
CREATE TABLE IF NOT EXISTS public.community_project_sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonprofit_id uuid NOT NULL REFERENCES public.nonprofits(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  role text NOT NULL DEFAULT 'sponsor',
  description text,
  amount_cents integer,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_sponsor_role CHECK (role IN ('sponsor', 'donor', 'wishlist_fulfiller', 'event_host'))
);

CREATE INDEX IF NOT EXISTS idx_cps_nonprofit ON public.community_project_sponsors(nonprofit_id);
CREATE INDEX IF NOT EXISTS idx_cps_business ON public.community_project_sponsors(business_id);

-- 5. Community promotions (optional paid boosts for nonprofits)
CREATE TABLE IF NOT EXISTS public.community_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  promotion_type text NOT NULL,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  amount_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_promotion_type CHECK (promotion_type IN ('featured_drive', 'volunteer_spotlight', 'pinned_project')),
  CONSTRAINT valid_promotion_status CHECK (status IN ('pending', 'active', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_cp_business ON public.community_promotions(business_id);

-- 6. RLS for community_project_sponsors
ALTER TABLE public.community_project_sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sponsors"
  ON public.community_project_sponsors FOR SELECT
  USING (status = 'active');

CREATE POLICY "Business owners can manage their sponsorships"
  ON public.community_project_sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = community_project_sponsors.business_id
        AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Nonprofit claimers can manage project sponsors"
  ON public.community_project_sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.nonprofits n
      WHERE n.id = community_project_sponsors.nonprofit_id
        AND n.claimed_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all sponsors"
  ON public.community_project_sponsors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
  );

-- 7. RLS for community_promotions
ALTER TABLE public.community_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promotions"
  ON public.community_promotions FOR SELECT
  USING (status IN ('active', 'completed'));

CREATE POLICY "Org owners can manage their promotions"
  ON public.community_promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = community_promotions.business_id
        AND b.owner_user_id = auth.uid()
        AND b.account_type IN ('nonprofit', 'community_partner')
    )
  );

CREATE POLICY "Admins can manage all promotions"
  ON public.community_promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
  );

-- 8. RLS: prevent for-profit businesses from setting themselves as nonprofit/community_partner
-- This trigger rejects writes that try to set account_type to nonprofit or community_partner
-- without going through the proper signup flow (which sets verification_status=pending).
CREATE OR REPLACE FUNCTION public.enforce_community_account_type()
RETURNS TRIGGER AS $$
BEGIN
  -- If changing to nonprofit or community_partner, require pending verification
  IF NEW.account_type IN ('nonprofit', 'community_partner')
     AND (OLD IS NULL OR OLD.account_type = 'business')
     AND NEW.verification_status IS DISTINCT FROM 'pending' THEN
    -- Allow admins to bypass
    IF EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    ) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Community account types require verification. Use the nonprofit or community partner signup flow.';
  END IF;

  -- Only admins can flip verification_status to approved/rejected
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NEW.verification_status IN ('approved', 'rejected') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    ) THEN
      RAISE EXCEPTION 'Only admins can approve or reject verification.';
    END IF;
    NEW.verification_reviewed_at := now();
    NEW.verification_reviewed_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_community_account_type
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_community_account_type();

-- 9. Deactivate the "Nonprofits & Community" browse category so it no longer
-- appears in Discover filters or business signup. The category row stays for
-- historical FK integrity; we just flip active to false.
UPDATE public.categories
  SET active = false
  WHERE slug = 'community-nonprofits'
     OR name IN ('Nonprofits & Community', 'Community & Nonprofits');

-- 10. View: approved community orgs (for the Community tab)
CREATE OR REPLACE VIEW public.community_directory AS
SELECT
  b.id,
  b.name,
  b.slug,
  b.description,
  b.account_type,
  b.verification_status,
  b.address,
  b.phone,
  b.website,
  b.instagram,
  b.profile_picture_url AS logo_url,
  b.cover_image_url,
  b.neighborhood_id,
  b.ein,
  b.community_partner_mission,
  b.created_at
FROM public.businesses b
WHERE b.account_type IN ('nonprofit', 'community_partner')
  AND b.verification_status = 'approved'
  AND b.status = 'approved';
