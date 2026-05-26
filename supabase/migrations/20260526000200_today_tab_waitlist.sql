-- Email capture for the "Today" tab Coming Soon modal, shown until the
-- today_tab_enabled flag is on. Anyone can join; only admins can read.
CREATE TABLE IF NOT EXISTS public.today_waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  source     text NOT NULL DEFAULT 'today_tab',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.today_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.today_waitlist;
CREATE POLICY "Anyone can join the waitlist"
  ON public.today_waitlist
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage the waitlist" ON public.today_waitlist;
CREATE POLICY "Admins manage the waitlist"
  ON public.today_waitlist
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_today_waitlist_created
  ON public.today_waitlist (created_at DESC);
