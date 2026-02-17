-- Add favorite_categories column to profiles
ALTER TABLE public.profiles
ADD COLUMN favorite_categories uuid[] DEFAULT '{}'::uuid[];

-- Add profile_completed flag to track if user finished setup
ALTER TABLE public.profiles
ADD COLUMN profile_completed boolean NOT NULL DEFAULT false;