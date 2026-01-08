-- Create a rate-limiting function for lead creation
-- Limits users to 10 leads per day per business to prevent spam
CREATE OR REPLACE FUNCTION public.check_lead_rate_limit(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM public.leads
    WHERE user_id = _user_id 
      AND business_id = _business_id
      AND created_at > now() - interval '24 hours'
  ) < 3  -- Max 3 leads per user per business per day
$$;

-- Create a global rate limit function (max leads per user per day across all businesses)
CREATE OR REPLACE FUNCTION public.check_global_lead_rate_limit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM public.leads
    WHERE user_id = _user_id 
      AND created_at > now() - interval '24 hours'
  ) < 20  -- Max 20 leads per user per day total
$$;

-- Drop the existing overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create leads for approved businesses" ON public.leads;

-- Create a new INSERT policy with rate limiting
CREATE POLICY "Authenticated users can create leads with rate limiting" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  -- Business must be approved
  AND business_id IN (SELECT id FROM businesses WHERE status = 'approved')
  -- User must set their own user_id
  AND (user_id IS NULL OR user_id = auth.uid())
  -- Rate limit per business
  AND check_lead_rate_limit(auth.uid(), business_id)
  -- Global rate limit
  AND check_global_lead_rate_limit(auth.uid())
);

-- Add length constraints on the leads table columns to prevent DoS
ALTER TABLE public.leads 
  ADD CONSTRAINT leads_name_length CHECK (name IS NULL OR char_length(name) <= 100),
  ADD CONSTRAINT leads_message_length CHECK (message IS NULL OR char_length(message) <= 2000),
  ADD CONSTRAINT leads_contact_info_length CHECK (contact_info IS NULL OR char_length(contact_info) <= 255);