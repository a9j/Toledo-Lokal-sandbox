-- ── Loop Marketplace Schema ──────────────────────────────────────────────────

-- Extend loop_rewards with marketplace fields
ALTER TABLE loop_rewards
  ADD COLUMN IF NOT EXISTS reward_type text
    CHECK (reward_type IN ('discount','freebie','exclusive_event','early_access',
                           'vip_upgrade','raffle_entry','experience','donation_match')),
  ADD COLUMN IF NOT EXISTS event_date timestamptz,
  ADD COLUMN IF NOT EXISTS event_location text,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS spots_remaining integer,
  ADD COLUMN IF NOT EXISTS requires_attendance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS min_tier text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS raffle_drawing_date timestamptz,
  ADD COLUMN IF NOT EXISTS raffle_entries_count integer DEFAULT 0;

-- Backfill existing rewards: category → reward_type
UPDATE loop_rewards SET reward_type =
  CASE category
    WHEN 'perk'           THEN 'freebie'
    WHEN 'experience'     THEN 'experience'
    WHEN 'service_credit' THEN 'discount'
  END
WHERE reward_type IS NULL;

-- ── loop_event_attendees ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loop_event_attendees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id       uuid NOT NULL REFERENCES loop_rewards(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  points_spent    integer NOT NULL,
  ticket_code     text    UNIQUE NOT NULL,
  status          text    NOT NULL DEFAULT 'registered'
                  CHECK (status IN ('registered','checked_in','no_show','cancelled')),
  registered_at   timestamptz NOT NULL DEFAULT now(),
  checked_in_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_event_attendees_reward ON loop_event_attendees(reward_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user   ON loop_event_attendees(user_id);

ALTER TABLE loop_event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_attendees"   ON loop_event_attendees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_register_events"      ON loop_event_attendees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "business_view_attendees"    ON loop_event_attendees
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM loop_rewards lr
    JOIN businesses b ON b.id = lr.business_id
    WHERE lr.id = loop_event_attendees.reward_id AND b.owner_user_id = auth.uid()
  ));

CREATE POLICY "business_checkin_attendees" ON loop_event_attendees
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM loop_rewards lr
    JOIN businesses b ON b.id = lr.business_id
    WHERE lr.id = loop_event_attendees.reward_id AND b.owner_user_id = auth.uid()
  ));

-- ── reserve_event_spot RPC ───────────────────────────────────────────────────
-- Atomically: checks balance/capacity, deducts points, generates ticket code
CREATE OR REPLACE FUNCTION reserve_event_spot(
  p_user_id  uuid,
  p_reward_id uuid,
  p_entries   integer DEFAULT 1   -- >1 only for raffle_entry type
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reward   loop_rewards%ROWTYPE;
  v_wallet   loop_wallets%ROWTYPE;
  v_total_cost integer;
  v_codes    text[] := '{}';
  v_code     text;
  i          integer;
BEGIN
  SELECT * INTO v_reward FROM loop_rewards
  WHERE id = p_reward_id AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success',false,'error','Reward not found or inactive');
  END IF;

  v_total_cost := v_reward.points_cost * p_entries;

  -- Capacity check (not for raffles)
  IF v_reward.reward_type != 'raffle_entry' AND v_reward.capacity IS NOT NULL
     AND COALESCE(v_reward.spots_remaining, v_reward.capacity) < p_entries THEN
    RETURN jsonb_build_object('success',false,'error','This event is sold out');
  END IF;

  -- Duplicate registration check (not for raffles)
  IF v_reward.reward_type != 'raffle_entry' THEN
    IF EXISTS (SELECT 1 FROM loop_event_attendees
               WHERE reward_id = p_reward_id AND user_id = p_user_id AND status != 'cancelled') THEN
      RETURN jsonb_build_object('success',false,'error','You are already registered for this event');
    END IF;
  END IF;

  SELECT * INTO v_wallet FROM loop_wallets
  WHERE user_id = p_user_id AND city = 'toledo';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success',false,'error','Wallet not found');
  END IF;

  IF v_wallet.points_balance < v_total_cost THEN
    RETURN jsonb_build_object('success',false,'error','Insufficient points');
  END IF;

  -- Deduct points
  UPDATE loop_wallets
  SET points_balance = points_balance - v_total_cost,
      lifetime_redeemed = lifetime_redeemed + v_total_cost
  WHERE id = v_wallet.id;

  -- Create transaction record
  INSERT INTO loop_transactions (wallet_id, business_id, points, transaction_type, description)
  VALUES (v_wallet.id, v_reward.business_id, -v_total_cost, 'redeem',
          CASE WHEN p_entries > 1 THEN p_entries::text || ' entries: ' ELSE 'Reserved: ' END
          || v_reward.name);

  -- Generate ticket codes and create attendee records
  FOR i IN 1..p_entries LOOP
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    INSERT INTO loop_event_attendees (reward_id, user_id, points_spent, ticket_code)
    VALUES (p_reward_id, p_user_id, v_reward.points_cost, v_code);
    v_codes := array_append(v_codes, v_code);
  END LOOP;

  -- Decrement spots_remaining for capacity-limited events
  IF v_reward.capacity IS NOT NULL AND v_reward.reward_type != 'raffle_entry' THEN
    UPDATE loop_rewards SET spots_remaining = spots_remaining - p_entries WHERE id = p_reward_id;
  END IF;

  -- Increment raffle entry count
  IF v_reward.reward_type = 'raffle_entry' THEN
    UPDATE loop_rewards SET raffle_entries_count = COALESCE(raffle_entries_count,0) + p_entries
    WHERE id = p_reward_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'ticket_codes', v_codes,
    'ticket_code',  v_codes[1],
    'points_spent', v_total_cost,
    'entries',      p_entries,
    'reward_name',  v_reward.name
  );
END;
$$;
