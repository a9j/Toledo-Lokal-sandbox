-- ── Food Truck Live Map Schema ───────────────────────────────────────────────

-- Extend food_truck_locations with live-tracking columns
ALTER TABLE food_truck_locations
  ADD COLUMN IF NOT EXISTS here_until timestamptz,
  ADD COLUMN IF NOT EXISTS tracking_enabled boolean DEFAULT false;

-- ── food_truck_schedules — weekly recurring schedule ──────────────────────────
CREATE TABLE IF NOT EXISTS food_truck_schedules (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  location_name text NOT NULL,
  start_time    text NOT NULL,
  end_time      text NOT NULL,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ft_schedules_business ON food_truck_schedules(business_id);

ALTER TABLE food_truck_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_view_active_schedules" ON food_truck_schedules
  FOR SELECT USING (is_active = true);

CREATE POLICY "owner_manage_schedules" ON food_truck_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = business_id AND b.owner_user_id = auth.uid()
    )
  );

-- ── user_truck_follows ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_truck_follows (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  business_id    uuid NOT NULL REFERENCES businesses(id)  ON DELETE CASCADE,
  notify_nearby  boolean DEFAULT true,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_truck_follows_user     ON user_truck_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_truck_follows_business ON user_truck_follows(business_id);

ALTER TABLE user_truck_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_follows" ON user_truck_follows
  FOR ALL USING (auth.uid() = user_id);

-- ── Enable realtime on food_truck_locations ───────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE food_truck_locations;
