
-- =============================================
-- LOOP POINTS SYSTEM OVERHAUL
-- =============================================

-- 1. Insert new Loop tiers (fresh IDs as requested)
INSERT INTO loop_tiers (id, name, price_monthly, points_cap_monthly, can_create_missions, can_sponsor_missions, features)
VALUES
  ('community', 'Community', 0, 1000, false, false, 
   ARRAY['Business listing', 'Basic Loop participation', '1,000 LP/month', 'Accept LP redemptions']),
  ('growth', 'Growth', 59, 7500, true, false, 
   ARRAY['Everything in Community', '7,500 LP/month', 'Citywide missions', 'Featured discovery', 'Referral rewards', 'Advanced analytics']),
  ('pro', 'Pro', 149, 25000, true, true, 
   ARRAY['Everything in Growth', '25,000 LP/month', 'Priority placement', 'Sponsored missions', 'Event integrations', 'Co-branding', 'Quarterly reports'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  points_cap_monthly = EXCLUDED.points_cap_monthly,
  can_create_missions = EXCLUDED.can_create_missions,
  can_sponsor_missions = EXCLUDED.can_sponsor_missions,
  features = EXCLUDED.features;

-- 2. Add Founding 50 + wallet freeze fields to business_loop_settings
ALTER TABLE business_loop_settings
  ADD COLUMN IF NOT EXISTS is_founding_50 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_50_start_date date,
  ADD COLUMN IF NOT EXISTS founding_50_expires_at date,
  ADD COLUMN IF NOT EXISTS wallet_frozen boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS wallet_frozen_reason text;

-- 3. Add wallet fields for expiration + fraud
ALTER TABLE loop_wallets
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_frozen boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_reason text;

-- 4. Add enhanced transaction logging fields
ALTER TABLE loop_transactions
  ADD COLUMN IF NOT EXISTS source_event text,
  ADD COLUMN IF NOT EXISTS device_id text,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS tx_status text DEFAULT 'completed';

-- 5. Cross-business redemption settings
CREATE TABLE IF NOT EXISTS public.loop_redemption_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  min_spend_cents integer NOT NULL DEFAULT 5000,
  lp_per_dollar integer NOT NULL DEFAULT 100,
  max_discount_percent integer NOT NULL DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

ALTER TABLE loop_redemption_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active redemption settings"
ON loop_redemption_settings FOR SELECT
USING (is_active = true);

CREATE POLICY "Business owners can manage their redemption settings"
ON loop_redemption_settings FOR ALL
USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));

CREATE POLICY "Admins can manage all redemption settings"
ON loop_redemption_settings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 6. Point batch tracking for expiration (90-day inactivity)
CREATE TABLE IF NOT EXISTS public.loop_point_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES loop_wallets(id) ON DELETE CASCADE,
  original_amount integer NOT NULL,
  remaining_amount integer NOT NULL,
  source_type text NOT NULL,
  source_business_id uuid REFERENCES businesses(id),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expired_at timestamptz,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE loop_point_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own point batches"
ON loop_point_batches FOR SELECT
USING (wallet_id IN (SELECT id FROM loop_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all batches"
ON loop_point_batches FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_point_batches_wallet ON loop_point_batches(wallet_id, status);
CREATE INDEX IF NOT EXISTS idx_point_batches_expiry ON loop_point_batches(expires_at) WHERE status = 'active';

-- 7. Supply tracking (monthly aggregates)
CREATE TABLE IF NOT EXISTS public.loop_supply_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL,
  total_issued integer DEFAULT 0,
  total_redeemed integer DEFAULT 0,
  total_expired integer DEFAULT 0,
  founding_5_issued integer DEFAULT 0,
  founding_50_issued integer DEFAULT 0,
  platform_pool_used integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(month_year)
);

ALTER TABLE loop_supply_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage supply tracking"
ON loop_supply_tracking FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 8. User daily earning caps
CREATE TABLE IF NOT EXISTS public.loop_daily_caps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cap_date date NOT NULL DEFAULT CURRENT_DATE,
  points_earned integer DEFAULT 0,
  referrals_today integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, cap_date)
);

ALTER TABLE loop_daily_caps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily caps"
ON loop_daily_caps FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all daily caps"
ON loop_daily_caps FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 9. Expiration warnings
CREATE TABLE IF NOT EXISTS public.loop_expiration_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES loop_wallets(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES loop_point_batches(id),
  warning_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  points_at_risk integer NOT NULL
);

ALTER TABLE loop_expiration_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warnings"
ON loop_expiration_warnings FOR SELECT
USING (wallet_id IN (SELECT id FROM loop_wallets WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage warnings"
ON loop_expiration_warnings FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- 10. Migrate existing businesses from old tiers to new tiers
UPDATE business_loop_settings SET loop_tier_id = 'community' WHERE loop_tier_id IN ('visible_only', 'loop_starter');
UPDATE business_loop_settings SET loop_tier_id = 'growth' WHERE loop_tier_id = 'loop_growth';
UPDATE business_loop_settings SET loop_tier_id = 'pro' WHERE loop_tier_id = 'loop_partner';

-- 11. Update Founding 5 businesses to 30K LP allocation
-- (Founding 5 get pro tier + founding member flag = 30K from code logic)

-- 12. Performance indexes
CREATE INDEX IF NOT EXISTS idx_loop_daily_caps_user_date ON loop_daily_caps(user_id, cap_date);
CREATE INDEX IF NOT EXISTS idx_loop_supply_month ON loop_supply_tracking(month_year);
CREATE INDEX IF NOT EXISTS idx_loop_tx_source ON loop_transactions(source_event) WHERE source_event IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loop_wallets_activity ON loop_wallets(last_activity_at) WHERE is_frozen = false;
