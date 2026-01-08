-- Reviews table for businesses
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    photos TEXT[],
    helpful_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(business_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reviews are publicly viewable"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add average rating to businesses
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Function to update business rating stats
CREATE OR REPLACE FUNCTION public.update_business_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.businesses
        SET 
            average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE business_id = NEW.business_id),
            review_count = (SELECT COUNT(*) FROM public.reviews WHERE business_id = NEW.business_id)
        WHERE id = NEW.business_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.businesses
        SET 
            average_rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE business_id = OLD.business_id), 0),
            review_count = (SELECT COUNT(*) FROM public.reviews WHERE business_id = OLD.business_id)
        WHERE id = OLD.business_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-update business ratings
CREATE TRIGGER update_business_ratings
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_business_rating_stats();

-- Event tickets table
CREATE TABLE public.event_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER,
    quantity_sold INTEGER NOT NULL DEFAULT 0,
    stripe_price_id TEXT,
    sales_start TIMESTAMP WITH TIME ZONE,
    sales_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ticket purchases
CREATE TABLE public.ticket_purchases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_session_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Ticket policies
CREATE POLICY "Event tickets are publicly viewable"
ON public.event_tickets FOR SELECT
USING (true);

CREATE POLICY "Event organizers can manage tickets"
ON public.event_tickets FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.events e
        WHERE e.id = event_id AND e.business_id IN (
            SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()
        )
    )
);

-- Purchase policies
CREATE POLICY "Users can view own purchases"
ON public.ticket_purchases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
ON public.ticket_purchases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update purchases"
ON public.ticket_purchases FOR UPDATE
USING (true);