-- Remove email column from profiles table (already stored in auth.users)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;