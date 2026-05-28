-- Let platform admins (admin / super_admin / city_admin) see who manages each
-- business, for the console's Business Admins directory. Additive to the
-- existing owner/self SELECT policies.
CREATE POLICY "Platform admins can view all staff" ON public.business_staff
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'city_admin')
    )
  );
