-- ══════════════════════════════════════════════════════════════════════════
-- LOOP POINTS: ADDITIVE EXTENSIONS + GUARDRAIL FUNCTIONS
-- Option A — extends existing tables, adds missing columns & enforcement logic
--
-- Existing tables being extended (DO NOT recreate):
--   loop_wallets        ← equivalent of requested loop_points_accounts
--   loop_transactions   ← equivalent of requested loop_points_transactions
--   loop_rewards        ← same name, already exists
--   loop_redemptions    ← same name, already exists
--   loop_qr_codes       ← same name, already exists
--   loop_qr_scans       ← equivalent of requested loop_scans
-- ══════════════════════════════════════════════════════════════════════════


-- ── 1. New enum: QR scan limit type ──────────────────────────────────────

CREATE TYPE public.loop_scan_type AS ENUM ('unlimited', 'daily_limit', 'single_use');


-- ── 2. loop_qr_codes: add scan_type, daily_scan_limit, code_data ─────────
--
--  scan_type      replaces/clarifies the existing boolean is_single_use
--  daily_scan_limit  max scans this code can receive per calendar day
--  code_data      the raw QR payload (UUID or URL) — unique per code

ALTER TABLE public.loop_qr_codes
  ADD COLUMN scan_type       public.loop_scan_type NOT NULL DEFAULT 'daily_limit',
  ADD COLUMN daily_scan_limit integer,
  ADD COLUMN code_data       text;

-- Backfill scan_type from existing is_single_use
UPDATE public.loop_qr_codes SET scan_type = 'single_use' WHERE is_single_use = true;
UPDATE public.loop_qr_codes SET scan_type = 'unlimited'  WHERE is_single_use = false AND scan_cooldown_hours = 0;
-- Remaining rows with cooldown stay as 'daily_limit' (already the default)

-- Unique partial index — NULL code_data rows are unaffected
CREATE UNIQUE INDEX idx_loop_qr_codes_code_data
  ON public.loop_qr_codes(code_data)
  WHERE code_data IS NOT NULL;


-- ── 3. loop_qr_scans: add business_id, points_awarded ───────────────────
--
--  business_id   denormalised for fast guardrail queries (cooldown, pattern)
--  points_awarded actual points issued for this scan (may differ from
--                 qr_codes.points_value after diminishing returns / daily cap)

ALTER TABLE public.loop_qr_scans
  ADD COLUMN business_id    uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN points_awarded integer;

-- Backfill business_id from parent qr_code
UPDATE public.loop_qr_scans s
SET    business_id = q.business_id
FROM   public.loop_qr_codes q
WHERE  s.qr_code_id   = q.id
  AND  s.business_id  IS NULL;

CREATE INDEX idx_loop_qr_scans_business
  ON public.loop_qr_scans(business_id) WHERE business_id IS NOT NULL;

-- Composite index used by all guardrail queries
CREATE INDEX idx_loop_qr_scans_user_business_time
  ON public.loop_qr_scans(user_id, business_id, created_at DESC);


-- ── 4. loop_redemptions: add business_id, points_spent; constrain status ─
--
--  business_id  denormalised — avoids JOIN to loop_rewards on every lookup
--  points_spent the points that were deducted (absolute value, always > 0)
--  status CHECK  adds 'confirmed' and 'expired' as allowed values alongside
--                the existing 'pending' default

ALTER TABLE public.loop_redemptions
  ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN points_spent integer;

-- Normalise any NULL / non-standard status values before adding constraint
UPDATE public.loop_redemptions SET status = 'pending' WHERE status IS NULL OR status NOT IN ('pending', 'confirmed', 'expired');

ALTER TABLE public.loop_redemptions
  ADD CONSTRAINT loop_redemptions_status_check
  CHECK (status IN ('pending', 'confirmed', 'expired'));

-- Backfill business_id from reward
UPDATE public.loop_redemptions r
SET    business_id = rw.business_id
FROM   public.loop_rewards rw
WHERE  r.reward_id    = rw.id
  AND  r.business_id  IS NULL;

