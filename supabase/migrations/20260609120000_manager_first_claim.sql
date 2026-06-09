-- Manager-first onboarding + owner claim flow
--
-- Lets a manager stand up and run a business profile before any owner exists,
-- and lets the real owner later claim ownership without creating a duplicate.
--
-- Building blocks:
--   * role hierarchy on business_staff: owner > admin > manager > hiring > viewer
--     ('staff' kept as a legacy scanner-only role, ranked at the bottom)
--   * businesses.owner_user_id becomes NULLABLE so the owner seat can be empty
--   * pending_claims table to track owner/manager claims awaiting verification
--   * duplicate-detection + claim/transfer/approve RPCs (SECURITY DEFINER,
--     matching the existing accept_business_invitation / admin_attach pattern)
--   * founding-badge integrity: tier_* fields can only be changed by the
--     business owner or a platform admin, never by a manager, and ownership
--     changes never touch tier fields.
--
-- Manager edit access to businesses / deals / events / leads / jobs / loop_*
-- already exists from 20260527000000_business_manager_admin_access.sql; this
-- migration adds the tier guard and the claim machinery on top of it.

-- ===========================================================================
-- 1. ROLE HIERARCHY
-- ===========================================================================

-- 'manager' already exists; add admin / hiring / viewer. 'staff' is retained so
-- existing scanner-only rows and the current invite UI keep working.
ALTER TABLE public.business_staff
  DROP CONSTRAINT IF EXISTS business_staff_role_check;
ALTER TABLE public.business_staff
  ADD CONSTRAINT business_staff_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'hiring', 'viewer', 'staff'));

