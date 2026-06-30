-- Tighten gamification badge tables to owner-scoped reads.
--
-- user_badges had "Users can view all badges" USING (true), letting any user
-- read every other user's challenge badge history. loop_badges had a similar
-- "Anyone can view public badge counts" USING (true) policy. Both are now
-- restricted to owner-only reads. The existing owner-scoped policy on
-- loop_badges ("Users can view their own badges") already exists and stays.

-- ── user_badges ─────────────────────────────────────────────────────────
drop policy if exists "Users can view all badges" on public.user_badges;

create policy "Users can view own badges"
  on public.user_badges for select
  using (auth.uid() = user_id);

-- ── loop_badges ─────────────────────────────────────────────────────────
drop policy if exists "Anyone can view public badge counts" on public.loop_badges;
