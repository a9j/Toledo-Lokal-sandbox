-- Fix: Restrict business_invitations viewing to owners only (not staff)
-- Drop existing policies first
DROP POLICY IF EXISTS "View invitation with matching token only" ON public.business_invitations;

-- Create more restrictive policy - only owners can view invitations with contact details
CREATE POLICY "Only owners can view invitations" 
ON public.business_invitations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_invitations.business_id 
    AND b.owner_user_id = auth.uid()
  )
);

-- Fix: Strengthen the leads table RLS policy to use a secure function
-- Create a security definer function to safely check business ownership
CREATE OR REPLACE FUNCTION public.user_owns_business(biz_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = biz_id AND owner_user_id = auth.uid()
  );
$$;

-- Drop and recreate leads policies with the secure function
DROP POLICY IF EXISTS "Business owners can view own leads" ON public.leads;
DROP POLICY IF EXISTS "Business owners can update own leads" ON public.leads;

CREATE POLICY "Business owners can view own leads" 
ON public.leads 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR public.user_owns_business(business_id)
);

CREATE POLICY "Business owners can update own leads" 
ON public.leads 
FOR UPDATE 
USING (public.user_owns_business(business_id));