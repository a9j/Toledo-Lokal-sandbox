-- ============================================
-- LOOP LOKAL COMPLETE DATABASE SCHEMA
-- ============================================

-- 1. LOOP TIERS - Business subscription tiers for Loop participation
CREATE TABLE public.loop_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  stripe_price_id text,
  points_cap_monthly integer NOT NULL DEFAULT 0,
  features text[] DEFAULT '{}',
  can_create_missions boolean DEFAULT false,
  can_sponsor_missions boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default Loop tiers
INSERT INTO public.loop_tiers (id, name, price_monthly, points_cap_monthly, features, can_create_missions, can_sponsor_missions) VALUES
  ('visible_only', 'Loop-Visible Only', 0, 0, ARRAY['Business listing', 'Events and description', 'Contact info', 'No points issued', 'No points accepted'], false, false),
  ('loop_starter', 'Loop Starter', 29, 500, ARRAY['Universal Loop participation', 'Business profile', 'QR code issuance', 'Issue Loop Points', 'Accept redemptions', 'Basic reward setup', 'Basic analytics'], false, false),
  ('loop_growth', 'Loop Growth', 79, 2000, ARRAY['Everything in Starter', 'Higher point caps', 'Citywide missions', 'Featured discovery', 'Referral rewards', 'Experience rewards', 'Advanced analytics'], true, false),
  ('loop_partner', 'Loop Partner', 149, 5000, ARRAY['Everything in Growth', 'Priority placement', 'Sponsored missions', 'Event integrations', 'Co-branding', 'Quarterly reports'], true, true);

-- Enable RLS
ALTER TABLE public.loop_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view loop tiers" ON public.loop_tiers FOR SELECT USING (true);

-- 2. BUSINESS LOOP SETTINGS - Tracks business participation in Loop
CREATE TABLE public.business_loop_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  loop_tier_id text NOT NULL DEFAULT 'visible_only' REFERENCES public.loop_tiers(id),
  is_active boolean DEFAULT false,
  points_issued_this_month integer DEFAULT 0,
  month_reset_at date DEFAULT CURRENT_DATE,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'inactive',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

-- Enable RLS
ALTER TABLE public.business_loop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Business owners can manage their loop settings" ON public.business_loop_settings 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Anyone can view active loop participants" ON public.business_loop_settings 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage all loop settings" ON public.business_loop_settings 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 3. LOOP WALLETS - User wallets for Loop points
CREATE TABLE public.loop_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city text NOT NULL DEFAULT 'toledo',
  points_balance integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  lifetime_redeemed integer NOT NULL DEFAULT 0,
  lifetime_donated integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, city)
);

-- Enable RLS
ALTER TABLE public.loop_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own wallet" ON public.loop_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.loop_wallets FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 4. LOOP TRANSACTIONS - All point transactions
CREATE TYPE loop_transaction_type AS ENUM ('earn', 'redeem', 'donate', 'bonus', 'refund', 'expire');

CREATE TABLE public.loop_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.loop_wallets(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id),
  transaction_type loop_transaction_type NOT NULL,
  points integer NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  qr_code_id uuid,
  mission_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loop_transactions_wallet ON public.loop_transactions(wallet_id);
CREATE INDEX idx_loop_transactions_business ON public.loop_transactions(business_id);
CREATE INDEX idx_loop_transactions_created ON public.loop_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.loop_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own transactions" ON public.loop_transactions 
  FOR SELECT USING (wallet_id IN (SELECT id FROM loop_wallets WHERE user_id = auth.uid()));
CREATE POLICY "Business owners can view their transactions" ON public.loop_transactions 
  FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Admins can view all transactions" ON public.loop_transactions 
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- 5. LOOP REWARDS - Reward templates for businesses
CREATE TYPE loop_reward_category AS ENUM ('perk', 'experience', 'service_credit');

CREATE TABLE public.loop_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category loop_reward_category NOT NULL DEFAULT 'perk',
  points_cost integer NOT NULL,
  quantity_available integer,
  quantity_redeemed integer DEFAULT 0,
  is_active boolean DEFAULT true,
  daily_limit integer,
  monthly_limit integer,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loop_rewards_business ON public.loop_rewards(business_id);
