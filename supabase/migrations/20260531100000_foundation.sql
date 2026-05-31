-- =============================================================================
-- PR 1 — Foundation
-- =============================================================================
-- Creates the backbone tables for the admin panel, analytics spine, passport,
-- announcements, impact tracking, and billing. Adds a plan flag to businesses.
-- Expands the category list from 9 to 15. Establishes business_admins as the
-- authoritative access-control table with RLS on all business-scoped tables.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. business_admins — authoritative access control
-- ---------------------------------------------------------------------------
CREATE TYPE public.business_admin_role AS ENUM (
  'owner',
  'manager',
  'marketing',
  'event_manager',
  'hiring_manager',
  'viewer'
);

CREATE TABLE IF NOT EXISTS public.business_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role public.business_admin_role NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

CREATE INDEX idx_business_admins_user ON public.business_admins(user_id);
CREATE INDEX idx_business_admins_business ON public.business_admins(business_id);

ALTER TABLE public.business_admins ENABLE ROW LEVEL SECURITY;

-- Helper: check if caller is an admin for a business (owner or staff).
CREATE OR REPLACE FUNCTION public.is_business_admin(check_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses WHERE id = check_business_id AND owner_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.business_admins WHERE business_id = check_business_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.business_staff WHERE business_id = check_business_id AND user_id = auth.uid()
  )
$$;

-- Helper: check if caller has a specific admin role (or higher).
CREATE OR REPLACE FUNCTION public.has_business_permission(
  check_business_id uuid,
  required_role public.business_admin_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_owner boolean;
  caller_role public.business_admin_role;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.businesses WHERE id = check_business_id AND owner_user_id = auth.uid()
  ) INTO caller_is_owner;

  IF caller_is_owner THEN RETURN true; END IF;

  SELECT role INTO caller_role
  FROM public.business_admins
  WHERE business_id = check_business_id AND user_id = auth.uid();

  IF caller_role IS NULL THEN RETURN false; END IF;

  -- Owner > Manager > everything else > Viewer
  IF caller_role = 'owner' THEN RETURN true; END IF;
  IF caller_role = 'manager' THEN RETURN required_role != 'owner'; END IF;
  IF required_role = 'viewer' THEN RETURN true; END IF;
  RETURN caller_role = required_role;
END;
$$;

-- RLS for business_admins
CREATE POLICY "admins read own business team"
ON public.business_admins FOR SELECT
TO authenticated
USING (public.is_business_admin(business_id));

CREATE POLICY "owners manage business admins"
ON public.business_admins FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);


-- ---------------------------------------------------------------------------
-- 2. analytics_events — the single event spine
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_events_business ON public.analytics_events(business_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_entity ON public.analytics_events(entity_type, entity_id);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous profile views, etc.).
CREATE POLICY "anyone can record events"
ON public.analytics_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- Business admins can read their own events.
CREATE POLICY "admins read own business events"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.is_business_admin(business_id));

-- Platform admins can read all events.
CREATE POLICY "platform admins read all events"
ON public.analytics_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- ---------------------------------------------------------------------------
-- 3. Plan flag on businesses
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN plan text NOT NULL DEFAULT 'basic';
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 4. passport_stamps — business stamp configuration
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passport_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Visit',
  description text,
  reward_description text,
  visits_required int NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id)
);

ALTER TABLE public.passport_stamps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active stamps"
ON public.passport_stamps FOR SELECT
TO public
USING (is_active);

CREATE POLICY "admins manage own stamps"
ON public.passport_stamps FOR ALL
TO authenticated
USING (public.is_business_admin(business_id))
WITH CHECK (public.is_business_admin(business_id));


-- ---------------------------------------------------------------------------
-- 5. passport_checkins — user check-in records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passport_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stamp_id uuid REFERENCES public.passport_stamps(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_passport_checkins_user ON public.passport_checkins(user_id);
CREATE INDEX idx_passport_checkins_business ON public.passport_checkins(business_id);
CREATE INDEX idx_passport_checkins_stamp ON public.passport_checkins(stamp_id);

ALTER TABLE public.passport_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own checkins"
ON public.passport_checkins FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users create own checkins"
ON public.passport_checkins FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins read business checkins"
ON public.passport_checkins FOR SELECT
TO authenticated
USING (public.is_business_admin(business_id));


-- ---------------------------------------------------------------------------
-- 6. announcements — follower announcements
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  link_url text,
  link_label text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_business ON public.announcements(business_id);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (public.is_business_admin(business_id))
WITH CHECK (public.is_business_admin(business_id));

CREATE POLICY "followers read sent announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (
  sent_at IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.business_follows bf
    WHERE bf.business_id = announcements.business_id AND bf.user_id = auth.uid()
  )
);


