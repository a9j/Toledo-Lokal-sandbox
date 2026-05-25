-- Allow admins to soft-remove ("archive") a business. Archived businesses are
-- automatically excluded from the public site, since every public-facing query
-- filters status = 'approved'. Archiving is reversible (restore to 'approved').
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_status_check;

ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'archived'));
