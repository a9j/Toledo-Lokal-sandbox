-- Citywide rewards campaigns / challenges (Downtown Week, Coffee Passport,
-- Support Local Saturday, Nonprofit Month, double-points events, etc.).

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;

CREATE TABLE IF NOT EXISTS public.city_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  emoji text,
  description text,
  campaign_type text NOT NULL DEFAULT 'challenge'
    CHECK (campaign_type IN ('challenge', 'seasonal', 'passport', 'double_points', 'spotlight')),
  point_multiplier numeric NOT NULL DEFAULT 1,
  starts_at date,
  ends_at date,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.city_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active campaigns" ON public.city_campaigns
  FOR SELECT USING (is_active = true OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage campaigns" ON public.city_campaigns
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_city_campaigns_active ON public.city_campaigns(is_active, starts_at DESC);
