-- One reaction per user per post.
--
-- The old constraint (post_id, user_id, reaction_type) let a user stack several
-- different reactions on the same post. We want a single reaction per post, so
-- dedupe existing rows (keep the most recent; tie-break on id) and swap the
-- unique constraint to (post_id, user_id). App code replaces a user's reaction
-- on tap rather than adding a second one.

DELETE FROM public.pulse_reactions a
USING public.pulse_reactions b
WHERE a.post_id = b.post_id
  AND a.user_id = b.user_id
  AND (a.created_at < b.created_at
       OR (a.created_at = b.created_at AND a.id > b.id));

ALTER TABLE public.pulse_reactions
  DROP CONSTRAINT IF EXISTS pulse_reactions_post_id_user_id_reaction_type_key;

ALTER TABLE public.pulse_reactions
  ADD CONSTRAINT pulse_reactions_one_per_post UNIQUE (post_id, user_id);