CREATE INDEX idx_loop_rewards_active ON public.loop_rewards(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.loop_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active rewards" ON public.loop_rewards 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Business owners can manage their rewards" ON public.loop_rewards 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Admins can manage all rewards" ON public.loop_rewards 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 6. LOOP REDEMPTIONS - Track reward redemptions
CREATE TABLE public.loop_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL REFERENCES public.loop_rewards(id),
  transaction_id uuid NOT NULL REFERENCES public.loop_transactions(id),
  redemption_code text NOT NULL,
  status text DEFAULT 'pending',
  confirmed_at timestamptz,
  confirmed_by_staff text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loop_redemptions_user ON public.loop_redemptions(user_id);
CREATE INDEX idx_loop_redemptions_code ON public.loop_redemptions(redemption_code);

-- Enable RLS
ALTER TABLE public.loop_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own redemptions" ON public.loop_redemptions 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Business owners can view/confirm their redemptions" ON public.loop_redemptions 
  FOR ALL USING (reward_id IN (SELECT id FROM loop_rewards WHERE business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid())));
CREATE POLICY "Admins can manage all redemptions" ON public.loop_redemptions 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 7. LOOP QR CODES - QR codes for point issuance
CREATE TYPE loop_qr_type AS ENUM ('visit', 'job_complete', 'referral', 'event', 'campaign');

CREATE TABLE public.loop_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  qr_type loop_qr_type NOT NULL DEFAULT 'visit',
  name text NOT NULL,
  points_value integer NOT NULL,
  is_single_use boolean DEFAULT false,
  requires_staff_confirm boolean DEFAULT true,
  max_scans_per_user integer DEFAULT 1,
  scan_cooldown_hours integer DEFAULT 24,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  total_scans integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loop_qr_codes_business ON public.loop_qr_codes(business_id);

-- Enable RLS
ALTER TABLE public.loop_qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active QR codes" ON public.loop_qr_codes 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Business owners can manage their QR codes" ON public.loop_qr_codes 
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Admins can manage all QR codes" ON public.loop_qr_codes 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 8. LOOP QR SCANS - Track QR code scans
CREATE TABLE public.loop_qr_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid NOT NULL REFERENCES public.loop_qr_codes(id),
  user_id uuid NOT NULL,
  transaction_id uuid REFERENCES public.loop_transactions(id),
  status text DEFAULT 'pending',
  staff_confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loop_qr_scans_qr ON public.loop_qr_scans(qr_code_id);
CREATE INDEX idx_loop_qr_scans_user ON public.loop_qr_scans(user_id);

-- Enable RLS
ALTER TABLE public.loop_qr_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own scans" ON public.loop_qr_scans 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Business owners can view/manage scans for their QR codes" ON public.loop_qr_scans 
  FOR ALL USING (qr_code_id IN (SELECT id FROM loop_qr_codes WHERE business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid())));
CREATE POLICY "Admins can manage all scans" ON public.loop_qr_scans 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 9. LOOP MISSIONS - Admin-created citywide missions
CREATE TYPE loop_mission_type AS ENUM ('visits', 'category', 'neighborhood', 'mwbe', 'tourism', 'event', 'donation');

CREATE TABLE public.loop_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  mission_type loop_mission_type NOT NULL,
  required_count integer NOT NULL DEFAULT 3,
  points_reward integer NOT NULL DEFAULT 100,
  badge_icon text,
  badge_color text DEFAULT '#5C8A6E',
  target_category_id uuid REFERENCES public.categories(id),
  target_neighborhood_id uuid REFERENCES public.neighborhoods(id),
  target_businesses uuid[] DEFAULT '{}',
  sponsor_business_id uuid REFERENCES public.businesses(id),
  is_featured boolean DEFAULT false,
  max_participants integer,
  current_participants integer DEFAULT 0,
  start_date date,
  end_date date,
  status text DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loop_missions_status ON public.loop_missions(status) WHERE status = 'active';

-- Enable RLS
ALTER TABLE public.loop_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active missions" ON public.loop_missions 
  FOR SELECT USING (status = 'active');
