-- Walking Tours
CREATE TABLE public.tours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  duration_minutes INTEGER,
  distance_miles DECIMAL(4,2),
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
  image_url TEXT,
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.tour_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id),
  stop_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tip TEXT,
  deal_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Support Local Challenges
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  required_visits INTEGER DEFAULT 5,
  reward_description TEXT,
  badge_icon TEXT,
  badge_color TEXT DEFAULT '#5C8A6E',
  start_date DATE,
  end_date DATE,
  featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, business_id)
);

CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Community Stories
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  business_id UUID REFERENCES public.businesses(id),
  neighborhood_id UUID REFERENCES public.neighborhoods(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  story_type TEXT DEFAULT 'tip' CHECK (story_type IN ('tip', 'hidden_gem', 'memory', 'recommendation')),
  likes_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.story_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, story_id)
);

-- User Preferences for Newcomer Guide
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_newcomer BOOLEAN DEFAULT false,
  moved_date DATE,
  interests TEXT[],
  preferred_neighborhoods UUID[],
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Tours & Tour Stops: Public read
CREATE POLICY "Tours are viewable by everyone" ON public.tours FOR SELECT USING (status = 'active');
CREATE POLICY "Tour stops are viewable by everyone" ON public.tour_stops FOR SELECT USING (true);

-- Challenges: Public read
CREATE POLICY "Challenges are viewable by everyone" ON public.challenges FOR SELECT USING (status = 'active');

-- Challenge Progress: Users manage their own
CREATE POLICY "Users can view their own progress" ON public.challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can track their own progress" ON public.challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON public.challenge_progress FOR DELETE USING (auth.uid() = user_id);

-- User Badges: Users view their own, others can see earned badges
CREATE POLICY "Users can view all badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "System can grant badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stories: Public read approved, users manage own
CREATE POLICY "Published stories are viewable by everyone" ON public.stories FOR SELECT USING (status = 'approved' OR auth.uid() = author_id);
CREATE POLICY "Users can create stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own stories" ON public.stories FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own stories" ON public.stories FOR DELETE USING (auth.uid() = author_id);

-- Story Likes: Users manage their own
CREATE POLICY "Story likes are viewable by everyone" ON public.story_likes FOR SELECT USING (true);
CREATE POLICY "Users can like stories" ON public.story_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike stories" ON public.story_likes FOR DELETE USING (auth.uid() = user_id);

-- User Preferences: Users manage their own
CREATE POLICY "Users can view their own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);