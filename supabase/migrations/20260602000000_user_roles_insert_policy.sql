-- Allow authenticated users to insert their own roles.
-- Without this, business creation fails when it tries to add the 'business' role.
CREATE POLICY "Users can insert own roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
