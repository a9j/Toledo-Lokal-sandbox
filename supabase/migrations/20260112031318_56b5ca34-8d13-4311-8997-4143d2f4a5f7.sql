-- Fix business_invitations token exposure by restricting public access
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.business_invitations;

-- Create a more restrictive policy that requires a specific token match
-- This policy only allows viewing an invitation if you provide the exact token
CREATE POLICY "View invitation with matching token only"
ON public.business_invitations
FOR SELECT
USING (
  -- Allow staff/owners of the business to see their invitations
  EXISTS (
    SELECT 1 FROM public.business_staff bs
    WHERE bs.business_id = business_invitations.business_id
    AND bs.user_id = auth.uid()
  )
  OR
  -- Allow business owners to see their invitations
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_invitations.business_id
    AND b.owner_user_id = auth.uid()
  )
);