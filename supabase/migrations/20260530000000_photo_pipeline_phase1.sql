-- =============================================================================
-- Phase 1 — Photo upload fix + image pipeline groundwork
-- =============================================================================
-- Root cause of the reported upload failure:
--   AvatarUpload.tsx writes to a FIXED path ({user_id}/avatar.<ext>) with
--   upsert:true. The first write is an INSERT (allowed by "Authenticated users
--   can upload"), but REPLACING an existing avatar is an UPDATE on
--   storage.objects -- and the `uploads` bucket had no UPDATE policy. RLS
--   therefore rejected every avatar *replacement* with a 400. Confirmed in the
--   storage logs (200 on first POST, 400 on the second POST to the same path).
--
-- This migration:
--   1. Adds the missing owner-scoped UPDATE policy on `uploads` (the actual fix).
--   2. Creates the private `business-media` bucket with owner-scoped RLS.
--   3. Creates the `media_assets` table with RLS.
--
-- NOTE: the build spec's SQL assumed a `businesses.owner_id` column, but the
-- real column in this codebase is `owner_user_id`. All policies below use the
-- real column name.
-- =============================================================================


-- 1. THE FIX --------------------------------------------------------------------
-- Let an authenticated user UPDATE (overwrite via upsert) objects inside their
-- own top-level folder in the `uploads` bucket. Mirrors the existing
-- "Users can delete their own uploads" policy so avatar replacement works.
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- 2. business-media BUCKET ------------------------------------------------------
-- Private bucket organized by owner + purpose:
--   business-media/{business_id}/cover|logo|gallery/{uuid}.webp
--   business-media/{business_id}/original/{uuid}.{ext}
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-media',
  'business-media',
  false,
  26214400, -- 25MB hard cap (matches the 25MB intake limit in the spec)
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Owners (and business staff, matching this codebase's existing access model)
-- can fully manage objects inside their own business folder.
DROP POLICY IF EXISTS "owners manage own business-media" ON storage.objects;
CREATE POLICY "owners manage own business-media"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'business-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.businesses WHERE owner_user_id = auth.uid()
    UNION
    SELECT business_id::text FROM public.business_staff WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'business-media'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.businesses WHERE owner_user_id = auth.uid()
    UNION
    SELECT business_id::text FROM public.business_staff WHERE user_id = auth.uid()
  )
);

-- Public read of processed (non-original) media. The bucket is private, so this
-- gates which objects a signed/public read may return: everything except the
-- untouched originals kept under .../original/.
DROP POLICY IF EXISTS "public read processed business-media" ON storage.objects;
CREATE POLICY "public read processed business-media"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'business-media'
  AND (storage.foldername(name))[2] <> 'original'
);


-- 3. media_assets TABLE ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('cover','logo','interior','product','team','community','gallery')),
  original_path text NOT NULL,
  webp_path text NOT NULL,
  thumb_path text,
  width int NOT NULL,
  height int NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_assets_business_id_idx ON public.media_assets (business_id);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Owners + staff manage their own business's media rows.
DROP POLICY IF EXISTS "owners manage media rows" ON public.media_assets;
CREATE POLICY "owners manage media rows"
ON public.media_assets FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
    UNION
    SELECT business_id FROM public.business_staff WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
    UNION
    SELECT business_id FROM public.business_staff WHERE user_id = auth.uid()
  )
);

-- Public read of media rows (matches the spec; the storage layer still gates
-- the actual bytes).
DROP POLICY IF EXISTS "public read media rows" ON public.media_assets;
CREATE POLICY "public read media rows"
ON public.media_assets FOR SELECT
TO public
USING (true);
