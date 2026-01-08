-- Fix the overly permissive update policy on ticket_purchases
DROP POLICY IF EXISTS "System can update purchases" ON public.ticket_purchases;

-- Only allow updates via service role (edge functions)
CREATE POLICY "Users can view confirmed purchases"
ON public.ticket_purchases FOR SELECT
USING (auth.uid() = user_id OR status = 'confirmed');