-- ---------------------------------------------------------------------------
-- 7. impact_metrics — nonprofit / mission-driven tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.impact_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  label text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  unit text,
  period_start date,
  period_end date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_impact_metrics_business ON public.impact_metrics(business_id);

ALTER TABLE public.impact_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read impact metrics"
ON public.impact_metrics FOR SELECT
TO public
USING (true);

CREATE POLICY "admins manage impact metrics"
ON public.impact_metrics FOR ALL
TO authenticated
USING (public.is_business_admin(business_id))
WITH CHECK (public.is_business_admin(business_id));


-- ---------------------------------------------------------------------------
-- 8. billing_plans — plan definitions (Stripe wired later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents int NOT NULL DEFAULT 0,
  interval text NOT NULL DEFAULT 'month',
  features jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read active plans"
ON public.billing_plans FOR SELECT
TO public
USING (is_active);

CREATE POLICY "platform admins manage plans"
ON public.billing_plans FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default plans
INSERT INTO public.billing_plans (slug, name, description, price_cents, sort_order, features) VALUES
  ('basic', 'Basic Listing', 'Free listing with essential profile', 0, 1, '{"profile": true, "pulse": false, "events": false, "deals": false, "passport": false, "jobs": false, "analytics": false, "follower_announcements": 0, "featured_placement": false}'),
  ('enhanced', 'Enhanced', 'Full profile with Pulse and events', 2900, 2, '{"profile": true, "pulse": true, "events": true, "deals": true, "passport": false, "jobs": true, "analytics": "basic", "follower_announcements": 4, "featured_placement": false}'),
  ('pro', 'Pro', 'Everything including Passport and advanced analytics', 7900, 3, '{"profile": true, "pulse": true, "events": true, "deals": true, "passport": true, "jobs": true, "analytics": "full", "follower_announcements": 12, "featured_placement": true}')
ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 9. Expand categories from 9 to 15
-- ---------------------------------------------------------------------------
INSERT INTO public.categories (name, icon, sort_order, active, slug) VALUES
  ('Professional Services', 'briefcase', 10, true, 'professional-services'),
  ('Family & Kids', 'baby', 11, true, 'family-kids'),
  ('Outdoors & Recreation', 'mountain', 12, true, 'outdoors-recreation'),
  ('Education & Classes', 'graduation-cap', 13, true, 'education-classes'),
  ('Jobs & Opportunities', 'briefcase', 14, true, 'jobs-opportunities'),
  ('Local Services', 'wrench', 15, true, 'local-services')
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- 10. deal_redemptions — track deal usage
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deal_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, user_id)
);

CREATE INDEX idx_deal_redemptions_deal ON public.deal_redemptions(deal_id);
CREATE INDEX idx_deal_redemptions_user ON public.deal_redemptions(user_id);
CREATE INDEX idx_deal_redemptions_business ON public.deal_redemptions(business_id);

ALTER TABLE public.deal_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own redemptions"
ON public.deal_redemptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "users redeem deals"
ON public.deal_redemptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins read business redemptions"
ON public.deal_redemptions FOR SELECT
TO authenticated
USING (public.is_business_admin(business_id));


-- ---------------------------------------------------------------------------
-- 11. Add missing columns to existing tables for later PRs
-- ---------------------------------------------------------------------------

-- deals: add redemption tracking columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'deal_type') THEN
    ALTER TABLE public.deals ADD COLUMN deal_type text NOT NULL DEFAULT 'coupon';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'redemption_limit') THEN
    ALTER TABLE public.deals ADD COLUMN redemption_limit int;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deals' AND column_name = 'terms') THEN
    ALTER TABLE public.deals ADD COLUMN terms text;
  END IF;
END $$;

-- events: add richer event data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'event_type') THEN
    ALTER TABLE public.events ADD COLUMN event_type text NOT NULL DEFAULT 'event';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'capacity') THEN
    ALTER TABLE public.events ADD COLUMN capacity int;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'price_cents') THEN
    ALTER TABLE public.events ADD COLUMN price_cents int;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_free') THEN
    ALTER TABLE public.events ADD COLUMN is_free boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- jobs: add missing fields from spec
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'requirements') THEN
    ALTER TABLE public.jobs ADD COLUMN requirements text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'location_text') THEN
    ALTER TABLE public.jobs ADD COLUMN location_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'deadline') THEN
    ALTER TABLE public.jobs ADD COLUMN deadline date;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 12. Record analytics helper (server-side via RPC)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_analytics_event(
  p_event_type text,
  p_business_id uuid,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.analytics_events (event_type, business_id, user_id, entity_type, entity_id, metadata)
  VALUES (p_event_type, p_business_id, auth.uid(), p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
