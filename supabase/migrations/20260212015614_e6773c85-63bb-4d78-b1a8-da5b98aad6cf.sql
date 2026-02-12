
-- Add connector to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'connector';

-- Connectors table
CREATE TABLE public.connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  bio text,
  title text DEFAULT 'Founding Connector',
  social_links jsonb DEFAULT '{}',
  referral_code text UNIQUE,
  referral_slug text UNIQUE,
  is_founding boolean DEFAULT true,
  profile_views integer DEFAULT 0,
  follower_count integer DEFAULT 0,
  -- Future monetization prep
  tier text DEFAULT 'founding',
  revenue_share_rate numeric DEFAULT 0,
  total_earned numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

-- Connector referrals (businesses connected by this connector)
CREATE TABLE public.connector_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connector_id, business_id)
);

ALTER TABLE public.connector_referrals ENABLE ROW LEVEL SECURITY;

-- Connector followers
CREATE TABLE public.connector_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connector_id uuid NOT NULL REFERENCES public.connectors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connector_id, user_id)
);

ALTER TABLE public.connector_followers ENABLE ROW LEVEL SECURITY;

-- Add connector_id to events so connectors can create events
ALTER TABLE public.events ADD COLUMN connector_id uuid REFERENCES public.connectors(id);

-- Add referral tracking to businesses
ALTER TABLE public.businesses ADD COLUMN connected_by_connector_id uuid REFERENCES public.connectors(id);
ALTER TABLE public.businesses ADD COLUMN referral_source text;

-- Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_connector_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  code text;
BEGIN
  IF NEW.referral_code IS NULL THEN
    code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 8));
    NEW.referral_code := 'TL-' || code;
  END IF;
  
  IF NEW.referral_slug IS NULL THEN
    SELECT generate_collection_slug(
      (SELECT COALESCE(p.name, 'connector') FROM profiles p WHERE p.user_id = NEW.user_id)
    ) INTO NEW.referral_slug;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_connector_referral_code
  BEFORE INSERT ON public.connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_connector_referral_code();

-- Update follower count trigger
CREATE OR REPLACE FUNCTION public.update_connector_follower_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE connectors SET follower_count = follower_count + 1 WHERE id = NEW.connector_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE connectors SET follower_count = GREATEST(0, follower_count - 1) WHERE id = OLD.connector_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER update_connector_followers
  AFTER INSERT OR DELETE ON public.connector_followers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_connector_follower_count();

-- Updated at trigger for connectors
CREATE TRIGGER update_connectors_updated_at
  BEFORE UPDATE ON public.connectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Connectors table
CREATE POLICY "Anyone can view connector profiles"
  ON public.connectors FOR SELECT
  USING (true);

CREATE POLICY "Connectors can update own profile"
  ON public.connectors FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all connectors"
  ON public.connectors FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS: Connector referrals
CREATE POLICY "Anyone can view connector referrals"
  ON public.connector_referrals FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage referrals"
  ON public.connector_referrals FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Connectors can view own referrals"
  ON public.connector_referrals FOR SELECT
  USING (connector_id IN (SELECT id FROM connectors WHERE user_id = auth.uid()));

-- RLS: Connector followers
CREATE POLICY "Anyone can view followers"
  ON public.connector_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow connectors"
  ON public.connector_followers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unfollow connectors"
  ON public.connector_followers FOR DELETE
  USING (user_id = auth.uid());

-- Allow connectors to create events
CREATE POLICY "Connectors can manage own events"
  ON public.events FOR ALL
  USING (connector_id IN (SELECT id FROM connectors WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_connectors_user_id ON public.connectors(user_id);
CREATE INDEX idx_connectors_referral_code ON public.connectors(referral_code);
CREATE INDEX idx_connectors_referral_slug ON public.connectors(referral_slug);
CREATE INDEX idx_connector_referrals_connector ON public.connector_referrals(connector_id);
CREATE INDEX idx_connector_referrals_business ON public.connector_referrals(business_id);
CREATE INDEX idx_connector_followers_connector ON public.connector_followers(connector_id);
CREATE INDEX idx_events_connector_id ON public.events(connector_id);
CREATE INDEX idx_businesses_connected_by ON public.businesses(connected_by_connector_id);
