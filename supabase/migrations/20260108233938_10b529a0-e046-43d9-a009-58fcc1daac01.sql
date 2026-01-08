-- Drop and recreate the businesses_public view to mask owner_user_id
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public
WITH (security_invoker = true)
AS
SELECT 
    b.id,
    b.name,
    b.description,
    b.address,
    b.phone,
    b.website,
    b.instagram,
    b.category_id,
    b.neighborhood_id,
    b.featured,
    b.verified,
    b.average_rating,
    b.review_count,
    b.photos,
    b.logo_url,
    b.hours,
    b.editor_pick_image,
    b.story,
    b.status,
    b.created_at,
    b.updated_at,
    -- Only expose owner_user_id to the actual owner
    CASE WHEN b.owner_user_id = auth.uid() THEN b.owner_user_id ELSE NULL END AS owner_user_id
FROM public.businesses b
WHERE b.status = 'approved' OR b.owner_user_id = auth.uid();