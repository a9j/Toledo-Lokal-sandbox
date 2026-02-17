
-- Fix the security definer warning by explicitly setting SECURITY INVOKER
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public 
WITH (security_invoker = true) AS
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
  owner_user_id,
  created_at,
  updated_at
FROM public.businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();
