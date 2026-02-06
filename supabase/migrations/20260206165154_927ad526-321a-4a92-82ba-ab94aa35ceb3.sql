-- Create a materialized view or use a simple aggregate for saved counts per business
-- We'll create a function that returns the count for performance

CREATE OR REPLACE FUNCTION public.get_business_saved_count(business_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM saved_items
  WHERE item_id = business_id AND item_type = 'business';
$$;

-- Create a function to get neighborhood popularity (number of saved businesses in that neighborhood)
CREATE OR REPLACE FUNCTION public.get_neighborhood_popularity(neighborhood_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(COUNT(DISTINCT si.item_id)::integer, 0)
  FROM saved_items si
  JOIN businesses b ON b.id = si.item_id
  WHERE si.item_type = 'business' AND b.neighborhood_id = $1;
$$;

-- Add index for faster neighborhood-based queries
CREATE INDEX IF NOT EXISTS idx_businesses_neighborhood_status 
ON businesses(neighborhood_id, status) WHERE status = 'approved';