-- Admin-side "attach a person to a business" override.
--
-- Lets platform admins manage business_staff and business_invitations when the
-- owner can't (or won't) do it themselves. Goes through SECURITY DEFINER RPCs
-- so every admin touch is logged and the policy surface stays small.

-- ---------------------------------------------------------------------------
-- 1. Audit log — every admin action on business staff/invitations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.business_staff_admin_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL
    CHECK (action IN ('attach', 'remove', 'invite', 'cancel_invite', 'update_role')),
  target_user_id uuid,
  target_email text,
  role text,
  staff_id uuid,
  invitation_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_staff_admin_log_business
  ON public.business_staff_admin_log(business_id, created_at DESC);

ALTER TABLE public.business_staff_admin_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view staff admin log" ON public.business_staff_admin_log;
CREATE POLICY "Admins view staff admin log" ON public.business_staff_admin_log
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 2. Admin override RLS for business_staff and business_invitations
--
-- Existing owner policies stay in place; these add admin pathways so the
-- admin console and the SECURITY DEFINER RPCs work without bypassing RLS in
-- surprising ways elsewhere.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Platform admins view all staff" ON public.business_staff;
CREATE POLICY "Platform admins view all staff" ON public.business_staff
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins manage staff" ON public.business_staff;
CREATE POLICY "Platform admins manage staff" ON public.business_staff
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins view all invitations" ON public.business_invitations;
CREATE POLICY "Platform admins view all invitations" ON public.business_invitations
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "Platform admins manage invitations" ON public.business_invitations;
CREATE POLICY "Platform admins manage invitations" ON public.business_invitations
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. RPC: admin_attach_business_staff
--
-- The single entry point for admins. Caller passes a business_id, a role,
-- and EITHER a target_user_id OR a target_email.
--   - target_user_id given      → attach directly to business_staff
--   - target_email matches user → attach directly to business_staff
--   - target_email unmatched    → create a business_invitations row
-- All paths write an audit log row.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_attach_business_staff(
  p_business_id uuid,
  p_role text,
  p_target_user_id uuid DEFAULT NULL,
  p_target_email text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text := lower(trim(p_target_email));
  v_staff_id uuid;
  v_invitation_id uuid;
  v_action text;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can attach business staff';
  END IF;

  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'business_id is required';
  END IF;

  IF p_role IS NULL OR p_role NOT IN ('staff', 'manager') THEN
    RAISE EXCEPTION 'role must be staff or manager';
  END IF;

  IF p_target_user_id IS NULL AND (v_email IS NULL OR v_email = '') THEN
    RAISE EXCEPTION 'Provide a target_user_id or target_email';
  END IF;

  -- Resolve which user (if any) this targets. Email lives only in auth.users.
  IF p_target_user_id IS NOT NULL THEN
    v_user_id := p_target_user_id;
  ELSE
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = v_email
    LIMIT 1;
  END IF;

  IF v_user_id IS NOT NULL THEN
    -- The target exists → attach directly. If they're already staff, just
    -- update the role.
    INSERT INTO public.business_staff (business_id, user_id, role)
    VALUES (p_business_id, v_user_id, p_role)
    ON CONFLICT (business_id, user_id) DO UPDATE
      SET role = EXCLUDED.role,
          updated_at = now()
    RETURNING id INTO v_staff_id;

    v_action := 'attach';
  ELSE
    -- Unknown email → create an invitation the recipient can accept.
    INSERT INTO public.business_invitations (business_id, email, role, invited_by)
    VALUES (p_business_id, v_email, p_role, auth.uid())
    RETURNING id INTO v_invitation_id;

    v_action := 'invite';
  END IF;

  INSERT INTO public.business_staff_admin_log
    (business_id, performed_by, action, target_user_id, target_email, role, staff_id, invitation_id, note)
  VALUES
    (p_business_id, auth.uid(), v_action, v_user_id, v_email, p_role, v_staff_id, v_invitation_id, p_note);

  RETURN jsonb_build_object(
    'action', v_action,
    'staff_id', v_staff_id,
    'invitation_id', v_invitation_id,
    'user_id', v_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_attach_business_staff(uuid, text, uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_attach_business_staff(uuid, text, uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. RPC: admin_remove_business_staff
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_remove_business_staff(
  p_staff_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_user_id uuid;
  v_role text;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can remove business staff';
  END IF;

  SELECT business_id, user_id, role
    INTO v_business_id, v_user_id, v_role
  FROM public.business_staff
  WHERE id = p_staff_id;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Staff row not found';
  END IF;

  IF v_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove the owner via this RPC';
  END IF;

  DELETE FROM public.business_staff WHERE id = p_staff_id;

  INSERT INTO public.business_staff_admin_log
    (business_id, performed_by, action, target_user_id, role, staff_id, note)
  VALUES
    (v_business_id, auth.uid(), 'remove', v_user_id, v_role, p_staff_id, p_note);

  RETURN jsonb_build_object('removed_staff_id', p_staff_id, 'business_id', v_business_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_remove_business_staff(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_remove_business_staff(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. RPC: admin_cancel_business_invitation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_cancel_business_invitation(
  p_invitation_id uuid,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_business_id uuid;
  v_email text;
  v_role text;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can cancel business invitations';
  END IF;

  SELECT business_id, email, role
    INTO v_business_id, v_email, v_role
  FROM public.business_invitations
  WHERE id = p_invitation_id;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found';
  END IF;

  DELETE FROM public.business_invitations WHERE id = p_invitation_id;

  INSERT INTO public.business_staff_admin_log
    (business_id, performed_by, action, target_email, role, invitation_id, note)
  VALUES
    (v_business_id, auth.uid(), 'cancel_invite', v_email, v_role, p_invitation_id, p_note);

  RETURN jsonb_build_object('cancelled_invitation_id', p_invitation_id, 'business_id', v_business_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_cancel_business_invitation(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_cancel_business_invitation(uuid, text) TO authenticated;
