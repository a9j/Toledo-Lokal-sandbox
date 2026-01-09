-- Add a restrictive policy requiring authentication for any access to profiles
-- This ensures unauthenticated users can never access profile data even if other policies are misconfigured

CREATE POLICY "Require authentication for profiles access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL);