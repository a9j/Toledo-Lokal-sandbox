-- =============================================================================
-- Phase 2 — Category system
-- =============================================================================
-- A *category* is how a resident browses (distinct from a profile template).
-- This migration upgrades the existing `categories` table into a managed,
-- sortable, toggleable set, reconciles the launch list, and adds a
-- `business_categories` junction so a business can have one primary category
-- plus optional secondary tags (appearing in more than one browse bucket).
--
-- Notes for reviewers:
--   * The existing table already uses `name` (not the spec's `label`); we keep
--     `name` to avoid breaking the live grid, and add the missing columns.
--   * The DB currently has 0 businesses, so reconciling the category list is
--     data-safe.
--   * Launch list follows the spec's stated lean (9 categories, grid wraps
--     responsively): Auto, Beauty, Events, Food & Drink, Health & Wellness,
--     Home & Services, Shopping, Arts & Nightlife, Nonprofits & Community.
--     "Local Pros" is retired (redundant / overlaps Home & Services).
-- =============================================================================


-- 1. Managed-table columns ------------------------------------------------------
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;


-- 2. Reconcile the launch list (rename in place; keep stable ids) ---------------
UPDATE public.categories SET name = 'Events',             icon = 'calendar'        WHERE name = 'Events & Venues';
UPDATE public.categories SET name = 'Health & Wellness',  icon = 'heart-pulse'     WHERE name = 'Health & Fitness';
UPDATE public.categories SET name = 'Home & Services',    icon = 'home'            WHERE name = 'Home Services';

-- Retire the redundant "Local Pros" bucket (overlaps Home & Services).
UPDATE public.categories SET active = false, sort_order = 99 WHERE name = 'Local Pros';

-- Add the two mission-critical gaps if they don't already exist.
INSERT INTO public.categories (name, icon)
SELECT 'Arts & Nightlife', 'palette'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Arts & Nightlife');

INSERT INTO public.categories (name, icon)
SELECT 'Nonprofits & Community', 'heart-handshake'
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Nonprofits & Community');


-- 3. Browse order (residents see them in this order) ---------------------------
UPDATE public.categories SET sort_order = 1 WHERE name = 'Food & Drink';
UPDATE public.categories SET sort_order = 2 WHERE name = 'Shopping';
UPDATE public.categories SET sort_order = 3 WHERE name = 'Health & Wellness';
UPDATE public.categories SET sort_order = 4 WHERE name = 'Beauty';
UPDATE public.categories SET sort_order = 5 WHERE name = 'Home & Services';
UPDATE public.categories SET sort_order = 6 WHERE name = 'Auto';
UPDATE public.categories SET sort_order = 7 WHERE name = 'Arts & Nightlife';
UPDATE public.categories SET sort_order = 8 WHERE name = 'Events';
UPDATE public.categories SET sort_order = 9 WHERE name = 'Nonprofits & Community';


-- 4. Slugs (stable, url-friendly handles) --------------------------------------
UPDATE public.categories
SET slug = regexp_replace(regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g')
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_key ON public.categories (slug);


-- 5. business_categories junction ----------------------------------------------
-- One primary category + optional secondary tags. is_primary is informational;
-- a business's primary browse category still lives on businesses.category_id for
-- back-compat, and this table adds the extra buckets it should appear in.
CREATE TABLE IF NOT EXISTS public.business_categories (
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (business_id, category_id)
);

-- At most one primary per business.
CREATE UNIQUE INDEX IF NOT EXISTS business_categories_one_primary
  ON public.business_categories (business_id) WHERE is_primary;

CREATE INDEX IF NOT EXISTS business_categories_category_idx
  ON public.business_categories (category_id);

ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;

-- Public can read tags for approved businesses (so browse works for everyone).
DROP POLICY IF EXISTS "public read approved business categories" ON public.business_categories;
CREATE POLICY "public read approved business categories"
ON public.business_categories FOR SELECT
TO public
USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved')
);

-- Owners + staff manage their own business's tags.
DROP POLICY IF EXISTS "owners manage business categories" ON public.business_categories;
CREATE POLICY "owners manage business categories"
ON public.business_categories FOR ALL
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
