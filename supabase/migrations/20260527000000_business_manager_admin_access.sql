-- Business "admin" (manager) access
--
-- Additional users are attached to a business via public.business_staff with
-- role in ('owner','staff','manager'). The invite UI exposes two of these:
-- "Staff (Scanner only)" => 'staff', and "Manager" => 'manager'. Until now a
-- manager could not load or edit the business page because every relevant RLS
-- policy checked owner_user_id only.
--
-- This migration gives role='manager' the same READ/UPDATE access an owner has
-- on the business and its child data, WITHOUT the owner-only powers:
--   * deleting the business
--   * transferring ownership (changing owner_user_id)
--   * adding/removing staff (business_staff / business_invitations stay owner-only)
-- Scanner-only staff (role='staff') are unaffected.

-- Manager check. SECURITY DEFINER and only reads business_staff, so it is safe
-- to call from the businesses table's own RLS policies without recursing onto
-- businesses.
CREATE OR REPLACE FUNCTION public.is_business_manager(_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_staff
    WHERE business_id = _business_id
      AND user_id = auth.uid()
      AND role = 'manager'
  );
$$;

-- ── businesses: managers can read + update (no insert, no delete) ──
CREATE POLICY "Managers can view managed business"
  ON public.businesses FOR SELECT TO authenticated
  USING (public.is_business_manager(id));

CREATE POLICY "Managers can update managed business"
  ON public.businesses FOR UPDATE TO authenticated
  USING (public.is_business_manager(id))
  WITH CHECK (public.is_business_manager(id));

-- Ownership transfer stays owner-only. An UPDATE policy's WITH CHECK can't
-- compare OLD vs NEW, so enforce it with a trigger: only the current owner (or a
-- platform admin) may change owner_user_id.
CREATE OR REPLACE FUNCTION public.enforce_business_owner_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id THEN
    IF NOT (OLD.owner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Only the business owner can transfer ownership';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_enforce_owner_transfer ON public.businesses;
CREATE TRIGGER businesses_enforce_owner_transfer
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_business_owner_transfer();

-- ── child tables: managers get the same access owners already have ──
CREATE POLICY "Managers can manage deals"
  ON public.deals FOR ALL TO authenticated
  USING (public.is_business_manager(business_id))
  WITH CHECK (public.is_business_manager(business_id));

CREATE POLICY "Managers can manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.is_business_manager(business_id))
  WITH CHECK (public.is_business_manager(business_id));

CREATE POLICY "Managers can manage leads"
  ON public.leads FOR ALL TO authenticated
  USING (public.is_business_manager(business_id))
  WITH CHECK (public.is_business_manager(business_id));

CREATE POLICY "Managers can manage loop settings"
  ON public.business_loop_settings FOR ALL TO authenticated
  USING (public.is_business_manager(business_id))
  WITH CHECK (public.is_business_manager(business_id));

CREATE POLICY "Managers can manage features"
  ON public.business_features FOR ALL TO authenticated
  USING (public.is_business_manager(business_id))
  WITH CHECK (public.is_business_manager(business_id));

CREATE POLICY "Managers can manage QR codes"
  ON public.loop_qr_codes FOR ALL TO authenticated
  USING (public.is_business_manager(business_id))
  WITH CHECK (public.is_business_manager(business_id));

CREATE POLICY "Managers can manage rewards"
  ON public.loop_rewards FOR ALL TO authenticated
  USING (public.is_business_manager(business_id))
  WITH CHECK (public.is_business_manager(business_id));

CREATE POLICY "Managers can manage QR scans"
  ON public.loop_qr_scans FOR ALL TO authenticated
  USING (qr_code_id IN (SELECT id FROM public.loop_qr_codes WHERE public.is_business_manager(business_id)))
  WITH CHECK (qr_code_id IN (SELECT id FROM public.loop_qr_codes WHERE public.is_business_manager(business_id)));

-- Note: business_locations already grants any business_staff member full access
-- via the existing "Staff can manage locations" policy, so managers are covered.
-- subscriptions, boosts, business_staff and business_invitations intentionally
-- remain owner-only (billing + staff administration are owner powers).