-- Numeric priority for resolving conflicting edits / sorting roles.
CREATE OR REPLACE FUNCTION public.business_role_rank(_role text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE _role
    WHEN 'owner'   THEN 100
    WHEN 'admin'   THEN 80
    WHEN 'manager' THEN 60
    WHEN 'hiring'  THEN 40
    WHEN 'viewer'  THEN 20
    WHEN 'staff'   THEN 10
    ELSE 0
  END;
$$;

-- A business can have at most one owner row at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_owner_per_business
  ON public.business_staff (business_id)
  WHERE role = 'owner';

-- Fast membership lookups (UNIQUE(business_id, user_id) already exists from the
-- original table; this composite helps the effective-role / claim queries).
CREATE INDEX IF NOT EXISTS idx_business_staff_business_user
  ON public.business_staff (business_id, user_id);

-- ===========================================================================
-- 2. EMPTY OWNER SEAT
-- ===========================================================================

-- Allow manager-first businesses to exist with no owner. Existing RLS that
-- compares owner_user_id = auth.uid() keeps working (NULL never matches).
ALTER TABLE public.businesses
  ALTER COLUMN owner_user_id DROP NOT NULL;

-- ===========================================================================
-- 3. DUPLICATE-MATCH INDEXES (normalized name + street address)
-- ===========================================================================

CREATE INDEX IF NOT EXISTS idx_businesses_norm_name
  ON public.businesses (lower(btrim(name)));

CREATE INDEX IF NOT EXISTS idx_business_locations_norm_street
  ON public.business_locations (lower(btrim(street_address)));

-- ===========================================================================
-- 4. PENDING CLAIMS
-- ===========================================================================

CREATE TABLE IF NOT EXISTS public.pending_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  claimant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_role text NOT NULL DEFAULT 'owner'
    CHECK (claimed_role IN ('owner', 'manager')),
  verification_method text NOT NULL
    CHECK (verification_method IN ('email_domain', 'manual_confirmation', 'manager_approval', 'admin_approval')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_claims_business
  ON public.pending_claims (business_id);
CREATE INDEX IF NOT EXISTS idx_pending_claims_claimant
  ON public.pending_claims (claimant_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_claims_pending
  ON public.pending_claims (status) WHERE status = 'pending';

-- At most one active (pending) claim per (business, claimant).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pending_claim_active
  ON public.pending_claims (business_id, claimant_user_id)
  WHERE status = 'pending';

ALTER TABLE public.pending_claims ENABLE ROW LEVEL SECURITY;

-- Claimants see their own claims.
DROP POLICY IF EXISTS "Claimant views own claims" ON public.pending_claims;
CREATE POLICY "Claimant views own claims"
  ON public.pending_claims FOR SELECT TO authenticated
  USING (claimant_user_id = auth.uid());

-- Owner / business-admin / manager of the business, and platform admins, can
-- see claims for that business (so they can approve/reject). All writes go
-- through SECURITY DEFINER RPCs below, so no INSERT/UPDATE policies are needed.
DROP POLICY IF EXISTS "Business stewards view claims" ON public.pending_claims;
CREATE POLICY "Business stewards view claims"
  ON public.pending_claims FOR SELECT TO authenticated
  USING (
    public.is_platform_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = pending_claims.business_id AND b.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.business_staff s
      WHERE s.business_id = pending_claims.business_id
        AND s.user_id = auth.uid()
        AND s.role IN ('owner', 'admin', 'manager')
    )
  );

-- ===========================================================================
-- 5. FOUNDING-BADGE INTEGRITY
--
-- tier_status / tier_badge_visible / tier_assigned_* / tier_revoked_* may only
-- be changed by the business owner or a platform admin. Managers (and lower
-- roles) can edit everything else on the business but never tier/founding
-- fields. Ownership changes below deliberately leave these columns untouched.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.enforce_business_tier_protection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.tier_status        IS DISTINCT FROM OLD.tier_status
      OR NEW.tier_badge_visible IS DISTINCT FROM OLD.tier_badge_visible
      OR NEW.tier_assigned_at   IS DISTINCT FROM OLD.tier_assigned_at
      OR NEW.tier_assigned_by   IS DISTINCT FROM OLD.tier_assigned_by
      OR NEW.tier_revoked_at    IS DISTINCT FROM OLD.tier_revoked_at
      OR NEW.tier_revoked_by    IS DISTINCT FROM OLD.tier_revoked_by) THEN
    IF NOT (
      public.is_platform_admin(auth.uid())
      OR (OLD.owner_user_id IS NOT NULL AND OLD.owner_user_id = auth.uid())
    ) THEN
      RAISE EXCEPTION 'Only the business owner or a platform admin can change tier/founding fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_enforce_tier_protection ON public.businesses;
CREATE TRIGGER businesses_enforce_tier_protection
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_business_tier_protection();

-- Trigger functions must never be reachable as RPCs.
REVOKE ALL ON FUNCTION public.enforce_business_tier_protection() FROM public, anon, authenticated;

-- ===========================================================================
-- 6. OWNERSHIP-TRANSFER GUARD (updated for the empty-seat claim path)
--
-- owner_user_id may only change when:
--   * the change happens inside one of the claim/transfer RPCs below, which set
--     a transaction-local flag (app.allow_owner_claim = '1'), OR
--   * the actor is the current owner or a platform admin.
-- This lets the controlled RPCs fill an empty owner seat while still blocking
-- anyone from grabbing ownership via a raw UPDATE.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.enforce_business_owner_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    -- Controlled RPC path (the RPC has already authorized the caller).
    IF coalesce(current_setting('app.allow_owner_claim', true), '') = '1' THEN
      RETURN NEW;
    END IF;
    -- Platform admins may reassign ownership directly.
    IF public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    -- A current owner may transfer their own business. Note the explicit
    -- IS NOT NULL guard: an empty owner seat (OLD.owner_user_id IS NULL) makes
    -- `OLD.owner_user_id = auth.uid()` evaluate to NULL, so without this check
    -- three-valued logic would let ANY user with update access grab the seat.
    -- Empty seats may be filled only through the claim/transfer RPCs above.
    IF OLD.owner_user_id IS NOT NULL AND OLD.owner_user_id = auth.uid() THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Ownership can only be assigned through the claim or transfer flow';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function: not reachable as an RPC.
REVOKE ALL ON FUNCTION public.enforce_business_owner_transfer() FROM public, anon, authenticated;

-- ===========================================================================
-- 7. INTERNAL HELPER: grant the owner seat (never touches tier fields)
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.grant_business_owner(p_business_id uuid, p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow the owner-transfer trigger to accept this controlled change.
  PERFORM set_config('app.allow_owner_claim', '1', true);

  UPDATE public.businesses
     SET owner_user_id = p_user,
         updated_at = now()
   WHERE id = p_business_id;

  -- Mirror the owner into business_staff (keeps any existing manager rows).
  INSERT INTO public.business_staff (business_id, user_id, role)
  VALUES (p_business_id, p_user, 'owner')
  ON CONFLICT (business_id, user_id)
  DO UPDATE SET role = 'owner', updated_at = now();
END;
$$;

-- Internal only: callable from the SECURITY DEFINER RPCs below, not by clients.
REVOKE ALL ON FUNCTION public.grant_business_owner(uuid, uuid) FROM public, anon, authenticated;

-- ===========================================================================
-- 8. DUPLICATE-MATCH LOOKUP HELPER
--
-- Read-only. SECURITY DEFINER so onboarding can surface a matching business the
-- user can't otherwise see (e.g. status='pending' / owned by someone else).
-- Matches on normalized name; street is an optional refinement.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.find_duplicate_business(p_name text, p_street text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  address text,
  street_address text,
  has_owner boolean,
  has_manager boolean,
  status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id,
         b.name,
         b.address,
         loc.street_address,
         (b.owner_user_id IS NOT NULL) AS has_owner,
         EXISTS (
           SELECT 1 FROM public.business_staff s
           WHERE s.business_id = b.id AND s.role = 'manager'
         ) AS has_manager,
         b.status
  FROM public.businesses b
  LEFT JOIN LATERAL (
    SELECT l.street_address
    FROM public.business_locations l
    WHERE l.business_id = b.id
    ORDER BY l.is_primary DESC NULLS LAST
    LIMIT 1
  ) loc ON true
  WHERE p_name IS NOT NULL
    AND btrim(p_name) <> ''
    AND lower(btrim(b.name)) = lower(btrim(p_name))
    AND (
      p_street IS NULL
      OR btrim(p_street) = ''
      OR lower(btrim(coalesce(loc.street_address, ''))) = lower(btrim(p_street))
      OR lower(btrim(coalesce(b.address, ''))) LIKE lower(btrim(p_street)) || '%'
    );
$$;

REVOKE ALL ON FUNCTION public.find_duplicate_business(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.find_duplicate_business(text, text) TO authenticated;

-- ===========================================================================
-- 9. PERMISSIONS HELPER: a user's effective role on a business
--
-- Platform admins resolve to 'admin' (owner/admin powers). The business owner
-- (via owner_user_id) resolves to 'owner'. Otherwise the highest-ranked
-- business_staff role for that user, or NULL.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.effective_business_role(
  p_business_id uuid,
  p_user uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_user IS NULL THEN NULL
    WHEN EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = p_business_id AND b.owner_user_id = p_user
    ) THEN 'owner'
    WHEN public.is_platform_admin(p_user) THEN 'admin'
    ELSE (
      SELECT s.role
      FROM public.business_staff s
      WHERE s.business_id = p_business_id AND s.user_id = p_user
      ORDER BY public.business_role_rank(s.role) DESC
      LIMIT 1
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.effective_business_role(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.effective_business_role(uuid, uuid) TO authenticated;

-- ===========================================================================
-- 10. MANAGER-FIRST CREATION
--
-- Creates a business with an EMPTY owner seat and attaches the caller as
-- 'manager'. Goes through SECURITY DEFINER because the businesses INSERT policy
-- requires owner_user_id = auth.uid(), which we deliberately leave NULL here.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.create_managed_business(
  p_name text,
  p_description text DEFAULT NULL,
  p_category_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Business name is required';
  END IF;

  INSERT INTO public.businesses (name, description, category_id, owner_user_id, status, onboarding_step, onboarding_completed)
  VALUES (btrim(p_name), p_description, p_category_id, NULL, 'pending', 1, false)
  RETURNING id INTO v_id;

  INSERT INTO public.business_staff (business_id, user_id, role)
  VALUES (v_id, auth.uid(), 'manager');

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_managed_business(text, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.create_managed_business(text, text, uuid) TO authenticated;

-- ===========================================================================
-- 11. OWNER CLAIM
--
-- Claims the owner seat of a business that currently has none.
--   * email_domain: if the caller's email domain matches the business website
--     domain AND no manager is in place, ownership is granted immediately and
--     the business is marked verified.
--   * otherwise a pending_claims row is opened. If a manager already holds the
--     business, resolution requires that manager OR a platform admin; if not,
--     admin approval.
-- A manager that already holds the business keeps its manager role; the owner
-- simply outranks it. Tier/founding fields are never touched.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.claim_ownership(
  p_business_id uuid,
  p_verification_method text DEFAULT 'manual_confirmation'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_website text;
  v_email text;
  v_site_domain text;
  v_email_domain text;
  v_has_manager boolean;
  v_auto boolean := false;
  v_claim_id uuid;
  v_method text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT owner_user_id, website INTO v_owner, v_website
  FROM public.businesses WHERE id = p_business_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  IF v_owner IS NOT NULL THEN
    IF v_owner = auth.uid() THEN
      RETURN jsonb_build_object('status', 'already_owner', 'business_id', p_business_id);
    END IF;
    RAISE EXCEPTION 'This business already has an owner. Use ownership transfer instead.';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  v_has_manager := EXISTS (
    SELECT 1 FROM public.business_staff s
    WHERE s.business_id = p_business_id AND s.role = 'manager'
  );

  -- Email-domain verification against the saved website.
  IF p_verification_method = 'email_domain'
     AND v_website IS NOT NULL AND v_email IS NOT NULL THEN
    v_site_domain := lower(regexp_replace(v_website, '^https?://(www\.)?', ''));
    v_site_domain := split_part(v_site_domain, '/', 1);
    v_email_domain := lower(split_part(v_email, '@', 2));
    IF v_site_domain <> '' AND v_email_domain = v_site_domain THEN
      v_auto := true;
    END IF;
  END IF;

  -- Auto-grant only when domain-verified AND no manager is already in place.
  IF v_auto AND NOT v_has_manager THEN
    PERFORM public.grant_business_owner(p_business_id, auth.uid());
    UPDATE public.businesses
       SET verified = true,
           ownership_review_status = 'approved'
     WHERE id = p_business_id;

    INSERT INTO public.pending_claims
      (business_id, claimant_user_id, claimed_role, verification_method, status, resolved_at, resolved_by)
    VALUES
      (p_business_id, auth.uid(), 'owner', 'email_domain', 'approved', now(), auth.uid());

    RETURN jsonb_build_object('status', 'approved', 'auto', true, 'business_id', p_business_id);
  END IF;

  -- Otherwise open a pending claim.
  v_method := CASE
    WHEN v_has_manager THEN 'manager_approval'
    WHEN p_verification_method = 'email_domain' THEN 'admin_approval'
    ELSE p_verification_method
  END;

  INSERT INTO public.pending_claims
    (business_id, claimant_user_id, claimed_role, verification_method, status)
  VALUES
    (p_business_id, auth.uid(), 'owner', v_method, 'pending')
  ON CONFLICT (business_id, claimant_user_id) WHERE status = 'pending'
  DO UPDATE SET verification_method = EXCLUDED.verification_method
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object(
    'status', 'pending',
    'claim_id', v_claim_id,
    'business_id', p_business_id,
    'requires', CASE WHEN v_has_manager THEN 'manager_or_admin_approval' ELSE 'admin_approval' END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_ownership(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_ownership(uuid, text) TO authenticated;

-- ===========================================================================
-- 12. APPROVE / REJECT A CLAIM
--
-- Resolvable by a platform admin, the existing manager of the business, or the
-- current owner. Approving an owner claim grants the owner seat atomically; an
-- existing manager keeps its manager role.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.approve_claim(
  p_claim_id uuid,
  p_approve boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.pending_claims%ROWTYPE;
  v_owner uuid;
  v_is_manager boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO c FROM public.pending_claims WHERE id = p_claim_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;
  IF c.status <> 'pending' THEN
    RAISE EXCEPTION 'Claim has already been resolved';
  END IF;

  SELECT owner_user_id INTO v_owner FROM public.businesses WHERE id = c.business_id;
  v_is_manager := EXISTS (
    SELECT 1 FROM public.business_staff s
    WHERE s.business_id = c.business_id AND s.user_id = auth.uid() AND s.role = 'manager'
  );

  IF NOT (
    public.is_platform_admin(auth.uid())
    OR v_is_manager
    OR (v_owner IS NOT NULL AND v_owner = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Only an existing manager, the owner, or a platform admin can resolve this claim';
  END IF;

  IF p_approve THEN
    IF c.claimed_role = 'owner' THEN
      IF v_owner IS NOT NULL THEN
        RAISE EXCEPTION 'Business already has an owner';
      END IF;
      PERFORM public.grant_business_owner(c.business_id, c.claimant_user_id);
    ELSE
      INSERT INTO public.business_staff (business_id, user_id, role)
      VALUES (c.business_id, c.claimant_user_id, c.claimed_role)
      ON CONFLICT (business_id, user_id)
      DO UPDATE SET role = EXCLUDED.role, updated_at = now();
    END IF;

    UPDATE public.pending_claims
       SET status = 'approved', resolved_at = now(), resolved_by = auth.uid()
     WHERE id = p_claim_id;

    RETURN jsonb_build_object('status', 'approved', 'business_id', c.business_id);
  ELSE
    UPDATE public.pending_claims
       SET status = 'rejected', resolved_at = now(), resolved_by = auth.uid()
     WHERE id = p_claim_id;

    RETURN jsonb_build_object('status', 'rejected', 'business_id', c.business_id);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_claim(uuid, boolean) FROM public;
GRANT EXECUTE ON FUNCTION public.approve_claim(uuid, boolean) TO authenticated;

-- ===========================================================================
-- 13. OWNERSHIP TRANSFER
--
-- Moves the owner seat to another user. Only the current owner or a platform
-- admin may call it. The previous owner is demoted to 'manager' (keeps access).
-- Tier/founding fields are left untouched.
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.transfer_ownership(
  p_business_id uuid,
  p_new_owner_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_new_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'A new owner is required';
  END IF;

  SELECT owner_user_id INTO v_old FROM public.businesses WHERE id = p_business_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business not found';
  END IF;

  IF NOT (
    (v_old IS NOT NULL AND v_old = auth.uid())
    OR public.is_platform_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Only the current owner or a platform admin can transfer ownership';
  END IF;

  -- Demote the previous owner's staff row first so the single-owner index holds.
  IF v_old IS NOT NULL THEN
    UPDATE public.business_staff
       SET role = 'manager', updated_at = now()
     WHERE business_id = p_business_id AND user_id = v_old AND role = 'owner';
  END IF;

  PERFORM public.grant_business_owner(p_business_id, p_new_owner_user_id);

  RETURN jsonb_build_object('status', 'transferred', 'business_id', p_business_id, 'new_owner', p_new_owner_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.transfer_ownership(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.transfer_ownership(uuid, uuid) TO authenticated;