CREATE POLICY "Admins can manage all missions" ON public.loop_missions 
  FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Sponsors can view their missions" ON public.loop_missions 
  FOR SELECT USING (sponsor_business_id IN (SELECT id FROM businesses WHERE owner_user_id = auth.uid()));

-- 10. LOOP MISSION PROGRESS - User progress on missions
CREATE TABLE public.loop_mission_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.loop_missions(id) ON DELETE CASCADE,
  progress_count integer DEFAULT 0,
  completed_at timestamptz,
  reward_claimed_at timestamptz,
  businesses_visited uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

CREATE INDEX idx_loop_mission_progress_user ON public.loop_mission_progress(user_id);
CREATE INDEX idx_loop_mission_progress_mission ON public.loop_mission_progress(mission_id);

-- Enable RLS
ALTER TABLE public.loop_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own progress" ON public.loop_mission_progress 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can track their own progress" ON public.loop_mission_progress 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.loop_mission_progress 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.loop_mission_progress 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 11. LOOP BADGES - Earned badges from completed missions
CREATE TABLE public.loop_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_id uuid NOT NULL REFERENCES public.loop_missions(id),
  badge_name text NOT NULL,
  badge_icon text,
  badge_color text,
  earned_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loop_badges_user ON public.loop_badges(user_id);

-- Enable RLS
ALTER TABLE public.loop_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own badges" ON public.loop_badges 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view public badge counts" ON public.loop_badges 
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON public.loop_badges 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 12. LOOP CAUSES - Approved donation causes
CREATE TABLE public.loop_causes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organization_name text,
  logo_url text,
  points_donated integer DEFAULT 0,
  is_active boolean DEFAULT true,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loop_causes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active causes" ON public.loop_causes 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage causes" ON public.loop_causes 
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 13. LOOP DONATIONS - Track point donations
CREATE TABLE public.loop_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  cause_id uuid NOT NULL REFERENCES public.loop_causes(id),
  transaction_id uuid NOT NULL REFERENCES public.loop_transactions(id),
  points_amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loop_donations_user ON public.loop_donations(user_id);
CREATE INDEX idx_loop_donations_cause ON public.loop_donations(cause_id);

-- Enable RLS
ALTER TABLE public.loop_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own donations" ON public.loop_donations 
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all donations" ON public.loop_donations 
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get or create a user's Loop wallet
CREATE OR REPLACE FUNCTION public.get_or_create_loop_wallet(p_user_id uuid, p_city text DEFAULT 'toledo')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  SELECT id INTO v_wallet_id FROM loop_wallets WHERE user_id = p_user_id AND city = p_city;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO loop_wallets (user_id, city) VALUES (p_user_id, p_city)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  RETURN v_wallet_id;
END;
$$;

