-- Fix the security definer view issue by using SECURITY INVOKER (default)
-- Views should respect the calling user's permissions

DROP VIEW IF EXISTS public.leads_safe;

-- Recreate view without security definer (uses invoker by default)
CREATE VIEW public.leads_safe 
WITH (security_invoker = true)
AS
SELECT 
  id,
  business_id,
  type,
  status,
  created_at,
  request_id,
  user_id,
  -- Mask sensitive contact information
  CASE 
    WHEN contact_info IS NULL THEN NULL
    WHEN LENGTH(contact_info) <= 6 THEN '****'
    ELSE CONCAT(LEFT(contact_info, 3), '****', RIGHT(contact_info, 2))
  END AS contact_info,
  CASE
    WHEN name IS NULL THEN NULL
    WHEN LENGTH(name) <= 2 THEN '**'
    ELSE CONCAT(LEFT(name, 1), '***')
  END AS name,
  -- Message can be shown but truncated for preview
  CASE
    WHEN message IS NULL THEN NULL
    ELSE LEFT(message, 50)
  END AS message_preview
FROM public.leads;

-- Grant access to the view
GRANT SELECT ON public.leads_safe TO authenticated;