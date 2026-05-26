-- Multi-location: enforce the one-primary invariant at the database layer and
-- add the columns the spec calls for. Builds on the existing business_locations
-- table (20260314011617) and the uniq_primary_location_per_business partial
-- unique index (20260526000000).

-- 1. Spec columns that were missing.
ALTER TABLE public.business_locations
  ADD COLUMN IF NOT EXISTS notes      text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Keep updated_at fresh on every change (function defined in an earlier migration).
DROP TRIGGER IF EXISTS set_business_locations_updated_at ON public.business_locations;
CREATE TRIGGER set_business_locations_updated_at
  BEFORE UPDATE ON public.business_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Guarantee every brand with locations has exactly one primary.
--    The partial unique index already prevents *two* primaries; this fills the
--    gap where a brand ends up with *zero* primaries (first location added, or
--    the primary deleted) by promoting the oldest active location.
--    Attached to INSERT/DELETE only (not UPDATE) so the internal promotion
--    UPDATE doesn't re-fire the trigger.
CREATE OR REPLACE FUNCTION public.ensure_business_has_primary_location()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  bid uuid := COALESCE(NEW.business_id, OLD.business_id);
BEGIN
  IF EXISTS (SELECT 1 FROM public.business_locations WHERE business_id = bid)
     AND NOT EXISTS (
       SELECT 1 FROM public.business_locations WHERE business_id = bid AND is_primary
     ) THEN
    UPDATE public.business_locations
    SET is_primary = true
    WHERE id = (
      SELECT id FROM public.business_locations
      WHERE business_id = bid
      ORDER BY is_active DESC, created_at ASC, id ASC
      LIMIT 1
    );
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS ensure_primary_after_insert ON public.business_locations;
CREATE TRIGGER ensure_primary_after_insert
  AFTER INSERT ON public.business_locations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_business_has_primary_location();

DROP TRIGGER IF EXISTS ensure_primary_after_delete ON public.business_locations;
CREATE TRIGGER ensure_primary_after_delete
  AFTER DELETE ON public.business_locations
  FOR EACH ROW EXECUTE FUNCTION public.ensure_business_has_primary_location();

-- 3. Backfill any existing brand that somehow has no primary.
UPDATE public.business_locations bl
SET is_primary = true
WHERE bl.id = (
  SELECT id FROM public.business_locations inner_bl
  WHERE inner_bl.business_id = bl.business_id
  ORDER BY is_active DESC, created_at ASC, id ASC
  LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.business_locations p
  WHERE p.business_id = bl.business_id AND p.is_primary
);
