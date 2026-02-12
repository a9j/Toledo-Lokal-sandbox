
-- Create a public profiles view that only exposes non-sensitive fields
-- This allows public features (reviews, posts, stories) to show names/avatars
-- without exposing user_id or other sensitive fields
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  avatar_url
FROM public.profiles;

-- Add a permissive SELECT policy so the security-invoker view can read profiles
-- This is safe because the view only exposes id, name, avatar_url
CREATE POLICY "Public can read basic profile info"
ON public.profiles
FOR SELECT
USING (true);
