-- Circles Phase 1: Seed the two founding Circles
-- Run AFTER setting your profile to is_admin = true.
-- The created_by and circle_members rows use the admin's auth user id.
-- Replace the placeholder below with your actual auth.users id if running manually.

-- This uses a DO block so it can reference the admin dynamically.
DO $$
DECLARE
  admin_uid uuid;
  beta_id uuid;
  synergy_id uuid;
BEGIN
  -- Find the admin user (must have is_admin = true on profiles)
  SELECT user_id INTO admin_uid
    FROM public.profiles
    WHERE is_admin = true
    LIMIT 1;

  IF admin_uid IS NULL THEN
    RAISE EXCEPTION 'No admin found. Set is_admin = true on your profile first.';
  END IF;

  -- Insert Beta 100
  INSERT INTO public.circles (slug, name, description, icon, member_cap, created_by)
  VALUES (
    'beta-100',
    'Beta 100',
    'The first hundred people testing and shaping Toledo Lokal. You were invited by an admin.',
    NULL,
    100,
    admin_uid
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO beta_id;

  -- Insert Synergy Circle
  INSERT INTO public.circles (slug, name, description, icon, member_cap, created_by)
  VALUES (
    'synergy',
    'Synergy Circle',
    'A trusted, non-partisan room for Toledo''s founders, owners, and organizers. Invite only.',
    NULL,
    NULL,
    admin_uid
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO synergy_id;

  -- Add admin as member of both (with admin role at circle level)
  IF beta_id IS NOT NULL THEN
    INSERT INTO public.circle_members (circle_id, user_id, role)
    VALUES (beta_id, admin_uid, 'admin')
    ON CONFLICT (circle_id, user_id) DO NOTHING;
  END IF;

  IF synergy_id IS NOT NULL THEN
    INSERT INTO public.circle_members (circle_id, user_id, role)
    VALUES (synergy_id, admin_uid, 'admin')
    ON CONFLICT (circle_id, user_id) DO NOTHING;
  END IF;
END;
$$;
