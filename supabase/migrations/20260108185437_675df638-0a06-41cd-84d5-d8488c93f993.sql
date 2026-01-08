-- Add 'partner' to the app_role enum (nonprofit already exists)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';