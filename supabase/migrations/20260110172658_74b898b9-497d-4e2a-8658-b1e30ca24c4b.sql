-- Add founding member status to business_loop_settings
ALTER TABLE public.business_loop_settings
ADD COLUMN is_founding_member boolean DEFAULT false;

-- Mark Steven's Skillet as a founding member with full benefits (loop_partner tier = best tier)
UPDATE public.business_loop_settings
SET is_founding_member = true,
    loop_tier_id = 'loop_partner',
    is_active = true
WHERE business_id = '1f600d35-e504-4da1-b8a4-e8b116d2a972';

-- If no settings exist for Steven's Skillet, create them
INSERT INTO public.business_loop_settings (business_id, loop_tier_id, is_active, is_founding_member)
SELECT '1f600d35-e504-4da1-b8a4-e8b116d2a972', 'loop_partner', true, true
WHERE NOT EXISTS (
    SELECT 1 FROM public.business_loop_settings 
    WHERE business_id = '1f600d35-e504-4da1-b8a4-e8b116d2a972'
);