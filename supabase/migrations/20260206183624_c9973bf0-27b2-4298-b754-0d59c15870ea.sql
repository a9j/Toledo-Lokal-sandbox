-- Fix: Hide owner_user_id from non-owners in businesses_public view
-- This prevents correlation attacks and protects business owner privacy

DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  slug,
  description,
  address,
  mask_phone(phone) as phone,
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
  created_at,
  updated_at,
  -- Only expose owner_user_id to the owner themselves or admins
  CASE 
    WHEN auth.uid() = owner_user_id OR has_role(auth.uid(), 'admin') 
    THEN owner_user_id 
    ELSE NULL 
  END as owner_user_id
FROM businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();