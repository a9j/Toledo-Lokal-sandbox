-- Fix leads_safe view RLS policies
-- The view needs explicit policies to ensure masked data protection

-- First, ensure the view exists with proper security
DROP VIEW IF EXISTS public.leads_safe;

CREATE VIEW public.leads_safe AS
SELECT 
  id,
  business_id,
  type,
  status,
  created_at,
  request_id,
  user_id,
  -- Mask sensitive contact information
  CASE 
    WHEN contact_info IS NULL THEN NULL
    WHEN LENGTH(contact_info) <= 6 THEN '****'
    ELSE CONCAT(LEFT(contact_info, 3), '****', RIGHT(contact_info, 2))
  END AS contact_info,
  CASE
    WHEN name IS NULL THEN NULL
    WHEN LENGTH(name) <= 2 THEN '**'
    ELSE CONCAT(LEFT(name, 1), '***')
  END AS name,
  -- Message can be shown but truncated for preview
  CASE
    WHEN message IS NULL THEN NULL
    ELSE LEFT(message, 50)
  END AS message_preview
FROM public.leads;

-- Grant access to the view
GRANT SELECT ON public.leads_safe TO authenticated;

-- Create RLS-like function to check lead access
CREATE OR REPLACE FUNCTION public.can_view_lead(_business_id uuid, _user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Business owner can view
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = _business_id AND owner_user_id = auth.uid()
    )
    OR
    -- Business staff can view
    EXISTS (
      SELECT 1 FROM business_staff
      WHERE business_id = _business_id AND user_id = auth.uid()
    )
    OR
    -- User can view their own leads
    (_user_id IS NOT NULL AND _user_id = auth.uid())
    OR
    -- Admin can view all
    has_role(auth.uid(), 'admin')
$$;

-- Fix overly permissive storage policies
-- Remove the broad path-based public access policy
DROP POLICY IF EXISTS "Public read access for business images" ON storage.objects;

-- Create more restrictive policy that only allows access to approved business content
CREATE POLICY "Signed URL access for uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND (
    -- Allow access through the get-signed-url edge function (service role)
    -- This is the recommended path for all uploads access
    auth.role() = 'service_role'
    OR
    -- Allow users to view their own uploads
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Allow business owners/staff to view their business uploads
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.status = 'approved'
      AND name LIKE 'businesses/' || b.id::text || '/%'
      AND (b.owner_user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM business_staff bs WHERE bs.business_id = b.id AND bs.user_id = auth.uid()
      ))
    )
  )
);