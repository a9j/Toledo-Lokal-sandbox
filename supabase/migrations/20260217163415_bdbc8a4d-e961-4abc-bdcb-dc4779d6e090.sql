-- Add role_selected flag to profiles so we know if user has gone through role selection
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_selected boolean NOT NULL DEFAULT false;