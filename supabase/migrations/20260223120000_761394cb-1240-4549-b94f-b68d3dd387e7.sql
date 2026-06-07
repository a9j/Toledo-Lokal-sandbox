-- Extend pulse_posts with business-facing post columns
-- and add pulse_likes / pulse_saves tables (Option A: additive extension)

-- ────────────────────────────────────────────────────────────────────────────
-- 1. New enum for business post types
-- ────────────────────────────────────────────────────────────────────────────
CREATE TYPE public.pulse_post_type AS ENUM (
  'update',
  'menu_item',
  'event',
  'challenge',
  'milestone',
  'popup',
  'food_truck_location'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Extend pulse_posts with new columns (all nullable — backward compatible)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.pulse_posts
  ADD COLUMN author_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN post_type    public.pulse_post_type,
  ADD COLUMN title        TEXT,
  ADD COLUMN image_url    TEXT,
  ADD COLUMN neighborhood TEXT,
  ADD COLUMN updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Indexes for the new columns
CREATE INDEX idx_pulse_posts_post_type  ON public.pulse_posts(post_type)  WHERE post_type  IS NOT NULL;
CREATE INDEX idx_pulse_posts_author_id  ON public.pulse_posts(author_id)  WHERE author_id  IS NOT NULL;
CREATE INDEX idx_pulse_posts_neighborhood ON public.pulse_posts(neighborhood) WHERE neighborhood IS NOT NULL;

-- Auto-update updated_at on row change
CREATE TRIGGER update_pulse_posts_updated_at
  BEFORE UPDATE ON public.pulse_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ────────────────────────────────────────────────────────────────────────────
-- 3. pulse_likes
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.pulse_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.pulse_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX idx_pulse_likes_post_id ON public.pulse_likes(post_id);
CREATE INDEX idx_pulse_likes_user_id ON public.pulse_likes(user_id);

ALTER TABLE public.pulse_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can see like counts (useful for public feed)
CREATE POLICY "Anyone can view pulse likes"
  ON public.pulse_likes FOR SELECT
  USING (true);

-- Users can only like as themselves
CREATE POLICY "Users can create own pulse likes"
  ON public.pulse_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own likes
CREATE POLICY "Users can delete own pulse likes"
  ON public.pulse_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. pulse_saves
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.pulse_saves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.pulse_posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX idx_pulse_saves_post_id ON public.pulse_saves(post_id);
CREATE INDEX idx_pulse_saves_user_id ON public.pulse_saves(user_id);

ALTER TABLE public.pulse_saves ENABLE ROW LEVEL SECURITY;

-- Saves are private — users only see their own
CREATE POLICY "Users can view own pulse saves"
  ON public.pulse_saves FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pulse saves"
  ON public.pulse_saves FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pulse saves"
  ON public.pulse_saves FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Enable realtime on new tables
-- ────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.pulse_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pulse_saves;
