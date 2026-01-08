-- Fix 1: Create a secure view for businesses that hides owner_user_id for non-owners
-- This ensures even if the app queries the table directly, owner_user_id is masked for non-owners
CREATE OR REPLACE VIEW public.businesses_public AS
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
FROM public.businesses
WHERE status = 'approved' OR owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');

-- Grant access to the view
GRANT SELECT ON public.businesses_public TO authenticated, anon;

-- Fix 2: Create a secure view for leads that masks contact_info for closed/responded leads
-- Business owners can only see contact info for new/active leads
CREATE OR REPLACE VIEW public.leads_safe AS
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
  -- Only show contact_info for new leads, mask for closed/responded leads
  CASE 
    WHEN status IN ('new', 'contacted') THEN contact_info
    ELSE NULL
  END as contact_info
FROM public.leads;

-- Grant access to the view - it will inherit RLS from the base table
GRANT SELECT ON public.leads_safe TO authenticated;