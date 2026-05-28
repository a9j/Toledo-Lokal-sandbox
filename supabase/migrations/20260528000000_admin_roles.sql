-- Platform/admin roles for the city OS. Business owner/staff are modeled via
-- business_staff; event organizers + nonprofits already have roles. These add
-- the admin-tier and community roles the console assigns.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'city_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ambassador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_staff';

-- Role assignment is already governed by the existing
-- "Admins can manage roles" policy on public.user_roles. Finer-grained,
-- per-capability DB enforcement can layer on later; for now capabilities are
-- evaluated in the app from the user's roles.
