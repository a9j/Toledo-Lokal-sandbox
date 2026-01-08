-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_business_created_early_adopter ON public.businesses;
DROP FUNCTION IF EXISTS public.check_early_adopter_business();

-- Create new function that triggers on status change to 'approved'
CREATE OR REPLACE FUNCTION public.grant_early_adopter_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_count INTEGER;
BEGIN
    -- Only trigger when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Count existing early adopters
        SELECT COUNT(*) INTO current_count FROM public.early_adopters;
        
        -- If less than 10, add the business owner as early adopter
        IF current_count < 10 THEN
            INSERT INTO public.early_adopters (user_id, tier)
            VALUES (NEW.owner_user_id, 'anchor_partner')
            ON CONFLICT (user_id) DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger on UPDATE (when admin approves)
CREATE TRIGGER on_business_approved_early_adopter
    AFTER UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.grant_early_adopter_on_approval();