-- Backfill points_spent from linked transaction (stored as negative in loop_transactions)
UPDATE public.loop_redemptions r
SET    points_spent = ABS(t.points)
FROM   public.loop_transactions t
WHERE  r.transaction_id = t.id
  AND  r.points_spent   IS NULL;

CREATE INDEX idx_loop_redemptions_business
  ON public.loop_redemptions(business_id) WHERE business_id IS NOT NULL;

CREATE INDEX idx_loop_redemptions_status
  ON public.loop_redemptions(status) WHERE status != 'confirmed';


-- ── 5. loop_daily_caps: add fraud-detection columns ─────────────────────

ALTER TABLE public.loop_daily_caps
  ADD COLUMN IF NOT EXISTS fraud_flagged     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fraud_flag_reason text;

CREATE INDEX IF NOT EXISTS idx_loop_daily_caps_fraud
  ON public.loop_daily_caps(cap_date) WHERE fraud_flagged = true;


-- ══════════════════════════════════════════════════════════════════════════
-- GUARDRAIL FUNCTIONS
-- ══════════════════════════════════════════════════════════════════════════


-- ── 6. check_scan_cooldown ───────────────────────────────────────────────
-- Returns TRUE (scan allowed) if the user has NOT scanned any QR code at
-- this business within the last p_hours hours.

CREATE OR REPLACE FUNCTION public.check_scan_cooldown(
  p_user_id     uuid,
  p_business_id uuid,
  p_hours       integer DEFAULT 4
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM   public.loop_qr_scans
    WHERE  user_id     = p_user_id
      AND  business_id = p_business_id
      AND  created_at  > now() - make_interval(hours => p_hours)
  );
$$;


-- ── 7. get_scan_points_multiplier ────────────────────────────────────────
-- Diminishing returns: 1.0 for 1st / 2nd scan at a business today,
-- 0.5 for the 3rd scan onwards (same business, same UTC day).

CREATE OR REPLACE FUNCTION public.get_scan_points_multiplier(
  p_user_id     uuid,
  p_business_id uuid
)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN COUNT(*) >= 2 THEN 0.5   -- 3rd+ scan → 50 %
    ELSE 1.0
  END
  FROM public.loop_qr_scans
  WHERE user_id     = p_user_id
    AND business_id = p_business_id
    AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC');
$$;


-- ── 8. apply_daily_points_cap ────────────────────────────────────────────
-- Returns the actual points to award after enforcing the daily user cap.
-- Initialises a loop_daily_caps row for today if one does not exist yet.

