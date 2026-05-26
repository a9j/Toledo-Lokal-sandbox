-- Bug fix: the "Your Vibe" section on a user's profile was not editable.
-- Add a vibe column (a small set of self-selected vibe tags) so the profile
-- editor can persist it. Existing RLS on profiles already lets a user update
-- their own row, so no new policy is required.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS vibe text[] NOT NULL DEFAULT '{}'::text[];
