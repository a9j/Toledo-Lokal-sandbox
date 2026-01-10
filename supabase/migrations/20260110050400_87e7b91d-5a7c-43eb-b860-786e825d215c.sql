-- Create business_staff table for staff roles
CREATE TABLE public.business_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Create business_invitations table
CREATE TABLE public.business_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'manager')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.business_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_invitations ENABLE ROW LEVEL SECURITY;

-- RLS for business_staff
-- Owners can manage staff
CREATE POLICY "Business owners can view staff"
  ON public.business_staff FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = business_id AND owner_user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Business owners can add staff"
  ON public.business_staff FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = business_id AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update staff"
  ON public.business_staff FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = business_id AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can remove staff"
  ON public.business_staff FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = business_id AND owner_user_id = auth.uid()
    )
  );

-- RLS for business_invitations
CREATE POLICY "Business owners can manage invitations"
  ON public.business_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses 
      WHERE id = business_id AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view invitation by token"
  ON public.business_invitations FOR SELECT
  USING (true);

-- Function to accept an invitation
CREATE OR REPLACE FUNCTION public.accept_business_invitation(invitation_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  result JSON;
BEGIN
  -- Get the invitation
  SELECT * INTO inv FROM business_invitations 
  WHERE token = invitation_token 
    AND accepted_at IS NULL 
    AND expires_at > now();
  
  IF inv IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Add user as staff
  INSERT INTO business_staff (business_id, user_id, role)
  VALUES (inv.business_id, auth.uid(), inv.role)
  ON CONFLICT (business_id, user_id) DO UPDATE SET role = inv.role;
  
  -- Mark invitation as accepted
  UPDATE business_invitations 
  SET accepted_at = now() 
  WHERE id = inv.id;
  
  RETURN json_build_object('success', true, 'business_id', inv.business_id);
END;
$$;

-- Function to check if user is staff of a business
CREATE OR REPLACE FUNCTION public.is_business_staff(check_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses WHERE id = check_business_id AND owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM business_staff WHERE business_id = check_business_id AND user_id = auth.uid()
  );
END;
$$;

-- Create index for faster lookups
CREATE INDEX idx_business_staff_business ON public.business_staff(business_id);
CREATE INDEX idx_business_staff_user ON public.business_staff(user_id);
CREATE INDEX idx_business_invitations_token ON public.business_invitations(token);
CREATE INDEX idx_business_invitations_business ON public.business_invitations(business_id);