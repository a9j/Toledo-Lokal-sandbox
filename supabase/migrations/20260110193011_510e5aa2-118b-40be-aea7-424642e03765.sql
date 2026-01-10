-- Add TikTok and Facebook social media links to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS tiktok text,
ADD COLUMN IF NOT EXISTS facebook text;