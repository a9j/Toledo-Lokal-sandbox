-- Admin-initiated role assignment: let platform admins assign any role
-- (owner, admin, manager, hiring, viewer) directly, bypassing the self-serve
-- verification gate. Every action is logged to business_staff_admin_log.
--
-- Also extends business_invitations to support all roles so admins can invite
-- users to any role via email when no account exists yet.

-- ---------------------------------------------------------------------------
-- 1. Widen business_invitations role constraint to support all roles
-- ---------------------------------------------------------------------------

ALTER TABLE public.business_invitations
  DROP CONSTRAINT IF EXISTS business_invitations_role_check;

ALTER TABLE public.business_invitations
  ADD CONSTRAINT business_invitations_role_check
    CHECK (role IN ('owner', 'admin', 'manager', 'hiring', 'viewer', 'staff'));

-- ---------------------------------------------------------------------------
-- 2. Extend admin_attach_business_staff to accept all roles + owner guard
--
-- Replaces the existing function. Now accepts every role in the hierarchy.
-- When assigning 'owner' and an owner already exists, the caller must pass
-- p_force = true to override (the old owner is demoted to manager).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_attach_business_staff(
  p_business_id uuid,
  p_role text,
  p_target_user_id uuid DEFAULT NULL,
  p_target_email text DEFAULT NULL,
  p_note text DEFAULT NULL,
  p_force boolean DEFAULT false
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
  v_existing_owner uuid;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can attach business staff';
  END IF;

  IF p_business_id IS NULL THEN
    RAISE EXCEPTION 'business_id is required';
  END IF;

  IF p_role IS NULL
     OR p_role NOT IN ('owner', 'admin', 'manager', 'hiring', 'viewer', 'staff') THEN
    RAISE EXCEPTION 'role must be one of: owner, admin, manager, hiring, viewer, staff';
  END IF;

  IF p_target_user_id IS NULL AND (v_email IS NULL OR v_email = '') THEN
    RAISE EXCEPTION 'Provide a target_user_id or target_email';
  END IF;

  -- Resolve which user (if any) this targets.
  IF p_target_user_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_target_user_id) THEN
      RAISE EXCEPTION 'User not found. The person must sign up first.';
    END IF;
    v_user_id := p_target_user_id;
  ELSE
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = v_email
    LIMIT 1;
  END IF;

  -- Owner-seat guard: enforce one-owner-per-business.
  IF p_role = 'owner' THEN
    SELECT owner_user_id INTO v_existing_owner
    FROM public.businesses WHERE id = p_business_id;

    IF v_existing_owner IS NOT NULL THEN
      IF v_user_id IS NOT NULL AND v_existing_owner = v_user_id THEN
        RETURN jsonb_build_object(
          'action', 'noop',
          'message', 'User is already the owner'
        );
      END IF;

      IF NOT p_force THEN
        RAISE EXCEPTION 'Business already has an owner (%). Pass force=true to override and demote the current owner to manager.', v_existing_owner;
      END IF;

      -- Demote the current owner to manager.
      UPDATE public.business_staff
         SET role = 'manager', updated_at = now()
       WHERE business_id = p_business_id AND user_id = v_existing_owner AND role = 'owner';

      INSERT INTO public.business_staff_admin_log
        (business_id, performed_by, action, target_user_id, role, note)
      VALUES
        (p_business_id, auth.uid(), 'update_role', v_existing_owner, 'manager',
         'Demoted from owner during admin owner reassignment');
    END IF;
  END IF;

  IF v_user_id IS NOT NULL THEN
    IF p_role = 'owner' THEN
      -- Use the controlled owner-grant path so triggers allow the update.
      PERFORM public.grant_business_owner(p_business_id, v_user_id);
      -- Capture the staff row id for the audit log.
      SELECT id INTO v_staff_id FROM public.business_staff
       WHERE business_id = p_business_id AND user_id = v_user_id;
    ELSE
      INSERT INTO public.business_staff (business_id, user_id, role)
      VALUES (p_business_id, v_user_id, p_role)
      ON CONFLICT (business_id, user_id) DO UPDATE
        SET role = EXCLUDED.role,
            updated_at = now()
      RETURNING id INTO v_staff_id;
    END IF;

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

-- Must re-grant since we changed the signature (added p_force).
REVOKE ALL ON FUNCTION public.admin_attach_business_staff(uuid, text, uuid, text, text, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_attach_business_staff(uuid, text, uuid, text, text, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. RPC: admin_change_staff_role
--
-- Updates an existing business_staff row to a new role, with the one-owner
-- guard. Logs the change.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_change_staff_role(
  p_staff_id uuid,
  p_new_role text,
  p_force boolean DEFAULT false,
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
  v_old_role text;
  v_existing_owner uuid;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only platform admins can change staff roles';
  END IF;

  IF p_new_role IS NULL
     OR p_new_role NOT IN ('owner', 'admin', 'manager', 'hiring', 'viewer', 'staff') THEN
    RAISE EXCEPTION 'role must be one of: owner, admin, manager, hiring, viewer, staff';
  END IF;

  SELECT business_id, user_id, role
    INTO v_business_id, v_user_id, v_old_role
  FROM public.business_staff
  WHERE id = p_staff_id;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Staff row not found';
  END IF;

  IF v_old_role = p_new_role THEN
    RETURN jsonb_build_object('action', 'noop', 'message', 'Role is already ' || p_new_role);
  END IF;

  -- Promoting to owner: enforce single-owner.
  IF p_new_role = 'owner' THEN
    SELECT owner_user_id INTO v_existing_owner
    FROM public.businesses WHERE id = v_business_id;

    IF v_existing_owner IS NOT NULL AND v_existing_owner <> v_user_id THEN
      IF NOT p_force THEN
        RAISE EXCEPTION 'Business already has an owner. Pass force=true to override.';
      END IF;
      UPDATE public.business_staff
         SET role = 'manager', updated_at = now()
       WHERE business_id = v_business_id AND user_id = v_existing_owner AND role = 'owner';

      INSERT INTO public.business_staff_admin_log
        (business_id, performed_by, action, target_user_id, role, note)
      VALUES
        (v_business_id, auth.uid(), 'update_role', v_existing_owner, 'manager',
         'Demoted from owner during admin role change');
    END IF;

    -- Use the controlled grant path.
    PERFORM public.grant_business_owner(v_business_id, v_user_id);
  ELSE
    -- If demoting from owner, clear the owner seat.
    IF v_old_role = 'owner' THEN
      PERFORM set_config('app.allow_owner_claim', '1', true);
      UPDATE public.businesses
         SET owner_user_id = NULL
       WHERE id = v_business_id AND owner_user_id = v_user_id;
    END IF;

    UPDATE public.business_staff
       SET role = p_new_role, updated_at = now()
     WHERE id = p_staff_id;
  END IF;

  INSERT INTO public.business_staff_admin_log
    (business_id, performed_by, action, target_user_id, role, staff_id, note)
  VALUES
    (v_business_id, auth.uid(), 'update_role', v_user_id, p_new_role, p_staff_id,
     coalesce(p_note, '') || ' (was: ' || v_old_role || ')');

  RETURN jsonb_build_object(
    'action', 'update_role',
    'staff_id', p_staff_id,
    'old_role', v_old_role,
    'new_role', p_new_role,
    'business_id', v_business_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_staff_role(uuid, text, boolean, text) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_change_staff_role(uuid, text, boolean, text) TO authenticated;
