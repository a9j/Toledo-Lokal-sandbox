-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true);

-- Allow authenticated users to upload to uploads bucket
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'uploads');

-- Allow public read access
CREATE POLICY "Public read access for uploads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'uploads');

-- Allow users to delete their own uploads (by path prefix)
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add hashtags column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}';

-- Add image_url to events and deals for featured images
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS image_url text;

-- Add editor_pick_image to businesses for curated admin images
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS editor_pick_image text;