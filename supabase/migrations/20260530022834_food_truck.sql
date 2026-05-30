-- =============================================================================
-- Phase 4 — Food truck preset (schedule + follow)
-- =============================================================================
-- A food truck profile is built around a SCHEDULE, not a fixed address.
-- "Now at" and "Next stop" are derived views of this stops table.
--
-- truck_stops supersedes the older, empty food_truck_locations table for the
-- block-based food-truck profile: it uses proper timestamptz windows (so
-- "Now at" = the stop whose [starts_at, ends_at] contains now()), the four
-- statuses from the spec, and a per-stop checkin_code that the Loop Points
-- check-in earning path will use later.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.truck_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  location_name text NOT NULL,
  lat double precision,
  lng double precision,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','sold_out','private','closed')),
  -- Rotates per stop; ties to the Loop Points check-in earning path (engine
  -- connects later). Defaulted so every stop has a scannable code.
  checkin_code text NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS truck_stops_business_starts_idx
  ON public.truck_stops (business_id, starts_at);

ALTER TABLE public.truck_stops ENABLE ROW LEVEL SECURITY;

-- Residents see stops for approved businesses.
DROP POLICY IF EXISTS "public read stops for approved" ON public.truck_stops;
CREATE POLICY "public read stops for approved"
ON public.truck_stops FOR SELECT
TO public
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.status = 'approved'));

-- Owners + staff manage their own truck's stops.
DROP POLICY IF EXISTS "owners manage stops" ON public.truck_stops;
CREATE POLICY "owners manage stops"
ON public.truck_stops FOR ALL
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
    UNION SELECT business_id FROM public.business_staff WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
    UNION SELECT business_id FROM public.business_staff WHERE user_id = auth.uid()
  )
);


-- business_follows --------------------------------------------------------------
-- "Follow the Truck" (and any business). Notifying followers when a new stop /
-- live update posts is a follow-up: the app has no notification system yet, so
-- this migration establishes the follow graph the notifier will read from.
CREATE TABLE IF NOT EXISTS public.business_follows (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS business_follows_business_idx ON public.business_follows (business_id);

ALTER TABLE public.business_follows ENABLE ROW LEVEL SECURITY;

-- A user manages only their own follows.
DROP POLICY IF EXISTS "users manage own follows" ON public.business_follows;
CREATE POLICY "users manage own follows"
ON public.business_follows FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Owners + staff can read who follows their business (to notify them later).
DROP POLICY IF EXISTS "owners read followers" ON public.business_follows;
CREATE POLICY "owners read followers"
ON public.business_follows FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
    UNION SELECT business_id FROM public.business_staff WHERE user_id = auth.uid()
  )
);

-- Public follower count without exposing who follows (rows stay private).
CREATE OR REPLACE FUNCTION public.business_follower_count(_business_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int FROM public.business_follows WHERE business_id = _business_id;
$$;

GRANT EXECUTE ON FUNCTION public.business_follower_count(uuid) TO anon, authenticated;
