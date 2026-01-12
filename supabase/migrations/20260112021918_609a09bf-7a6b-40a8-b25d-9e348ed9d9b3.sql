-- Fix Security Issue 1: Protect owner_user_id from public access
-- Drop and recreate the businesses_public view to completely exclude owner_user_id for non-owners
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public AS
SELECT 
    id,
    name,
    slug,
    description,
    address,
    phone,
    website,
    instagram,
    facebook,
    tiktok,
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
    -- Only expose owner_user_id to the actual owner, otherwise return NULL
    CASE
        WHEN owner_user_id = auth.uid() THEN owner_user_id
        ELSE NULL
    END AS owner_user_id
FROM businesses
WHERE status = 'approved' OR owner_user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.businesses_public TO anon, authenticated;

-- Fix Security Issue 2: Improve leads isolation
-- Update leads_safe view to include RLS-like security and be more secure
DROP VIEW IF EXISTS public.leads_safe;

CREATE VIEW public.leads_safe 
WITH (security_invoker = true)
AS
SELECT 
    l.id,
    l.business_id,
    l.user_id,
    l.request_id,
    l.type,
    l.name,
    -- Always mask contact info in the safe view
    CASE
        WHEN l.contact_info IS NULL THEN NULL
        WHEN length(l.contact_info) <= 6 THEN '******'
        ELSE left(l.contact_info, 3) || repeat('*', length(l.contact_info) - 3)
    END AS contact_info_masked,
    -- Only show full contact_info to the business owner
    CASE
        WHEN EXISTS (
            SELECT 1 FROM businesses b 
            WHERE b.id = l.business_id 
            AND b.owner_user_id = auth.uid()
        ) THEN l.contact_info
        ELSE NULL
    END AS contact_info,
    l.message,
    l.status,
    l.created_at
FROM leads l
WHERE 
    -- Only show leads to their respective business owners or admins
    EXISTS (
        SELECT 1 FROM businesses b 
        WHERE b.id = l.business_id 
        AND b.owner_user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin');

-- Grant access to the safe view
GRANT SELECT ON public.leads_safe TO authenticated;

-- Revoke direct SELECT on leads table from anon (they shouldn't see leads at all)
REVOKE SELECT ON public.leads FROM anon;