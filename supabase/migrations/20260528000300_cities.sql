-- White-label foundation: a registry of city tenants with per-city branding.
-- Data-level scoping (city_id on content + scoped RLS) layers on later; this
-- establishes the tenant registry the platform reads its identity from.

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  region text,
  tagline text,
  primary_color text DEFAULT '#3B82F6',
  accent_color text DEFAULT '#D4A853',
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cities" ON public.cities
  FOR SELECT USING (is_active = true OR public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins manage cities" ON public.cities
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Seed the launch city.
INSERT INTO public.cities (slug, name, region, tagline)
VALUES ('toledo', 'Toledo', 'OH', 'The Glass City')
ON CONFLICT (slug) DO NOTHING;
