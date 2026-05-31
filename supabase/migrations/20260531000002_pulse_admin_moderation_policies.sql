-- Let admins/moderators moderate any Pulse post.
--
-- Previously public.pulse_posts had no DELETE policy and no moderator UPDATE
-- policy, so an admin "remove" silently affected 0 rows on posts the admin
-- didn't own. can_moderate() = admin / super_admin / city_admin / moderator.

DROP POLICY IF EXISTS "Moderators view all pulse posts" ON public.pulse_posts;
CREATE POLICY "Moderators view all pulse posts" ON public.pulse_posts
  FOR SELECT TO authenticated
  USING (public.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "Moderators update pulse posts" ON public.pulse_posts;
CREATE POLICY "Moderators update pulse posts" ON public.pulse_posts
  FOR UPDATE TO authenticated
  USING (public.can_moderate(auth.uid()))
  WITH CHECK (public.can_moderate(auth.uid()));

DROP POLICY IF EXISTS "Moderators delete pulse posts" ON public.pulse_posts;
CREATE POLICY "Moderators delete pulse posts" ON public.pulse_posts
  FOR DELETE TO authenticated
  USING (public.can_moderate(auth.uid()));
