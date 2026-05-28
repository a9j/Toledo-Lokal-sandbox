-- Local Signals: a positive, local-first replacement for star reviews. How
-- locals actually experience a business — reactions, moments, reputation,
-- recommendations, and what it's known for.

CREATE TABLE IF NOT EXISTS public.local_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL,
  business_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.local_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'removed')),
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reputation_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  source text DEFAULT 'auto',
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, badge_type)
);

CREATE TABLE IF NOT EXISTS public.recommendation_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_type text NOT NULL,
  response boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id, prompt_type)
);

CREATE TABLE IF NOT EXISTS public.known_for_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  tag text NOT NULL,
  source text DEFAULT 'auto',
  confidence_score numeric DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.local_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.known_for_tags ENABLE ROW LEVEL SECURITY;

-- Reactions: public read (aggregates), users manage their own taps.
CREATE POLICY "Anyone can view reactions" ON public.local_reactions FOR SELECT USING (true);
CREATE POLICY "Users add own reactions" ON public.local_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own reactions" ON public.local_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Moments: public sees approved; authors see/manage their own; moderators manage all.
CREATE POLICY "Anyone can view approved moments" ON public.local_moments FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.can_moderate(auth.uid()));
CREATE POLICY "Users add own moments" ON public.local_moments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own moments" ON public.local_moments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own moments" ON public.local_moments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Moderators manage moments" ON public.local_moments FOR ALL TO authenticated USING (public.can_moderate(auth.uid())) WITH CHECK (public.can_moderate(auth.uid()));

-- Reputation badges + known-for: public read, platform admins manage.
CREATE POLICY "Anyone can view reputation badges" ON public.reputation_badges FOR SELECT USING (true);
CREATE POLICY "Admins manage reputation badges" ON public.reputation_badges FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "Anyone can view known-for tags" ON public.known_for_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage known-for tags" ON public.known_for_tags FOR ALL TO authenticated USING (public.is_platform_admin(auth.uid())) WITH CHECK (public.is_platform_admin(auth.uid()));

-- Recommendation prompts: public read (aggregates), users manage own answers.
CREATE POLICY "Anyone can view recommendations" ON public.recommendation_prompts FOR SELECT USING (true);
CREATE POLICY "Users add own recommendations" ON public.recommendation_prompts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recommendations" ON public.recommendation_prompts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_local_reactions_business ON public.local_reactions(business_id);
CREATE INDEX IF NOT EXISTS idx_local_moments_business ON public.local_moments(business_id, status);
CREATE INDEX IF NOT EXISTS idx_reputation_badges_business ON public.reputation_badges(business_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_prompts_business ON public.recommendation_prompts(business_id);
CREATE INDEX IF NOT EXISTS idx_known_for_tags_business ON public.known_for_tags(business_id);
