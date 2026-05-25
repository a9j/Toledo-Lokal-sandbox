-- Admin-to-owner messaging: in-app inbox + email delivery
-- Messages are written by admins (individually or as a broadcast) and read by
-- the recipient business owner. One row is created per recipient so that read
-- state can be tracked individually, even for broadcasts.

CREATE TABLE public.owner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  subject text,
  body text NOT NULL,
  is_broadcast boolean NOT NULL DEFAULT false,
  emailed boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_messages ENABLE ROW LEVEL SECURITY;

-- Admins can create and view every message
CREATE POLICY "Admins manage all owner messages" ON public.owner_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Owners can read messages addressed to them
CREATE POLICY "Recipients can view their messages" ON public.owner_messages
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid());

-- Owners can mark their own messages as read
CREATE POLICY "Recipients can update their messages" ON public.owner_messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

CREATE INDEX idx_owner_messages_recipient ON public.owner_messages(recipient_id, created_at DESC);
