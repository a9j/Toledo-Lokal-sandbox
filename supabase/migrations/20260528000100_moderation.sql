-- Moderation system: a report queue + an action/audit trail moderators work
-- through. Capability to moderate = admin / super_admin / city_admin / moderator.

CREATE OR REPLACE FUNCTION public.can_moderate(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin', 'city_admin', 'moderator')
  );
$$;

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL CHECK (target_type IN ('pulse_post', 'business', 'review', 'comment', 'photo', 'user', 'event')),
  target_id uuid,
  target_label text,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed', 'escalated')),
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  moderator_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('note', 'reviewing', 'resolve', 'dismiss', 'escalate', 'takedown', 'warn', 'shadow_ban')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can file a report; they can see the ones they filed.
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id);
CREATE POLICY "Reporters can view own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_user_id);

-- Moderators can see and work the whole queue.
CREATE POLICY "Moderators can view all reports" ON public.reports
  FOR SELECT TO authenticated USING (public.can_moderate(auth.uid()));
CREATE POLICY "Moderators can update reports" ON public.reports
  FOR UPDATE TO authenticated USING (public.can_moderate(auth.uid())) WITH CHECK (public.can_moderate(auth.uid()));

CREATE POLICY "Moderators can manage actions" ON public.moderation_actions
  FOR ALL TO authenticated USING (public.can_moderate(auth.uid())) WITH CHECK (public.can_moderate(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_reports_status_created ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_report ON public.moderation_actions(report_id, created_at);