CREATE OR REPLACE FUNCTION public.apply_daily_points_cap(
  p_user_id          uuid,
  p_points_requested integer,
  p_daily_cap        integer DEFAULT 500
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_earned_today integer;
  v_remaining    integer;
BEGIN
  -- Ensure today's row exists
  INSERT INTO public.loop_daily_caps (user_id, cap_date, points_earned)
  VALUES (p_user_id, CURRENT_DATE, 0)
  ON CONFLICT (user_id, cap_date) DO NOTHING;

  SELECT COALESCE(points_earned, 0)
  INTO   v_earned_today
  FROM   public.loop_daily_caps
  WHERE  user_id  = p_user_id
    AND  cap_date = CURRENT_DATE;

  v_remaining := p_daily_cap - v_earned_today;

  IF v_remaining <= 0 THEN
    RETURN 0;
  END IF;

  RETURN LEAST(p_points_requested, v_remaining);
END;
$$;


-- ── 9. check_and_flag_scan_pattern ──────────────────────────────────────
-- Fraud guardrail: if the user has scanned 10+ distinct businesses in the
-- last 60 minutes, freeze their wallet and flag the daily cap record.
-- Returns TRUE if the account was flagged.

CREATE OR REPLACE FUNCTION public.check_and_flag_scan_pattern(
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_distinct_businesses integer;
BEGIN
  SELECT COUNT(DISTINCT business_id)
  INTO   v_distinct_businesses
  FROM   public.loop_qr_scans
  WHERE  user_id    = p_user_id
    AND  created_at > now() - interval '1 hour';

  IF v_distinct_businesses < 10 THEN
    RETURN false;
  END IF;

  -- Freeze wallet
  UPDATE public.loop_wallets
  SET    is_frozen     = true,
         frozen_reason = 'Auto-flagged: ' || v_distinct_businesses
                         || ' distinct businesses scanned within 1 hour. '
                         || 'Account under review.',
         updated_at    = now()
  WHERE  user_id = p_user_id
    AND  city    = 'toledo';

  -- Mark daily cap row
  INSERT INTO public.loop_daily_caps
    (user_id, cap_date, fraud_flagged, fraud_flag_reason)
  VALUES
    (p_user_id, CURRENT_DATE, true, 'Rapid multi-business scan pattern')
  ON CONFLICT (user_id, cap_date) DO UPDATE
    SET fraud_flagged     = true,
        fraud_flag_reason = 'Rapid multi-business scan pattern';

  RETURN true;
END;
$$;


-- ── 10. process_qr_scan ──────────────────────────────────────────────────
-- Master scan function. Runs all four guardrails atomically then issues
-- points via the existing issue_loop_points() function.
--
-- Guardrails applied (in order):
--   1. Wallet freeze check
--   2. 4-hour cooldown per business
--   3. Diminishing returns (3rd+ scan at same business today → 50 % points)
--   4. Daily 500-point cap per user
--   5. Fraud pattern detection (10+ businesses/hour → wallet freeze)
--
-- Returns a JSONB result the caller can inspect:
--   { success, points_awarded, original_points, multiplier,
--     scan_id, transaction_id, daily_cap_applied, flagged, error }
--
-- NOTE: If the QR code has requires_staff_confirm = true the scan is still
-- recorded with status 'pending_confirmation' (existing edge-function flow).
-- Call this function from the edge function BEFORE creating the scan record
-- to validate guardrails, or use it as a standalone atomic path.

CREATE OR REPLACE FUNCTION public.process_qr_scan(
  p_user_id    uuid,
  p_qr_code_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr              public.loop_qr_codes;
  v_wallet_id       uuid;
  v_is_frozen       boolean;
  v_multiplier      numeric;
  v_points_base     integer;
  v_points_awarded  integer;
  v_transaction_id  uuid;
  v_scan_id         uuid;
  v_flagged         boolean;
  v_scan_status     text;
BEGIN
  -- ── Load QR code ────────────────────────────────────────────────────
  SELECT * INTO v_qr
  FROM   public.loop_qr_codes
  WHERE  id        = p_qr_code_id
    AND  is_active = true;

  IF v_qr.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'QR code not found or inactive');
  END IF;

  -- ── Wallet check (create if first visit) ────────────────────────────
  SELECT id, is_frozen
  INTO   v_wallet_id, v_is_frozen
  FROM   public.loop_wallets
  WHERE  user_id = p_user_id AND city = 'toledo';

  IF v_wallet_id IS NULL THEN
    v_wallet_id := public.get_or_create_loop_wallet(p_user_id, 'toledo');
    v_is_frozen := false;
  END IF;

  IF v_is_frozen THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'Account is currently under review. Contact support.'
    );
  END IF;

  -- ── GUARDRAIL 1: 4-hour business cooldown ───────────────────────────
  IF NOT public.check_scan_cooldown(p_user_id, v_qr.business_id, 4) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error',   'You already visited this business recently. Check back in a few hours!'
    );
  END IF;

  -- ── GUARDRAIL 2: Diminishing returns ────────────────────────────────
  v_multiplier  := public.get_scan_points_multiplier(p_user_id, v_qr.business_id);
  v_points_base := FLOOR(v_qr.points_value::numeric * v_multiplier)::integer;

  -- ── GUARDRAIL 3: Daily 500-point cap ────────────────────────────────
  v_points_awarded := public.apply_daily_points_cap(p_user_id, v_points_base, 500);

  -- ── Record scan (cooldown applies regardless of points earned) ───────
  v_scan_status := CASE
    WHEN v_qr.requires_staff_confirm THEN 'pending_confirmation'
    ELSE 'completed'
  END;

  INSERT INTO public.loop_qr_scans
    (qr_code_id, user_id, business_id, points_awarded, status)
  VALUES
    (p_qr_code_id, p_user_id, v_qr.business_id, v_points_awarded, v_scan_status)
  RETURNING id INTO v_scan_id;

  -- ── Issue points (skip if staff confirmation required or 0 points) ───
  IF v_points_awarded > 0 AND NOT v_qr.requires_staff_confirm THEN
    BEGIN
      v_transaction_id := public.issue_loop_points(
        p_user_id,
        v_qr.business_id,
        v_points_awarded,
        'earn',
        CASE
          WHEN v_multiplier < 1.0 THEN 'Visit scan — loyalty bonus (reduced)'
          ELSE 'Visit scan'
        END,
        p_qr_code_id
      );
    EXCEPTION WHEN OTHERS THEN
      -- Business cap exceeded or not an active Loop participant — award 0
      v_points_awarded := 0;
      v_transaction_id := NULL;
    END;

    IF v_transaction_id IS NOT NULL THEN
      -- Link transaction to scan record
      UPDATE public.loop_qr_scans
      SET    transaction_id = v_transaction_id
      WHERE  id = v_scan_id;

      -- Accumulate against user's daily cap
      UPDATE public.loop_daily_caps
      SET    points_earned = points_earned + v_points_awarded
      WHERE  user_id  = p_user_id
        AND  cap_date = CURRENT_DATE;

      -- Increment QR code total scan counter
      UPDATE public.loop_qr_codes
      SET    total_scans = total_scans + 1
      WHERE  id = p_qr_code_id;
    END IF;
  END IF;

  -- ── GUARDRAIL 4: Fraud pattern detection ────────────────────────────
  -- Runs after insert so this scan is counted in the pattern window.
  v_flagged := public.check_and_flag_scan_pattern(p_user_id);

  RETURN jsonb_build_object(
    'success',           true,
    'points_awarded',    v_points_awarded,
    'original_points',   v_qr.points_value,
    'multiplier',        v_multiplier,
    'scan_id',           v_scan_id,
    'transaction_id',    v_transaction_id,
    'staff_confirm',     v_qr.requires_staff_confirm,
    'daily_cap_applied', v_points_awarded < v_points_base,
    'flagged',           v_flagged
  );
