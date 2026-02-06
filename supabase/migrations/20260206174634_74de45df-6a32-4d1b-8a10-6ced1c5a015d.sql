-- Add columns to saved_items for notes and ordering
ALTER TABLE saved_items 
ADD COLUMN IF NOT EXISTS note text,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Create user_collection_settings table for public sharing
CREATE TABLE IF NOT EXISTS public.user_collection_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_public boolean DEFAULT false,
  public_slug text UNIQUE,
  collection_name text DEFAULT 'My Toledo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_collection_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_collection_settings
CREATE POLICY "Users can manage own collection settings"
ON public.user_collection_settings
FOR ALL
USING (user_id = auth.uid());

CREATE POLICY "Anyone can view public collections"
ON public.user_collection_settings
FOR SELECT
USING (is_public = true);

-- Function to generate unique public slug
CREATE OR REPLACE FUNCTION public.generate_collection_slug(user_name text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(user_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug || '-toledo';
  
  WHILE EXISTS (SELECT 1 FROM user_collection_settings WHERE public_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-toledo-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Index for faster public collection lookups
CREATE INDEX IF NOT EXISTS idx_user_collection_public_slug 
ON user_collection_settings(public_slug) WHERE is_public = true;

-- Index for saved items ordering
CREATE INDEX IF NOT EXISTS idx_saved_items_user_order 
ON saved_items(user_id, sort_order);