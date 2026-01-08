-- Make the uploads bucket private
UPDATE storage.buckets SET public = false WHERE id = 'uploads';

-- Add RLS policy for authenticated users to read files
-- Users can read their own files (files in their user folder)
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all uploaded files
CREATE POLICY "Admins can view all uploads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow authenticated users to view admin folder (public content like business photos)
CREATE POLICY "Authenticated users can view admin uploads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = 'admin'
);

-- Allow public read access for business content (approved businesses, events, deals)
-- This enables signed URLs to work for unauthenticated users viewing public content
CREATE POLICY "Public can view admin uploads via signed URLs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = 'admin'
);