-- Daily Drop System Tables
-- Main daily_drops table for curating daily content
CREATE TABLE public.daily_drops (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    drop_date DATE NOT NULL UNIQUE,
    title TEXT,
    subtitle TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
    publish_time TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Today in Toledo items (max 3 per drop)
CREATE TABLE public.daily_drop_highlights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    daily_drop_id UUID NOT NULL REFERENCES public.daily_drops(id) ON DELETE CASCADE,
    highlight_type TEXT NOT NULL CHECK (highlight_type IN ('event', 'deal', 'announcement', 'weather', 'tip')),
    title TEXT NOT NULL,
    subtitle TEXT,
    link_url TEXT,
    link_text TEXT,
    icon TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Live Local spotlight (businesses/food trucks/nonprofits - max 2 per drop)
CREATE TABLE public.daily_drop_spotlights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    daily_drop_id UUID NOT NULL REFERENCES public.daily_drops(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    spotlight_type TEXT NOT NULL CHECK (spotlight_type IN ('business', 'food_truck', 'nonprofit')),
    custom_headline TEXT,
    custom_description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Community Moment (1 per drop - featured story/spotlight)
CREATE TABLE public.daily_drop_moments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    daily_drop_id UUID NOT NULL REFERENCES public.daily_drops(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    link_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.daily_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_drop_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_drop_spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_drop_moments ENABLE ROW LEVEL SECURITY;

-- Everyone can read published drops
CREATE POLICY "Anyone can view published drops"
ON public.daily_drops FOR SELECT
USING (status = 'published' AND (drop_date <= CURRENT_DATE));

-- Admins can manage drops
CREATE POLICY "Admins can manage drops"
ON public.daily_drops FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Everyone can read highlights of published drops
CREATE POLICY "Anyone can view highlights of published drops"
ON public.daily_drop_highlights FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.daily_drops
        WHERE id = daily_drop_id AND status = 'published' AND drop_date <= CURRENT_DATE
    )
);

-- Admins can manage highlights
CREATE POLICY "Admins can manage highlights"
ON public.daily_drop_highlights FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Everyone can read spotlights of published drops
CREATE POLICY "Anyone can view spotlights of published drops"
ON public.daily_drop_spotlights FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.daily_drops
        WHERE id = daily_drop_id AND status = 'published' AND drop_date <= CURRENT_DATE
    )
);

-- Admins can manage spotlights
CREATE POLICY "Admins can manage spotlights"
ON public.daily_drop_spotlights FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Everyone can read moments of published drops
CREATE POLICY "Anyone can view moments of published drops"
ON public.daily_drop_moments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.daily_drops
        WHERE id = daily_drop_id AND status = 'published' AND drop_date <= CURRENT_DATE
    )
);

-- Admins can manage moments
CREATE POLICY "Admins can manage moments"
ON public.daily_drop_moments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Create trigger for updated_at
CREATE TRIGGER update_daily_drops_updated_at
BEFORE UPDATE ON public.daily_drops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_daily_drops_date ON public.daily_drops(drop_date DESC);
CREATE INDEX idx_daily_drops_status ON public.daily_drops(status);
CREATE INDEX idx_daily_drop_highlights_drop ON public.daily_drop_highlights(daily_drop_id);
CREATE INDEX idx_daily_drop_spotlights_drop ON public.daily_drop_spotlights(daily_drop_id);
CREATE INDEX idx_daily_drop_moments_drop ON public.daily_drop_moments(daily_drop_id);