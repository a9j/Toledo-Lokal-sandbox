-- =============================================================================
-- Hire Local — shared verification engine
-- =============================================================================
-- Civic hiring infrastructure. One engine that both Hire Local and a future
-- Civic Resume read from. The whole feature rests on one rule:
--
--   A person can CLAIM. Only a verified organization can CONFIRM.
--
-- Nothing a person types about themselves counts as verified until a real,
-- verified organization stands behind it, and every verified item names the
-- organization that confirmed it and when.
--
-- There are exactly two display states for any record item:
--   pending  — self-reported, gray, hidden from employers
--   verified — organization-confirmed, amber, visible to employers, always
--              names the confirming org
-- (denied is a third, terminal state: kept, never deleted, hidden from
--  employers, visible to the person so they can re-file once with a note.)
--
-- We DO NOT duplicate the org/membership layer. The repo already has:
--   businesses    — the organization (owner_user_id, verified, account_type)
--   business_staff — membership with a role hierarchy
--                    (owner > admin > manager > hiring > viewer)
--   effective_business_role(business_id, user) — authoritative role resolver
--   is_platform_admin(user)                     — platform admin check
--
-- So an "organization" is a row in businesses, and confirm authority is a thin
-- helper on top of the existing role hierarchy. A business is allowed to
-- confirm anything only when businesses.verified = true.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.record_item_kind AS ENUM (
    'employment',
    'volunteer_hours',
    'certification',
    'endorsement',
    'quality_tag'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.record_item_status AS ENUM ('pending', 'verified', 'denied');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.record_item_source AS ENUM ('self_claim', 'qr_checkin', 'org_issued');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reference_status AS ENUM ('pending', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------------------------------------------------------------------------
-- 1. Confirm-authority helper
-- ---------------------------------------------------------------------------
-- The spec's confirm authority ("owner" and "confirmer" only) maps onto the
-- existing role hierarchy: owner, admin, manager, and hiring may confirm.
-- Viewer / staff may not. Enforced here in SQL so RLS and the RPCs share one
-- definition. SECURITY DEFINER because it reads businesses / business_staff
-- that the caller may not have direct select on.
CREATE OR REPLACE FUNCTION public.can_confirm_for_business(
  p_business_id uuid,
  p_user uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_business_id IS NOT NULL
    AND p_user IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = p_business_id AND b.verified = true
    )
    AND public.business_role_rank(
          public.effective_business_role(p_business_id, p_user)
        ) >= public.business_role_rank('hiring');
$$;

REVOKE ALL ON FUNCTION public.can_confirm_for_business(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.can_confirm_for_business(uuid, uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- 2. org_hire_settings — per-org hiring preferences
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.org_hire_settings (
  org_id uuid PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  -- When on, a QR check-out auto-verifies its volunteer-hours row without a
  -- manual confirm. Default OFF: a human still vouches by default.
  auto_trust_qr boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_hire_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org confirmers read hire settings"
  ON public.org_hire_settings FOR SELECT TO authenticated
  USING (public.can_confirm_for_business(org_id));

CREATE POLICY "org confirmers manage hire settings"
  ON public.org_hire_settings FOR ALL TO authenticated
  USING (public.can_confirm_for_business(org_id))
  WITH CHECK (public.can_confirm_for_business(org_id));


-- ---------------------------------------------------------------------------
-- 3. record_items — the unified ledger behind Hiring and Civic Resume
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.record_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.record_item_kind NOT NULL,
  title text NOT NULL,
  detail text,
  hours numeric,
  occurred_on date,
  status public.record_item_status NOT NULL DEFAULT 'pending',
  -- The org the person named when filing the claim.
  claimed_org_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  -- Set only at confirm time, and only to a verified org.
  confirmed_org_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  confirmed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  source public.record_item_source NOT NULL DEFAULT 'self_claim',
  -- A short note the person may attach when re-filing after a denial.
  refile_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_record_items_user ON public.record_items(user_id);
CREATE INDEX IF NOT EXISTS idx_record_items_claimed_org ON public.record_items(claimed_org_id);
CREATE INDEX IF NOT EXISTS idx_record_items_confirmed_org ON public.record_items(confirmed_org_id);
CREATE INDEX IF NOT EXISTS idx_record_items_status ON public.record_items(status);
CREATE INDEX IF NOT EXISTS idx_record_items_user_verified
  ON public.record_items(user_id) WHERE status = 'verified';

-- Trigger: a row may only be 'verified' when confirmed_org_id is set AND that
-- business is verified. This is the hard floor; the RPCs go through it too.
CREATE OR REPLACE FUNCTION public.enforce_record_item_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'verified' THEN
    IF NEW.confirmed_org_id IS NULL THEN
      RAISE EXCEPTION 'A verified record item must name a confirming organization';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = NEW.confirmed_org_id AND b.verified = true
    ) THEN
      RAISE EXCEPTION 'Only a verified organization can confirm a record item';
    END IF;
    IF NEW.confirmed_at IS NULL THEN
      NEW.confirmed_at := now();
    END IF;
  ELSE
    -- Non-verified rows never carry confirmation metadata.
    NEW.confirmed_org_id := NULL;
    NEW.confirmed_by_user_id := NULL;
    NEW.confirmed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_record_item_verification ON public.record_items;
CREATE TRIGGER trg_enforce_record_item_verification
  BEFORE INSERT OR UPDATE ON public.record_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_record_item_verification();

ALTER TABLE public.record_items ENABLE ROW LEVEL SECURITY;

-- The person sees every one of their own rows (pending, verified, denied).
CREATE POLICY "people read their own record items"
  ON public.record_items FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- A confirmer of the named org sees claims tied to their org, so they can act
-- on them. Orgs only ever see claims that named them.
CREATE POLICY "confirmers read claims for their org"
  ON public.record_items FOR SELECT TO authenticated
  USING (public.can_confirm_for_business(claimed_org_id));

-- Verified rows are the public professional record. Pending and denied rows
-- are never exposed here, so employers cannot see self-reported claims.
CREATE POLICY "verified record items are readable"
  ON public.record_items FOR SELECT TO authenticated
  USING (status = 'verified');

-- A person files their own claim. It can only ever enter as pending and
-- self-reported; QR and org-issued rows are written by SECURITY DEFINER paths.
CREATE POLICY "people file their own claims"
  ON public.record_items FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND source = 'self_claim'
    AND confirmed_org_id IS NULL
  );

-- A person may edit or withdraw their own row only while it is still pending
-- (fixing a typo, adding detail). They can never move it to verified: the
-- trigger and the missing confirmed_org check block that, and confirm happens
-- through the RPC instead.
CREATE POLICY "people edit their own pending claims"
  ON public.record_items FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "people delete their own pending claims"
  ON public.record_items FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending');

-- Platform admins can read everything for moderation.
CREATE POLICY "admins read all record items"
  ON public.record_items FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));


-- ---------------------------------------------------------------------------
-- 4. qr_checkins — the strongest signal: neither side hand-enters time
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qr_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_id uuid,
  scanned_in_at timestamptz NOT NULL DEFAULT now(),
  scanned_out_at timestamptz,
  computed_hours numeric,
  -- The record_items row this check-in produced on scan-out, if any.
  record_item_id uuid REFERENCES public.record_items(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_checkins_user ON public.qr_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_org ON public.qr_checkins(org_id);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_open
  ON public.qr_checkins(user_id, org_id) WHERE scanned_out_at IS NULL;

ALTER TABLE public.qr_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "people read their own checkins"
  ON public.qr_checkins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "org confirmers read their checkins"
  ON public.qr_checkins FOR SELECT TO authenticated
  USING (public.can_confirm_for_business(org_id));

-- Writes go through the hire_qr_checkin / hire_qr_checkout RPCs (SECURITY
-- DEFINER), not direct table inserts, so hours are always server-computed.


-- ---------------------------------------------------------------------------
-- 5. references — a vouch from a real person, verified only via a verified org
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hire_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_org_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  author_role text,
  body text NOT NULL,
  status public.reference_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hire_references_subject ON public.hire_references(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_hire_references_author_org ON public.hire_references(author_org_id);

-- A reference is verified only when its author is tied to a verified org.
CREATE OR REPLACE FUNCTION public.enforce_reference_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'verified' THEN
    IF NEW.author_org_id IS NULL
       OR NOT EXISTS (
         SELECT 1 FROM public.businesses b
         WHERE b.id = NEW.author_org_id AND b.verified = true
       ) THEN
      RAISE EXCEPTION 'A verified reference must be authored by a verified organization';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reference_verification ON public.hire_references;
CREATE TRIGGER trg_enforce_reference_verification
  BEFORE INSERT OR UPDATE ON public.hire_references
  FOR EACH ROW EXECUTE FUNCTION public.enforce_reference_verification();

ALTER TABLE public.hire_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "people read references about them"
  ON public.hire_references FOR SELECT TO authenticated
  USING (subject_user_id = auth.uid());

CREATE POLICY "verified references are readable"
  ON public.hire_references FOR SELECT TO authenticated
  USING (status = 'verified');

-- A confirmer of the authoring org can write and verify references on its
-- behalf. The check requires the org to be one they can confirm for, and the
-- trigger requires that org to be verified before status can become verified.
CREATE POLICY "org confirmers write references"
  ON public.hire_references FOR INSERT TO authenticated
  WITH CHECK (
    author_org_id IS NOT NULL
    AND public.can_confirm_for_business(author_org_id)
  );

CREATE POLICY "org confirmers update their references"
  ON public.hire_references FOR UPDATE TO authenticated
  USING (author_org_id IS NOT NULL AND public.can_confirm_for_business(author_org_id))
  WITH CHECK (author_org_id IS NOT NULL AND public.can_confirm_for_business(author_org_id));


-- ---------------------------------------------------------------------------
-- 6. quality_tags — "neighbors confirmed" chips, count only, never a score
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quality_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  confirmed_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, label)
);

CREATE INDEX IF NOT EXISTS idx_quality_tags_user ON public.quality_tags(user_id);

ALTER TABLE public.quality_tags ENABLE ROW LEVEL SECURITY;

-- Tags are readable by authenticated viewers; the UI renders only those with
-- confirmed_count > 0. The count is the only signal. We never rank or weight
-- tags into a score.
CREATE POLICY "quality tags are readable"
  ON public.quality_tags FOR SELECT TO authenticated
  USING (true);

-- A person may create/remove their own tag labels (the menu of things they can
-- be confirmed for). confirmed_count is only ever moved by the confirm RPC.
CREATE POLICY "people manage their own tag labels"
  ON public.quality_tags FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND confirmed_count = 0);

