-- Per-person contact cards for a business. Each owner or staff member gets one
-- card per business holding the title they choose (e.g. "Owner", "Manager",
-- "CEO") plus a snapshot of their account name and email. When they share their
-- QR, the saved contact is filed under them, with the business as the company.

CREATE TABLE IF NOT EXISTS public.business_contact_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  title text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);

ALTER TABLE public.business_contact_cards ENABLE ROW LEVEL SECURITY;

-- A user manages only their own card, and only for a business they own or staff.
DROP POLICY IF EXISTS "Users manage their own contact card" ON public.business_contact_cards;
CREATE POLICY "Users manage their own contact card" ON public.business_contact_cards
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.business_staff s WHERE s.business_id = business_id AND s.user_id = auth.uid())
    )
  );

-- Read one card by id for the no-account save flow. A SECURITY DEFINER function
-- avoids a blanket public SELECT that would let anyone harvest every card.
CREATE OR REPLACE FUNCTION public.get_contact_card(p_card_id uuid)
RETURNS TABLE (name text, title text, email text, business_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT name, title, email, business_id
  FROM public.business_contact_cards
  WHERE id = p_card_id
$$;

GRANT EXECUTE ON FUNCTION public.get_contact_card(uuid) TO anon, authenticated;
