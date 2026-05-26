-- Bug fix: pending businesses must not surface publicly anywhere, including
-- their locations. The old public read policy exposed any active location
-- regardless of whether its parent business was approved. Tighten it so the
-- public only sees active locations of approved businesses, and add explicit
-- owner/admin read policies so owners can still manage their own locations
-- (including pending or closed ones) from the dashboard.

DROP POLICY IF EXISTS "Anyone can view active locations" ON public.business_locations;

CREATE POLICY "Public can view active locations of approved businesses"
  ON public.business_locations
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_locations.business_id
        AND b.status = 'approved'
    )
  );

CREATE POLICY "Owners can view own locations"
  ON public.business_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = business_locations.business_id
        AND b.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all locations"
  ON public.business_locations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
