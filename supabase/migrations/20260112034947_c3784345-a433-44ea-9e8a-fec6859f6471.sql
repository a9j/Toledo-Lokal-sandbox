-- Add new columns for Pulse External Sharing
ALTER TABLE public.pulse_posts 
  ADD COLUMN IF NOT EXISTS pulse_id TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS preview_text TEXT,
  ADD COLUMN IF NOT EXISTS full_body TEXT,
  ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'user' CHECK (author_type IN ('user', 'business', 'admin')),
  ADD COLUMN IF NOT EXISTS business_tier TEXT DEFAULT 'free' CHECK (business_tier IN ('free', 'paid', 'admin_only')),
  ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS resharing_allowed BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS anonymous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS hero_image TEXT;

-- Add constraint for preview_text length
ALTER TABLE public.pulse_posts 
  ADD CONSTRAINT preview_text_max_length CHECK (char_length(preview_text) <= 160);

-- Create index for pulse_id lookups (for sharing URLs)
CREATE INDEX IF NOT EXISTS idx_pulse_posts_pulse_id ON public.pulse_posts(pulse_id);

-- Update existing posts to have generated pulse_id if null
UPDATE public.pulse_posts SET pulse_id = gen_random_uuid()::text WHERE pulse_id IS NULL;

-- RLS policy for public read access to active, share-enabled posts (for Open Graph)
CREATE POLICY "Anyone can view share-enabled active posts by pulse_id" 
ON public.pulse_posts 
FOR SELECT 
USING (
  status = 'active' 
  AND share_enabled = true 
  AND expires_at > now()
);