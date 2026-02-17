
-- Add tier columns to businesses table
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS tier_status text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS tier_badge_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tier_assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS tier_assigned_by uuid,
  ADD COLUMN IF NOT EXISTS tier_revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS tier_revoked_by uuid,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS profile_picture_url text,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- Add constraint for tier_status values using a trigger instead of CHECK
CREATE OR REPLACE FUNCTION public.validate_tier_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tier_status NOT IN ('founding_5', 'founding_50', 'general') THEN
    RAISE EXCEPTION 'Invalid tier_status: %. Must be founding_5, founding_50, or general', NEW.tier_status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_business_tier_status
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_tier_status();

-- Create tier_change_log table
CREATE TABLE public.tier_change_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL,
  previous_tier text NOT NULL,
  new_tier text NOT NULL,
  previous_badge_visible boolean NOT NULL DEFAULT true,
  new_badge_visible boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tier_change_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view tier change logs
CREATE POLICY "Admins can view tier change logs"
  ON public.tier_change_log
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert tier change logs
CREATE POLICY "Admins can insert tier change logs"
  ON public.tier_change_log
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add index for business_id lookups
CREATE INDEX idx_tier_change_log_business ON public.tier_change_log(business_id);

-- Add tier columns to businesses_public view - recreate it
-- First let's check what the view looks like
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public AS
SELECT 
  id,
  name,
  slug,
  description,
  address,
  public.mask_phone(phone) as phone,
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
  created_at,
  updated_at
FROM public.businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();

-- Add index for tier sorting
CREATE INDEX idx_businesses_tier_status ON public.businesses(tier_status);
