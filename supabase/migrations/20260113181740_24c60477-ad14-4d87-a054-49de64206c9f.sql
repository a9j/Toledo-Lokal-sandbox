-- Create a function to mask phone numbers for unauthenticated users
CREATE OR REPLACE FUNCTION public.mask_phone(phone_number text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() IS NOT NULL THEN phone_number
    WHEN phone_number IS NULL THEN NULL
    WHEN LENGTH(phone_number) <= 4 THEN '****'
    ELSE CONCAT(LEFT(phone_number, 3), '****', RIGHT(phone_number, 2))
  END;
$$;

-- Create a secure view for public business access with masked phone
DROP VIEW IF EXISTS public.businesses_public CASCADE;

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
  created_at,
  updated_at,
  owner_user_id
FROM businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.businesses_public TO anon, authenticated;