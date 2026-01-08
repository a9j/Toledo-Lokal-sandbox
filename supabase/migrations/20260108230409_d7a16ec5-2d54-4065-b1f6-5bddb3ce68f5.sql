-- Remove the overly permissive policy that allows any authenticated user to view all profiles
-- Users can still view their own profile via "Users can view own profile" policy
-- Admins can still view all profiles via "Admins can view all profiles" policy

DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;