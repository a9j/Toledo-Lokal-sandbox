-- Create early_adopters table to track users who get free top-tier
CREATE TABLE public.early_adopters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    tier TEXT DEFAULT 'anchor_partner' NOT NULL
);

-- Enable RLS
ALTER TABLE public.early_adopters ENABLE ROW LEVEL SECURITY;

-- Users can view their own early adopter status
CREATE POLICY "Users can view own early adopter status"
ON public.early_adopters
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to check if user should become early adopter
CREATE OR REPLACE FUNCTION public.check_early_adopter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Count existing early adopters
    SELECT COUNT(*) INTO current_count FROM public.early_adopters;
    
    -- If less than 10, add this user as early adopter
    IF current_count < 10 THEN
        INSERT INTO public.early_adopters (user_id, tier)
        VALUES (NEW.id, 'anchor_partner');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users (fires after handle_new_user)
CREATE TRIGGER on_auth_user_created_early_adopter
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.check_early_adopter();

-- Grant yourself (the first user) early adopter status
INSERT INTO public.early_adopters (user_id, tier)
VALUES ('0d72ef0e-ab04-4a35-935b-45be8c8fce57', 'anchor_partner')
ON CONFLICT (user_id) DO NOTHING;