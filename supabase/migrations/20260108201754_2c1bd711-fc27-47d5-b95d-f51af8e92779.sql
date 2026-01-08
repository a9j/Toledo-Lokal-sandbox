-- Drop the existing trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_early_adopter ON auth.users;

-- Update the function to work with businesses
CREATE OR REPLACE FUNCTION public.check_early_adopter_business()
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
    
    -- If less than 10, add the business owner as early adopter
    IF current_count < 10 THEN
        INSERT INTO public.early_adopters (user_id, tier)
        VALUES (NEW.owner_user_id, 'anchor_partner')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on businesses table
CREATE TRIGGER on_business_created_early_adopter
AFTER INSERT ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.check_early_adopter_business();

-- Drop the old function
DROP FUNCTION IF EXISTS public.check_early_adopter();