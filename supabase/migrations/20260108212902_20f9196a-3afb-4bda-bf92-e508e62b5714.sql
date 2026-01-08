-- =============================================
-- SECURITY FIX 1: Remove overly permissive ticket_purchases update policy
-- =============================================
DROP POLICY IF EXISTS "System can update purchases" ON public.ticket_purchases;

-- Create a secure function to update ticket purchases (for Stripe webhooks)
CREATE OR REPLACE FUNCTION public.update_ticket_purchase_from_webhook(
  _purchase_id uuid,
  _new_status text,
  _payment_intent_id text,
  _session_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate status is one of the allowed values
  IF _new_status NOT IN ('pending', 'confirmed', 'cancelled', 'refunded') THEN
    RAISE EXCEPTION 'Invalid status value';
  END IF;
  
  UPDATE public.ticket_purchases 
  SET 
    status = _new_status,
    stripe_payment_intent_id = COALESCE(_payment_intent_id, stripe_payment_intent_id),
    stripe_session_id = COALESCE(_session_id, stripe_session_id)
  WHERE id = _purchase_id;
END;
$$;

-- =============================================
-- SECURITY FIX 2: Secure profiles table access
-- =============================================
-- Drop existing public read policies if any
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create policy: authenticated users can view all profiles (needed for showing post authors)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =============================================
-- SECURITY FIX 3: Add rate limiting tracking for AI chat
-- =============================================
CREATE TABLE IF NOT EXISTS public.ai_chat_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  message_count integer NOT NULL DEFAULT 1,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own usage"
ON public.ai_chat_usage
FOR SELECT
USING (auth.uid() = user_id);

-- No direct inserts/updates - handled by security definer function
CREATE POLICY "No direct inserts"
ON public.ai_chat_usage
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct updates"
ON public.ai_chat_usage
FOR UPDATE
USING (false);

CREATE POLICY "No direct deletes"
ON public.ai_chat_usage
FOR DELETE
USING (false);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_messages_per_day integer := 50;
BEGIN
  -- Get or create usage record for today
  INSERT INTO public.ai_chat_usage (user_id, message_count, usage_date)
  VALUES (_user_id, 1, CURRENT_DATE)
  ON CONFLICT (user_id, usage_date) 
  DO UPDATE SET message_count = ai_chat_usage.message_count + 1
  RETURNING message_count INTO current_count;
  
  -- Check if under limit
  RETURN current_count <= max_messages_per_day;
END;
$$;

-- =============================================
-- SECURITY FIX 4: Additional protection for leads
-- =============================================
-- Add index for faster rate limit checks
CREATE INDEX IF NOT EXISTS idx_leads_user_created ON public.leads(user_id, created_at);

-- Add length constraints to prevent abuse (database level)
ALTER TABLE public.leads 
  DROP CONSTRAINT IF EXISTS leads_message_length,
  ADD CONSTRAINT leads_message_length CHECK (char_length(message) <= 2000);

ALTER TABLE public.leads 
  DROP CONSTRAINT IF EXISTS leads_contact_info_length,
  ADD CONSTRAINT leads_contact_info_length CHECK (char_length(contact_info) <= 500);

ALTER TABLE public.leads 
  DROP CONSTRAINT IF EXISTS leads_name_length,
  ADD CONSTRAINT leads_name_length CHECK (char_length(name) <= 200);

-- =============================================
-- SECURITY FIX 5: Add length constraints to other tables
-- =============================================
-- Posts
ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS posts_content_length,
  ADD CONSTRAINT posts_content_length CHECK (char_length(content) <= 5000);

-- Comments
ALTER TABLE public.comments 
  DROP CONSTRAINT IF EXISTS comments_content_length,
  ADD CONSTRAINT comments_content_length CHECK (char_length(content) <= 2000);

-- Reviews
ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS reviews_content_length,
  ADD CONSTRAINT reviews_content_length CHECK (char_length(content) <= 5000);

ALTER TABLE public.reviews 
  DROP CONSTRAINT IF EXISTS reviews_title_length,
  ADD CONSTRAINT reviews_title_length CHECK (char_length(title) <= 200);

-- Businesses
ALTER TABLE public.businesses 
  DROP CONSTRAINT IF EXISTS businesses_name_length,
  ADD CONSTRAINT businesses_name_length CHECK (char_length(name) <= 200);

ALTER TABLE public.businesses 
  DROP CONSTRAINT IF EXISTS businesses_description_length,
  ADD CONSTRAINT businesses_description_length CHECK (char_length(description) <= 5000);

-- Requests
ALTER TABLE public.requests 
  DROP CONSTRAINT IF EXISTS requests_title_length,
  ADD CONSTRAINT requests_title_length CHECK (char_length(title) <= 200);

ALTER TABLE public.requests 
  DROP CONSTRAINT IF EXISTS requests_description_length,
  ADD CONSTRAINT requests_description_length CHECK (char_length(description) <= 2000);