-- Circles Phase 1: RLS helper functions and policies
-- Enforces: members see only their Circles, admin has full access

-- 1. Helper: is the current user a member of a given circle?
CREATE OR REPLACE FUNCTION public.is_circle_member(cid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = cid AND user_id = auth.uid()
  );
$$;

-- 2. Helper: is the current user a global admin?
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT is_admin FROM profiles WHERE user_id = auth.uid()),
    false
  );
$$;

-- 3. Enable RLS on all circles tables
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_posts ENABLE ROW LEVEL SECURITY;

-- 4. Policies: circles
CREATE POLICY "circles_select_member_or_admin"
  ON public.circles FOR SELECT
  USING (is_circle_member(id) OR is_global_admin());

CREATE POLICY "circles_insert_admin"
  ON public.circles FOR INSERT
  WITH CHECK (is_global_admin());

CREATE POLICY "circles_update_admin"
  ON public.circles FOR UPDATE
  USING (is_global_admin());

CREATE POLICY "circles_delete_admin"
  ON public.circles FOR DELETE
  USING (is_global_admin());

-- 5. Policies: circle_members
CREATE POLICY "circle_members_select_member_or_admin"
  ON public.circle_members FOR SELECT
  USING (is_circle_member(circle_id) OR is_global_admin());

CREATE POLICY "circle_members_insert_admin"
  ON public.circle_members FOR INSERT
  WITH CHECK (is_global_admin());

CREATE POLICY "circle_members_update_admin"
  ON public.circle_members FOR UPDATE
  USING (is_global_admin());

CREATE POLICY "circle_members_delete_admin"
  ON public.circle_members FOR DELETE
  USING (is_global_admin());

-- 6. Policies: circle_invites
CREATE POLICY "circle_invites_select_own_or_admin"
  ON public.circle_invites FOR SELECT
  USING (invited_by = auth.uid() OR is_global_admin());

CREATE POLICY "circle_invites_insert_admin"
  ON public.circle_invites FOR INSERT
  WITH CHECK (is_global_admin());

CREATE POLICY "circle_invites_update_admin"
  ON public.circle_invites FOR UPDATE
  USING (is_global_admin());

CREATE POLICY "circle_invites_delete_admin"
  ON public.circle_invites FOR DELETE
  USING (is_global_admin());

-- 7. Policies: circle_posts
CREATE POLICY "circle_posts_select_member_or_admin"
  ON public.circle_posts FOR SELECT
  USING (is_circle_member(circle_id) OR is_global_admin());

CREATE POLICY "circle_posts_insert_member"
  ON public.circle_posts FOR INSERT
  WITH CHECK (
    is_circle_member(circle_id)
    AND author_id = auth.uid()
  );

CREATE POLICY "circle_posts_update_author_or_admin"
  ON public.circle_posts FOR UPDATE
  USING (author_id = auth.uid() OR is_global_admin());

CREATE POLICY "circle_posts_delete_author_or_admin"
  ON public.circle_posts FOR DELETE
  USING (author_id = auth.uid() OR is_global_admin());