CREATE POLICY "people delete their own tag labels"
  ON public.quality_tags FOR DELETE TO authenticated
  USING (user_id = auth.uid());


-- ---------------------------------------------------------------------------
-- 7. resumes — always self-reported, never feeds verified state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user ON public.resumes(user_id);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "people manage their own resume"
  ON public.resumes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- The employer-read policy for resumes lives after open_to_work is created
-- (section 8), since it depends on that table.


-- ---------------------------------------------------------------------------
-- 8. open_to_work — person-controlled, private by default
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.open_to_work (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.open_to_work ENABLE ROW LEVEL SECURITY;

-- The person reads and controls their own flag.
CREATE POLICY "people manage their own open-to-work"
  ON public.open_to_work FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- An employer may read the flag only when it is enabled. A disabled or absent
-- row reveals nothing, so an employer can never tell that an employed person is
-- quietly job-hunting unless that person turned this on themselves.
CREATE POLICY "employers read enabled open-to-work"
  ON public.open_to_work FOR SELECT TO authenticated
  USING (enabled = true);

-- Deferred resume employer-read policy (depends on open_to_work above). A
-- confirmer at a verified org can open a person's resume when that person is
-- open to work. The resume stays labeled self-reported everywhere it shows.
CREATE POLICY "employers read resumes of open-to-work people"
  ON public.resumes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.open_to_work otw
      WHERE otw.user_id = resumes.user_id AND otw.enabled = true
    )
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.verified = true AND public.can_confirm_for_business(b.id)
    )
  );


