-- Add founding_5_nonprofit as a valid tier_status value.
-- This is the nonprofit anchor seat on the Founding 5 page, rendered with teal styling.

CREATE OR REPLACE FUNCTION validate_tier_status()
RETURNS trigger AS $$
BEGIN
  IF NEW.tier_status IS NOT NULL AND NEW.tier_status NOT IN (
    'founding_5', 'founding_25', 'community', 'growth', 'pro', 'civic_partner', 'founding_5_nonprofit'
  ) THEN
    RAISE EXCEPTION 'Invalid tier_status: %', NEW.tier_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
