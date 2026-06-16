-- Add civic_partner to the allowed tier_status values.
-- Civic Partner is an uncapped role for civic bodies (BIDs, neighborhood
-- associations, district coalitions). It is NOT a founding seat.

CREATE OR REPLACE FUNCTION public.validate_tier_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tier_status NOT IN ('founding_5', 'founding_50', 'community', 'growth', 'pro', 'civic_partner') THEN
    RAISE EXCEPTION 'Invalid tier_status: %. Must be founding_5, founding_50, community, growth, pro, or civic_partner', NEW.tier_status;
  END IF;
  RETURN NEW;
END;
$function$;