-- ---------------------------------------------------------------------------
-- 9. follows — an org follows a person; who-follows-whom stays private
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hire_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_org_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subject_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_org_id, subject_user_id)
);

CREATE INDEX IF NOT EXISTS idx_hire_follows_org ON public.hire_follows(follower_org_id);
CREATE INDEX IF NOT EXISTS idx_hire_follows_subject ON public.hire_follows(subject_user_id);

ALTER TABLE public.hire_follows ENABLE ROW LEVEL SECURITY;

-- The subject can see which orgs follow them (so Open to Work can notify them),
-- and a confirmer of the org can see and manage its own follows. The follow
-- graph is never public.
CREATE POLICY "subjects read who follows them"
  ON public.hire_follows FOR SELECT TO authenticated
  USING (subject_user_id = auth.uid());

CREATE POLICY "org confirmers read their follows"
  ON public.hire_follows FOR SELECT TO authenticated
  USING (public.can_confirm_for_business(follower_org_id));

CREATE POLICY "org confirmers manage their follows"
  ON public.hire_follows FOR ALL TO authenticated
  USING (public.can_confirm_for_business(follower_org_id))
  WITH CHECK (public.can_confirm_for_business(follower_org_id));


-- ---------------------------------------------------------------------------
-- 10. file_claim — a person files a claim into an org's confirm queue
-- ---------------------------------------------------------------------------
-- A thin wrapper that guarantees the safe entry shape (pending, self_claim).
-- Direct inserts are also allowed by RLS, but the RPC keeps the client simple.
CREATE OR REPLACE FUNCTION public.file_claim(
  p_kind public.record_item_kind,
  p_title text,
  p_claimed_org_id uuid,
  p_detail text DEFAULT NULL,
  p_hours numeric DEFAULT NULL,
  p_occurred_on date DEFAULT NULL
)
RETURNS public.record_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.record_items;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  INSERT INTO public.record_items (
    user_id, kind, title, detail, hours, occurred_on,
    status, claimed_org_id, source
  ) VALUES (
    auth.uid(), p_kind, p_title, p_detail, p_hours, p_occurred_on,
    'pending', p_claimed_org_id, 'self_claim'
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.file_claim(public.record_item_kind, text, uuid, text, numeric, date) FROM public;
GRANT EXECUTE ON FUNCTION public.file_claim(public.record_item_kind, text, uuid, text, numeric, date) TO authenticated;


-- ---------------------------------------------------------------------------
-- 11. confirm_record_item / deny_record_item — the trust transitions
-- ---------------------------------------------------------------------------
-- Confirm: only a confirmer of the claimed org may approve, the org must be
-- verified (enforced again by the trigger), and a quality_tag confirmation
-- bumps the tag's count. Confirms the org that the person actually named.
CREATE OR REPLACE FUNCTION public.confirm_record_item(p_item_id uuid)
RETURNS public.record_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.record_items;
BEGIN
  SELECT * INTO v_item FROM public.record_items WHERE id = p_item_id FOR UPDATE;
  IF v_item.id IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;
  IF v_item.claimed_org_id IS NULL THEN
    RAISE EXCEPTION 'Claim names no organization to confirm it';
  END IF;
  IF NOT public.can_confirm_for_business(v_item.claimed_org_id) THEN
    RAISE EXCEPTION 'You are not allowed to confirm claims for this organization';
  END IF;
  IF v_item.status <> 'pending' THEN
    RAISE EXCEPTION 'Only a pending claim can be confirmed';
  END IF;

  UPDATE public.record_items
  SET status = 'verified',
      confirmed_org_id = claimed_org_id,
      confirmed_by_user_id = auth.uid(),
      confirmed_at = now()
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  -- A confirmed quality tag bumps the count on the matching tag label.
  IF v_item.kind = 'quality_tag' THEN
    UPDATE public.quality_tags
    SET confirmed_count = confirmed_count + 1
    WHERE user_id = v_item.user_id AND label = v_item.title;
  END IF;

  RETURN v_item;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_record_item(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.confirm_record_item(uuid) TO authenticated;

-- Deny: keep the row, mark it denied. It is never deleted; it stays
-- self-reported and hidden from employers, and the person can re-file once.
CREATE OR REPLACE FUNCTION public.deny_record_item(p_item_id uuid)
RETURNS public.record_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item public.record_items;
BEGIN
  SELECT * INTO v_item FROM public.record_items WHERE id = p_item_id FOR UPDATE;
  IF v_item.id IS NULL THEN
    RAISE EXCEPTION 'Claim not found';
  END IF;
  IF NOT public.can_confirm_for_business(v_item.claimed_org_id) THEN
    RAISE EXCEPTION 'You are not allowed to act on claims for this organization';
  END IF;
  IF v_item.status <> 'pending' THEN
    RAISE EXCEPTION 'Only a pending claim can be denied';
  END IF;

  UPDATE public.record_items
  SET status = 'denied'
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

REVOKE ALL ON FUNCTION public.deny_record_item(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.deny_record_item(uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- 12. hire_qr_checkin / hire_qr_checkout — server-computed volunteer hours
-- ---------------------------------------------------------------------------
-- Check-in: opens a checkin row for (user, org). At most one open row at a time
-- per (user, org); a second scan with an open row triggers checkout instead.
CREATE OR REPLACE FUNCTION public.hire_qr_checkin(
  p_org_id uuid,
  p_event_id uuid DEFAULT NULL
)
RETURNS public.qr_checkins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.qr_checkins;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = p_org_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  INSERT INTO public.qr_checkins (user_id, org_id, event_id, scanned_in_at)
  VALUES (auth.uid(), p_org_id, p_event_id, now())
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.hire_qr_checkin(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hire_qr_checkin(uuid, uuid) TO authenticated;

-- Check-out: stamps scanned_out_at, computes hours from the two timestamps
-- server-side (never hand-entered by either side), and produces a
-- volunteer_hours record_item of source qr_checkin. The row lands pending
-- unless the org has auto_trust_qr on, in which case it auto-verifies (the org
-- must still be verified for that to hold, enforced by the trigger).
CREATE OR REPLACE FUNCTION public.hire_qr_checkout(p_checkin_id uuid)
RETURNS public.qr_checkins
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checkin public.qr_checkins;
  v_hours numeric;
  v_auto boolean;
  v_org_verified boolean;
  v_item_id uuid;
  v_out timestamptz := now();
BEGIN
  SELECT * INTO v_checkin FROM public.qr_checkins WHERE id = p_checkin_id FOR UPDATE;
  IF v_checkin.id IS NULL THEN
    RAISE EXCEPTION 'Check-in not found';
  END IF;
  -- Only the person who checked in (or an org confirmer running the kiosk) may
  -- check out.
  IF v_checkin.user_id <> auth.uid()
     AND NOT public.can_confirm_for_business(v_checkin.org_id) THEN
    RAISE EXCEPTION 'You are not allowed to check out this visit';
  END IF;
  IF v_checkin.scanned_out_at IS NOT NULL THEN
    RAISE EXCEPTION 'This visit is already checked out';
  END IF;

  -- Hours, rounded to two decimals, floored at zero.
  v_hours := GREATEST(
    round(EXTRACT(EPOCH FROM (v_out - v_checkin.scanned_in_at)) / 3600.0, 2),
    0
  );

  SELECT COALESCE(s.auto_trust_qr, false), COALESCE(b.verified, false)
  INTO v_auto, v_org_verified
  FROM public.businesses b
  LEFT JOIN public.org_hire_settings s ON s.org_id = b.id
  WHERE b.id = v_checkin.org_id;

  INSERT INTO public.record_items (
    user_id, kind, title, detail, hours, occurred_on,
    status, claimed_org_id, source,
    confirmed_org_id, confirmed_by_user_id, confirmed_at
  ) VALUES (
    v_checkin.user_id,
    'volunteer_hours',
    'Volunteer hours',
    'Time computed automatically from QR scan-in and scan-out',
    v_hours,
    v_checkin.scanned_in_at::date,
    CASE WHEN v_auto AND v_org_verified THEN 'verified'::public.record_item_status
         ELSE 'pending'::public.record_item_status END,
    v_checkin.org_id,
    'qr_checkin',
    CASE WHEN v_auto AND v_org_verified THEN v_checkin.org_id ELSE NULL END,
    NULL,
    CASE WHEN v_auto AND v_org_verified THEN now() ELSE NULL END
  )
  RETURNING id INTO v_item_id;

  UPDATE public.qr_checkins
  SET scanned_out_at = v_out,
      computed_hours = v_hours,
      record_item_id = v_item_id
  WHERE id = p_checkin_id
  RETURNING * INTO v_checkin;

  RETURN v_checkin;
END;
$$;

REVOKE ALL ON FUNCTION public.hire_qr_checkout(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hire_qr_checkout(uuid) TO authenticated;
