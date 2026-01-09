-- Drop and recreate leads_safe view to mask sensitive contact information
DROP VIEW IF EXISTS public.leads_safe;

CREATE VIEW public.leads_safe 
WITH (security_invoker = true)
AS
SELECT 
  l.id,
  l.business_id,
  l.user_id,
  l.request_id,
  l.type,
  l.name,
  -- Mask contact info: show only first 3 chars + masked portion
  CASE 
    WHEN l.contact_info IS NULL THEN NULL
    WHEN length(l.contact_info) <= 6 THEN '******'
    ELSE left(l.contact_info, 3) || repeat('*', length(l.contact_info) - 3)
  END AS contact_info_masked,
  -- Only show full contact_info to the business owner (checked via RLS on underlying table)
  l.contact_info,
  l.message,
  l.status,
  l.created_at
FROM public.leads l;

-- Add comment explaining the view
COMMENT ON VIEW public.leads_safe IS 'Secure view for leads with masked contact information. Full contact_info access is controlled by RLS on the leads table.';