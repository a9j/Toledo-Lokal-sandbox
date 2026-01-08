
-- Create rate limit function for posts (max 10 posts per user per day)
CREATE OR REPLACE FUNCTION public.check_post_rate_limit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM public.posts
    WHERE author_id = _user_id 
      AND created_at > now() - interval '24 hours'
  ) < 10  -- Max 10 posts per day
$$;

-- Create rate limit function for reviews (max 5 reviews per user per day)
CREATE OR REPLACE FUNCTION public.check_review_rate_limit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM public.reviews
    WHERE user_id = _user_id 
      AND created_at > now() - interval '24 hours'
  ) < 5  -- Max 5 reviews per day
$$;

-- Create first-review cooldown function (account must be at least 1 hour old)
CREATE OR REPLACE FUNCTION public.check_first_review_cooldown(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT created_at FROM auth.users WHERE id = _user_id
  ) < now() - interval '1 hour'
$$;

-- Drop existing post insert policy
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;

-- Create new post insert policy with rate limiting
CREATE POLICY "Authenticated users can create posts with rate limit" 
ON public.posts 
FOR INSERT 
WITH CHECK (
  author_id = auth.uid() 
  AND check_post_rate_limit(auth.uid())
);

-- Drop existing review insert policy
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

-- Create new review insert policy with rate limiting and cooldown
CREATE POLICY "Users can create reviews with rate limit" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND check_review_rate_limit(auth.uid())
  AND check_first_review_cooldown(auth.uid())
);

-- Add indexes for rate limit queries
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts(author_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_user_created ON public.reviews(user_id, created_at);