-- Function to issue points to a user
CREATE OR REPLACE FUNCTION public.issue_loop_points(
  p_user_id uuid,
  p_business_id uuid,
  p_points integer,
  p_transaction_type loop_transaction_type,
  p_description text DEFAULT NULL,
  p_qr_code_id uuid DEFAULT NULL,
  p_mission_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_transaction_id uuid;
  v_business_settings business_loop_settings;
BEGIN
  -- Check if business is an active Loop participant
  IF p_business_id IS NOT NULL THEN
    SELECT * INTO v_business_settings FROM business_loop_settings 
    WHERE business_id = p_business_id AND is_active = true;
    
    IF v_business_settings.id IS NULL THEN
      RAISE EXCEPTION 'Business is not an active Loop participant';
    END IF;
    
    -- Check monthly point cap
    IF v_business_settings.points_issued_this_month + p_points > 
       (SELECT points_cap_monthly FROM loop_tiers WHERE id = v_business_settings.loop_tier_id) THEN
      RAISE EXCEPTION 'Monthly point issuance cap exceeded';
    END IF;
  END IF;
  
  -- Get or create wallet
  v_wallet_id := get_or_create_loop_wallet(p_user_id);
  
  -- Create transaction
  INSERT INTO loop_transactions (
    wallet_id, business_id, transaction_type, points, description, qr_code_id, mission_id
  ) VALUES (
    v_wallet_id, p_business_id, p_transaction_type, p_points, p_description, p_qr_code_id, p_mission_id
  ) RETURNING id INTO v_transaction_id;
  
  -- Update wallet balance
  UPDATE loop_wallets 
  SET 
    points_balance = points_balance + p_points,
    lifetime_earned = CASE WHEN p_transaction_type = 'earn' OR p_transaction_type = 'bonus' 
                      THEN lifetime_earned + p_points ELSE lifetime_earned END,
    updated_at = now()
  WHERE id = v_wallet_id;
  
  -- Update business points issued this month
  IF p_business_id IS NOT NULL THEN
    UPDATE business_loop_settings 
    SET points_issued_this_month = points_issued_this_month + p_points,
        updated_at = now()
    WHERE business_id = p_business_id;
  END IF;
  
  RETURN v_transaction_id;
END;
$$;

-- Function to redeem points for a reward
CREATE OR REPLACE FUNCTION public.redeem_loop_points(
  p_user_id uuid,
  p_reward_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet loop_wallets;
  v_reward loop_rewards;
  v_transaction_id uuid;
  v_redemption_code text;
BEGIN
  -- Get user wallet
  SELECT * INTO v_wallet FROM loop_wallets WHERE user_id = p_user_id AND city = 'toledo';
  IF v_wallet.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No wallet found');
  END IF;
  
  -- Get reward
  SELECT * INTO v_reward FROM loop_rewards WHERE id = p_reward_id AND is_active = true;
  IF v_reward.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;
  
  -- Check balance
  IF v_wallet.points_balance < v_reward.points_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;
  
  -- Check quantity
  IF v_reward.quantity_available IS NOT NULL AND 
     v_reward.quantity_redeemed >= v_reward.quantity_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward sold out');
  END IF;
  
  -- Create transaction (negative points)
  INSERT INTO loop_transactions (
    wallet_id, business_id, transaction_type, points, description
  ) VALUES (
    v_wallet.id, v_reward.business_id, 'redeem', -v_reward.points_cost, 
    'Redeemed: ' || v_reward.name
  ) RETURNING id INTO v_transaction_id;
  
  -- Update wallet
  UPDATE loop_wallets 
  SET 
    points_balance = points_balance - v_reward.points_cost,
    lifetime_redeemed = lifetime_redeemed + v_reward.points_cost,
    updated_at = now()
  WHERE id = v_wallet.id;
  
  -- Generate redemption code
  v_redemption_code := upper(substring(md5(random()::text) from 1 for 8));
  
  -- Create redemption record
  INSERT INTO loop_redemptions (
    user_id, reward_id, transaction_id, redemption_code
  ) VALUES (
    p_user_id, p_reward_id, v_transaction_id, v_redemption_code
  );
  
  -- Update reward quantity
  UPDATE loop_rewards SET quantity_redeemed = quantity_redeemed + 1 WHERE id = p_reward_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'redemption_code', v_redemption_code,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Function to reset monthly point caps
CREATE OR REPLACE FUNCTION public.reset_monthly_loop_caps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE business_loop_settings 
  SET 
    points_issued_this_month = 0,
    month_reset_at = CURRENT_DATE,
    updated_at = now()
  WHERE month_reset_at < date_trunc('month', CURRENT_DATE);
END;
$$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_loop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_loop_wallets_updated_at
  BEFORE UPDATE ON public.loop_wallets
  FOR EACH ROW EXECUTE FUNCTION update_loop_updated_at();

CREATE TRIGGER update_business_loop_settings_updated_at
  BEFORE UPDATE ON public.business_loop_settings
  FOR EACH ROW EXECUTE FUNCTION update_loop_updated_at();

CREATE TRIGGER update_loop_rewards_updated_at
  BEFORE UPDATE ON public.loop_rewards
  FOR EACH ROW EXECUTE FUNCTION update_loop_updated_at();

CREATE TRIGGER update_loop_mission_progress_updated_at
  BEFORE UPDATE ON public.loop_mission_progress
  FOR EACH ROW EXECUTE FUNCTION update_loop_updated_at();