END;
$$;


-- ── 11. validate_qr_scan (read-only pre-flight) ──────────────────────────
-- Returns what WOULD happen if process_qr_scan were called — no side effects.
-- Call this from the client before showing the "Scan" confirmation screen.

CREATE OR REPLACE FUNCTION public.validate_qr_scan(
  p_user_id    uuid,
  p_qr_code_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qr             public.loop_qr_codes;
  v_is_frozen      boolean;
  v_cooldown_ok    boolean;
  v_multiplier     numeric;
  v_points_base    integer;
  v_points_awarded integer;
  v_earned_today   integer;
BEGIN
  SELECT * INTO v_qr FROM public.loop_qr_codes WHERE id = p_qr_code_id AND is_active = true;
  IF v_qr.id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'QR code not found or inactive');
  END IF;

  SELECT COALESCE(is_frozen, false) INTO v_is_frozen
  FROM public.loop_wallets WHERE user_id = p_user_id AND city = 'toledo';
  IF v_is_frozen THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Account under review');
  END IF;

  v_cooldown_ok := public.check_scan_cooldown(p_user_id, v_qr.business_id, 4);
  IF NOT v_cooldown_ok THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Cooldown active — visit again later');
  END IF;

  v_multiplier  := public.get_scan_points_multiplier(p_user_id, v_qr.business_id);
  v_points_base := FLOOR(v_qr.points_value::numeric * v_multiplier)::integer;

  SELECT COALESCE(points_earned, 0) INTO v_earned_today
  FROM public.loop_daily_caps WHERE user_id = p_user_id AND cap_date = CURRENT_DATE;

  v_points_awarded := GREATEST(0, LEAST(v_points_base, 500 - COALESCE(v_earned_today, 0)));

  RETURN jsonb_build_object(
    'allowed',         true,
    'points_awarded',  v_points_awarded,
    'original_points', v_qr.points_value,
    'multiplier',      v_multiplier,
    'daily_remaining', GREATEST(0, 500 - COALESCE(v_earned_today, 0)),
    'staff_confirm',   v_qr.requires_staff_confirm
  );
END;
$$;
