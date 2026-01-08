-- Add story/about field to businesses table for owner backstories
ALTER TABLE public.businesses
ADD COLUMN story text;