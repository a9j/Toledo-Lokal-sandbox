-- Create a public bucket for approved business assets
-- This allows direct access without signed URLs for better performance
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('public-assets', 'public-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from public-assets bucket
CREATE POLICY "Public assets are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-assets');

-- Allow business owners/staff to upload to public-assets
CREATE POLICY "Business owners can upload public assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'public-assets' 
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM public.businesses WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.business_staff WHERE user_id = auth.uid())
  )
);

-- Allow business owners/staff to update their uploads
CREATE POLICY "Business owners can update public assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'public-assets' 
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM public.businesses WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.business_staff WHERE user_id = auth.uid())
  )
);

-- Allow business owners/staff to delete their uploads  
CREATE POLICY "Business owners can delete public assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'public-assets' 
  AND auth.uid() IS NOT NULL
  AND (
    EXISTS (SELECT 1 FROM public.businesses WHERE owner_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.business_staff WHERE user_id = auth.uid())
  )
);