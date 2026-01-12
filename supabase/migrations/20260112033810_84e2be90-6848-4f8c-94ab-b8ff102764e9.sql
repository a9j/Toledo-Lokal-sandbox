-- Create pulse category enum
CREATE TYPE public.pulse_category AS ENUM ('right_now', 'heads_up', 'energy_check', 'community_ask', 'good_stuff');

-- Create pulse post status enum  
CREATE TYPE public.pulse_post_status AS ENUM ('active', 'hidden', 'removed', 'expired');

-- Create pulse posts table
CREATE TABLE public.pulse_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category pulse_category NOT NULL,
  content TEXT NOT NULL CHECK (length(content) <= 140),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  location_text TEXT,
  status pulse_post_status NOT NULL DEFAULT 'active',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  flag_count INTEGER NOT NULL DEFAULT 0,
  
  -- Ensure either user_id or business_id is set, but not both for user posts
  CONSTRAINT pulse_author_check CHECK (user_id IS NOT NULL OR business_id IS NOT NULL)
);

-- Create pulse feedback table
CREATE TABLE public.pulse_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.pulse_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- One feedback per user per post
  UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_pulse_posts_status_expires ON public.pulse_posts(status, expires_at);
CREATE INDEX idx_pulse_posts_user_id ON public.pulse_posts(user_id);
CREATE INDEX idx_pulse_posts_business_id ON public.pulse_posts(business_id);
CREATE INDEX idx_pulse_posts_category ON public.pulse_posts(category);
CREATE INDEX idx_pulse_posts_pinned ON public.pulse_posts(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_pulse_feedback_post ON public.pulse_feedback(post_id);

-- Enable RLS
ALTER TABLE public.pulse_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pulse_posts

-- Anyone can view active posts that haven't expired
CREATE POLICY "Anyone can view active pulse posts"
ON public.pulse_posts
FOR SELECT
USING (status = 'active' AND expires_at > now());

-- Users can view their own posts regardless of status
CREATE POLICY "Users can view own pulse posts"
ON public.pulse_posts
FOR SELECT
USING (auth.uid() = user_id);

-- Business owners/staff can view their business posts
CREATE POLICY "Business owners can view business pulse posts"
ON public.pulse_posts
FOR SELECT
USING (
  business_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM business_staff WHERE business_id = pulse_posts.business_id AND user_id = auth.uid())
  )
);

-- Users can create posts (max 3 per day enforced at app level)
CREATE POLICY "Authenticated users can create pulse posts"
ON public.pulse_posts
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (user_id = auth.uid() OR (
    business_id IS NOT NULL AND (
      EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_user_id = auth.uid()) OR
      EXISTS (SELECT 1 FROM business_staff WHERE business_id = pulse_posts.business_id AND user_id = auth.uid())
    )
  ))
);

-- Users can only delete (hide) their own posts
CREATE POLICY "Users can update own pulse posts"
ON public.pulse_posts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Business owners can update their business posts
CREATE POLICY "Business owners can update business pulse posts"
ON public.pulse_posts
FOR UPDATE
USING (
  business_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM business_staff WHERE business_id = pulse_posts.business_id AND user_id = auth.uid())
  )
)
WITH CHECK (
  business_id IS NOT NULL AND (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM business_staff WHERE business_id = pulse_posts.business_id AND user_id = auth.uid())
  )
);

-- RLS Policies for pulse_feedback

-- Users can view their own feedback
CREATE POLICY "Users can view own pulse feedback"
ON public.pulse_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create feedback
CREATE POLICY "Authenticated users can create pulse feedback"
ON public.pulse_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete own pulse feedback"
ON public.pulse_feedback
FOR DELETE
USING (auth.uid() = user_id);

-- Function to update helpful/flag counts
CREATE OR REPLACE FUNCTION public.update_pulse_feedback_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.feedback_type = 'helpful' THEN
      UPDATE pulse_posts SET helpful_count = helpful_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.feedback_type = 'not_helpful' THEN
      UPDATE pulse_posts SET flag_count = flag_count + 1 WHERE id = NEW.post_id;
      -- Auto-hide if flagged too many times
      UPDATE pulse_posts SET status = 'hidden' WHERE id = NEW.post_id AND flag_count >= 5;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.feedback_type = 'helpful' THEN
      UPDATE pulse_posts SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = OLD.post_id;
    ELSIF OLD.feedback_type = 'not_helpful' THEN
      UPDATE pulse_posts SET flag_count = GREATEST(0, flag_count - 1) WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for feedback counts
CREATE TRIGGER trigger_pulse_feedback_counts
AFTER INSERT OR DELETE ON public.pulse_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_pulse_feedback_counts();

-- Function to auto-expire posts (to be called by cron or background job)
CREATE OR REPLACE FUNCTION public.expire_pulse_posts()
RETURNS void AS $$
BEGIN
  UPDATE pulse_posts 
  SET status = 'expired'
  WHERE status = 'active' AND expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for pulse_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.pulse_posts;