-- Fix Security Definer View warning by adding security_invoker to businesses_public
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public 
WITH (security_invoker = on)
AS
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