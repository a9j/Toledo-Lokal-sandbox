
-- Create cause_category enum for nonprofits
CREATE TYPE public.cause_category AS ENUM (
  'food_insecurity',
  'housing',
  'youth',
  'health',
  'arts_culture',
  'education',
  'community_support',
  'environment',
  'animal_welfare',
  'veterans',
  'seniors',
  'disability_services'
);

-- Create community_support_type enum
CREATE TYPE public.community_support_type AS ENUM (
  'volunteers',
  'donations',
  'supplies',
  'events',
  'awareness'
);

-- Create nonprofits table (separate from businesses)
CREATE TABLE public.nonprofits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  cause_category public.cause_category NOT NULL,
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  mission_statement TEXT NOT NULL,
  what_this_helps TEXT,
  community_support_types public.community_support_type[] DEFAULT '{}',
  human_note TEXT,
  founding_community_partner BOOLEAN DEFAULT false,
  claimed BOOLEAN DEFAULT false,
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  
  -- Contact info
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'hidden')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create slug generation function for nonprofits
CREATE OR REPLACE FUNCTION public.generate_nonprofit_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM public.nonprofits WHERE slug = final_slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_nonprofit_slug
  BEFORE INSERT OR UPDATE ON public.nonprofits
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION public.generate_nonprofit_slug();

-- Enable RLS
ALTER TABLE public.nonprofits ENABLE ROW LEVEL SECURITY;

-- Public can view active nonprofits
CREATE POLICY "Nonprofits are publicly viewable"
  ON public.nonprofits FOR SELECT
  USING (status = 'active');

-- Claimed users can update their nonprofit
CREATE POLICY "Claimed users can update their nonprofit"
  ON public.nonprofits FOR UPDATE
  USING (auth.uid() = claimed_by);

-- Admins can do everything
CREATE POLICY "Admins have full access to nonprofits"
  ON public.nonprofits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated users to insert (for claiming flow)
CREATE POLICY "Authenticated users can insert nonprofits"
  ON public.nonprofits FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update timestamp trigger
CREATE TRIGGER update_nonprofits_updated_at
  BEFORE UPDATE ON public.nonprofits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add nonprofit_id to pulse_posts for nonprofit posting
ALTER TABLE public.pulse_posts 
ADD COLUMN nonprofit_id UUID REFERENCES public.nonprofits(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_nonprofits_cause_category ON public.nonprofits(cause_category);
CREATE INDEX idx_nonprofits_neighborhood ON public.nonprofits(neighborhood_id);
CREATE INDEX idx_nonprofits_founding_partner ON public.nonprofits(founding_community_partner) WHERE founding_community_partner = true;
CREATE INDEX idx_pulse_posts_nonprofit ON public.pulse_posts(nonprofit_id) WHERE nonprofit_id IS NOT NULL;
