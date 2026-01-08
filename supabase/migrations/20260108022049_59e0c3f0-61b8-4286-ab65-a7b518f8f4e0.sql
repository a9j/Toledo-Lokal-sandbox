-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Drop the overly permissive policy on leads
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;

-- Create more restrictive lead creation policy
CREATE POLICY "Authenticated users can create leads for approved businesses" ON public.leads 
    FOR INSERT TO authenticated 
    WITH CHECK (
        business_id IN (SELECT id FROM public.businesses WHERE status = 'approved')
    );

-- Seed categories
INSERT INTO public.categories (name, icon) VALUES
    ('Food & Drink', 'utensils'),
    ('Health & Fitness', 'heart'),
    ('Beauty', 'sparkles'),
    ('Home Services', 'home'),
    ('Auto', 'car'),
    ('Events & Venues', 'calendar'),
    ('Shopping', 'shopping-bag'),
    ('Local Pros', 'briefcase');

-- Seed neighborhoods
INSERT INTO public.neighborhoods (name) VALUES
    ('Downtown'),
    ('Old West End'),
    ('South Toledo'),
    ('West Toledo'),
    ('East Toledo'),
    ('Sylvania'),
    ('Perrysburg');

-- Seed subscription plans
INSERT INTO public.plans (name, price_monthly, features, lead_access_level, boost_credits_per_month, deals_per_month, events_per_month) VALUES
    ('Free', 0, ARRAY['Basic listing', 'Name-only lead info'], 'locked', 0, 0, 0),
    ('Starter', 29, ARRAY['1 deal/month', '1 event/month', 'Name-only lead info'], 'limited', 0, 1, 1),
    ('Growth', 79, ARRAY['4 deals/month', '4 events/month', 'Full lead details', 'Basic analytics'], 'unlocked', 1, 4, 4),
    ('Pro', 199, ARRAY['Unlimited deals', 'Unlimited events', 'Full lead details', 'Priority featuring', 'Category exclusivity'], 'unlocked', 3, -1, -1);