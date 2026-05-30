-- =============================================================================
-- Phase 3 — Profile block engine
-- =============================================================================
-- A profile is one engine made of toggleable blocks. A "template" is just a
-- preset of which blocks are enabled and in what order. The profile page renders
-- enabled blocks in sort_order; each block_type maps to a React component.
--
-- This is additive: the existing category-driven profile rendering keeps working.
-- profile_blocks gives owners explicit control over which blocks appear and their
-- order, and is seeded from a preset during onboarding (category + one question).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profile_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  block_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (business_id, block_type)
);

CREATE INDEX IF NOT EXISTS profile_blocks_business_idx ON public.profile_blocks (business_id);

ALTER TABLE public.profile_blocks ENABLE ROW LEVEL SECURITY;

-- Owners + staff manage their own business's blocks.
DROP POLICY IF EXISTS "owners manage blocks" ON public.profile_blocks;
CREATE POLICY "owners manage blocks"
ON public.profile_blocks FOR ALL
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

-- Public reads enabled blocks for approved businesses (so residents see them).
DROP POLICY IF EXISTS "public read enabled blocks" ON public.profile_blocks;
CREATE POLICY "public read enabled blocks"
ON public.profile_blocks FOR SELECT
TO public
USING (
  enabled = true
  AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved')
);
