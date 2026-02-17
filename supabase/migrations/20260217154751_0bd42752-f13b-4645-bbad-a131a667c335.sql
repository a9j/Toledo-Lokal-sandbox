
CREATE OR REPLACE FUNCTION public.get_or_create_loop_wallet(p_user_id uuid, p_city text DEFAULT 'toledo'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_wallet_id uuid;
BEGIN
  -- Validate that p_user_id matches the calling user (unless called from service role context)
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Cannot create or access wallet for another user';
  END IF;

  SELECT id INTO v_wallet_id FROM loop_wallets WHERE user_id = p_user_id AND city = p_city;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO loop_wallets (user_id, city) VALUES (p_user_id, p_city)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  RETURN v_wallet_id;
END;
$function$;
