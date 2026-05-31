-- Add structured event fields to pulse_posts
ALTER TABLE pulse_posts
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'update',
  ADD COLUMN IF NOT EXISTS event_date date,
  ADD COLUMN IF NOT EXISTS event_start_time time,
  ADD COLUMN IF NOT EXISTS event_end_time time,
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_address text;

-- Link events table back to pulse posts
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS pulse_post_id uuid REFERENCES pulse_posts(id) ON DELETE SET NULL;

-- Add Maumee neighborhood if missing
INSERT INTO neighborhoods (name)
VALUES ('Maumee')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_events_pulse_post_id ON events(pulse_post_id);
CREATE INDEX IF NOT EXISTS idx_pulse_posts_post_type ON pulse_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_pulse_posts_event_date ON pulse_posts(event_date);
