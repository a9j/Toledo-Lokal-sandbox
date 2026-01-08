-- Create a secure function to get businesses that hides owner_user_id from non-owners
CREATE OR REPLACE FUNCTION public.get_public_businesses()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  phone text,
  website text,
  instagram text,
  category_id uuid,
  neighborhood_id uuid,
  featured boolean,
  verified boolean,
  average_rating numeric,
  review_count integer,
  photos text[],
  logo_url text,
  hours jsonb,
  editor_pick_image text,
  story text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  is_owner boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
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
    (b.owner_user_id = auth.uid()) AS is_owner
  FROM public.businesses b
  WHERE b.status = 'approved' OR b.owner_user_id = auth.uid()
$$;

-- Create a function to get a single business by ID (hides owner_user_id from non-owners)
CREATE OR REPLACE FUNCTION public.get_business_by_id(business_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  phone text,
  website text,
  instagram text,
  category_id uuid,
  neighborhood_id uuid,
  featured boolean,
  verified boolean,
  average_rating numeric,
  review_count integer,
  photos text[],
  logo_url text,
  hours jsonb,
  editor_pick_image text,
  story text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  is_owner boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
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
    (b.owner_user_id = auth.uid()) AS is_owner
  FROM public.businesses b
  WHERE b.id = business_id 
    AND (b.status = 'approved' OR b.owner_user_id = auth.uid())
$$;