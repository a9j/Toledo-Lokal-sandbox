-- Add a "Virtual" neighborhood for businesses with no physical Toledo location
-- (e.g. MyTradeJobs). The neighborhoods table backs the neighborhood selectors
-- and filters, so adding the row surfaces it everywhere automatically.
INSERT INTO public.neighborhoods (name)
SELECT 'Virtual'
WHERE NOT EXISTS (
  SELECT 1 FROM public.neighborhoods WHERE name = 'Virtual'
);
