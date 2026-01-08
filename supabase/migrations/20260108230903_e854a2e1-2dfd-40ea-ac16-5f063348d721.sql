-- Drop the existing views and recreate with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.businesses_public;
DROP VIEW IF EXISTS public.leads_safe;

-- Recreate businesses_public view with SECURITY INVOKER (explicit)
-- This ensures RLS from the base table is properly enforced
CREATE VIEW public.businesses_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  description,
  address,
  phone,
  website,
  instagram,
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
  -- Only show owner_user_id if the current user is the owner or an admin
  CASE 
    WHEN owner_user_id = auth.uid() THEN owner_user_id
    WHEN public.has_role(auth.uid(), 'admin') THEN owner_user_id
    ELSE NULL 
  END as owner_user_id
FROM public.businesses;

-- Grant access to the view
GRANT SELECT ON public.businesses_public TO authenticated, anon;

-- Recreate leads_safe view with SECURITY INVOKER (explicit)
CREATE VIEW public.leads_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  business_id,
  user_id,
  request_id,
  type,
  name,
  message,
  created_at,
  status,
  -- Only show contact_info for new/active leads, mask for closed leads
  CASE 
    WHEN status IN ('new', 'contacted') THEN contact_info
    ELSE NULL
  END as contact_info
FROM public.leads;

-- Grant access to the view
GRANT SELECT ON public.leads_safe TO authenticated;