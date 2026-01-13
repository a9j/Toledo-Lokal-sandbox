-- First drop the existing leads_safe view (it may have dependencies)
DROP VIEW IF EXISTS public.leads_safe CASCADE;

-- Recreate leads_safe view with proper security
CREATE VIEW public.leads_safe 
WITH (security_barrier = true, security_invoker = true)
AS
SELECT 
  id,
  business_id,
  user_id,
  name,
  type,
  status,
  request_id,
  created_at,
  message,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN contact_info
    WHEN business_id IN (SELECT b.id FROM businesses b WHERE b.owner_user_id = auth.uid()) THEN contact_info
    ELSE CASE 
      WHEN contact_info IS NULL THEN NULL
      ELSE CONCAT(LEFT(contact_info, 3), '****', RIGHT(contact_info, 2))
    END
  END as contact_info,
  CASE 
    WHEN contact_info IS NULL THEN NULL
    ELSE CONCAT(LEFT(contact_info, 3), '****', RIGHT(contact_info, 2))
  END as contact_info_masked
FROM leads
WHERE 
  has_role(auth.uid(), 'admin'::app_role) 
  OR business_id IN (SELECT b.id FROM businesses b WHERE b.owner_user_id = auth.uid());

-- Grant access to the secure view
GRANT SELECT ON public.leads_safe TO authenticated;