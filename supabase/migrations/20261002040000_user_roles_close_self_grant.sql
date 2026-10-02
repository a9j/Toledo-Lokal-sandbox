-- Close privilege-escalation hole in public.user_roles.
--
-- The "Users can insert own roles" policy (20260602000000) let any
-- authenticated user grant THEMSELVES any role -- including 'admin',
-- 'super_admin', 'city_admin', and 'moderator' -- because its WITH CHECK only
-- verified auth.uid() = user_id, not which role was being inserted. Both the
-- app's client-side role gating (AuthContext.hasRole) and the admin edge
-- functions (e.g. admin-delete-user) trust this table, so a self-granted
-- admin could reach every admin screen and call admin-only functions.
--
-- This replaces it with a whitelist: users may only grant themselves the
-- non-privileged, self-service roles used by the signup flows ('resident' via
-- the on-signup trigger, 'business' on business creation, 'nonprofit' and
-- 'partner' on their signup pages, plus 'organizer' and 'connector').
-- Privileged roles remain grantable only through the "Admins can manage
-- roles" policy (admin console) or server-side code using the service role.

DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;

CREATE POLICY "Users can insert own non-privileged roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND role IN ('resident', 'business', 'organizer', 'nonprofit', 'partner', 'connector')
  );
