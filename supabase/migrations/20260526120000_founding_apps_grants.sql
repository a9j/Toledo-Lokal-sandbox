-- Bug fix: Founding 5 application submissions fail with a generic error.
--
-- The founding_5_applications table + RLS policies are defined in
-- 20260526000000_founding_5_schema.sql, but an RLS "INSERT" policy only takes
-- effect once the role also holds the table-level INSERT privilege. Applicants
-- submit while signed out (the anon role), so without an explicit GRANT the
-- insert is rejected before RLS is even evaluated ("permission denied for
-- table founding_5_applications"). This makes the grants explicit and
-- re-asserts the anon insert policy so the public form works.

DO $$ BEGIN
  CREATE TYPE public.founding_5_category AS ENUM
    ('morning', 'evening', 'retail', 'experience', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.founding_5_applications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  owner_name    text NOT NULL,
  email         text NOT NULL,
  phone         text,
  neighborhood  text,
  category      public.founding_5_category,
  why_us        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founding_5_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a founding 5 application" ON public.founding_5_applications;
CREATE POLICY "Anyone can submit a founding 5 application"
  ON public.founding_5_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage founding 5 applications" ON public.founding_5_applications;
CREATE POLICY "Admins manage founding 5 applications"
  ON public.founding_5_applications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table-level privileges. RLS still restricts which rows each role can touch.
GRANT INSERT ON public.founding_5_applications TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.founding_5_applications TO authenticated;
