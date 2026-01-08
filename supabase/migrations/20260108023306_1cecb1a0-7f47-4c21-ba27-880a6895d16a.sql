-- Add additional roles to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'organizer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nonprofit';

-- Create programs table
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    overview TEXT,
    eligibility TEXT,
    benefits TEXT,
    signup_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'coming_soon')),
    featured BOOLEAN DEFAULT false,
    category_id UUID REFERENCES public.categories(id),
    created_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table for community feed
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    images TEXT[] DEFAULT '{}',
    post_type TEXT NOT NULL DEFAULT 'community' CHECK (post_type IN ('community', 'business', 'announcement')),
    featured BOOLEAN DEFAULT false,
    pinned BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post likes table
CREATE TABLE public.post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (post_id, user_id)
);

-- Create comments table
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'flagged')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event RSVPs table
CREATE TABLE public.event_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (event_id, user_id)
);

-- Create program signups table
CREATE TABLE public.program_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'pending', 'completed', 'withdrawn')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (program_id, user_id)
);

-- Add logo_url to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Enable RLS on new tables
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_signups ENABLE ROW LEVEL SECURITY;

-- Programs policies
CREATE POLICY "Anyone can view open programs" ON public.programs FOR SELECT USING (status IN ('open', 'coming_soon'));
CREATE POLICY "Admins can manage programs" ON public.programs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Posts policies
CREATE POLICY "Anyone can view active posts" ON public.posts FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Admins can manage all posts" ON public.posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Post likes policies
CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like posts" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove own likes" ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comments policies
CREATE POLICY "Anyone can view active comments" ON public.comments FOR SELECT USING (status = 'active');
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE TO authenticated USING (author_id = auth.uid());
CREATE POLICY "Admins can manage all comments" ON public.comments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Event RSVPs policies
CREATE POLICY "Anyone can view RSVPs" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Authenticated users can RSVP" ON public.event_rsvps FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own RSVP" ON public.event_rsvps FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can remove own RSVP" ON public.event_rsvps FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Program signups policies
CREATE POLICY "Users can view own signups" ON public.program_signups FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can signup for programs" ON public.program_signups FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all signups" ON public.program_signups FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Function to update post counts
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER update_likes_count AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();
CREATE TRIGGER update_comments_count AFTER INSERT OR DELETE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();