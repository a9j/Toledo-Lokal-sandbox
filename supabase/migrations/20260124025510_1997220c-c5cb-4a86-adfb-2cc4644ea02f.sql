-- Add a public read policy for business images in the uploads bucket
-- This allows direct access without signed URLs for approved business content
CREATE POLICY "Public read access for business images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads' 
  AND (
    -- Allow public access to business folder images
    name LIKE 'businesses/%'
    -- Also allow editor picks
    OR name LIKE 'editors-picks/%'
  )
);