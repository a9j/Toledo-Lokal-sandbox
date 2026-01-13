-- Drop the security definer view and recreate with security invoker
DROP VIEW IF EXISTS public.businesses_public CASCADE;

-- Create secure view with security_invoker (runs with caller's permissions)
CREATE VIEW public.businesses_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  slug,
  description,
  address,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN phone
    WHEN phone IS NULL THEN NULL
    WHEN LENGTH(phone) <= 4 THEN '****'
    ELSE CONCAT(LEFT(phone, 3), '****', RIGHT(phone, 2))
  END as phone,
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
  owner_user_id
FROM businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.businesses_public TO anon, authenticated;