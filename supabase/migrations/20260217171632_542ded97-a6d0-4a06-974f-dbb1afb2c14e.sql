-- Update generate_user_pulse to exclude 'save' activity type entirely
CREATE OR REPLACE FUNCTION public.generate_user_pulse(p_user_id uuid, p_activity_type text, p_reference_id uuid, p_business_id uuid DEFAULT NULL::uuid, p_content text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pulse_enabled boolean;
  v_post_id uuid;
  v_business_name text;
  v_generated_content text;
  v_expires_at timestamptz;
BEGIN
  -- Skip 'save' activity — too noisy for the feed
  IF p_activity_type = 'save' THEN
    RETURN NULL;
  END IF;

  -- Check if user has pulse enabled
  SELECT COALESCE(user_pulse_enabled, true) INTO v_pulse_enabled
  FROM user_preferences WHERE user_id = p_user_id;
  
  -- If no preferences or pulse disabled, skip
  IF NOT COALESCE(v_pulse_enabled, true) THEN
    RETURN NULL;
  END IF;
  
  -- Get business name if applicable
  IF p_business_id IS NOT NULL THEN
    SELECT name INTO v_business_name FROM businesses WHERE id = p_business_id;
  END IF;
  
  -- Generate content based on activity type
  v_generated_content := COALESCE(p_content, 
    CASE p_activity_type
      WHEN 'visit' THEN 'Just checked in at ' || COALESCE(v_business_name, 'a local spot') || ' 📍'
      WHEN 'review' THEN 'Left a review for ' || COALESCE(v_business_name, 'a local business') || ' 💬'
      WHEN 'support' THEN 'Supported ' || COALESCE(v_business_name, 'a local cause') || ' 💚'
      WHEN 'loop_earn' THEN 'Earned Loop points at ' || COALESCE(v_business_name, 'a local business') || ' 🔄'
      WHEN 'mission_complete' THEN 'Completed a local mission! 🎯'
      ELSE 'Active in Toledo 🌆'
    END
  );
  
  -- Set expiration (user posts expire in 24 hours)
  v_expires_at := NOW() + INTERVAL '24 hours';
  
  -- Insert the pulse post
  INSERT INTO pulse_posts (
    user_id,
    content,
    category,
    expires_at,
    author_type,
    activity_type,
    reference_id,
    auto_generated,
    business_id
  ) VALUES (
    p_user_id,
    v_generated_content,
    'good_stuff',
    v_expires_at,
    'user',
    p_activity_type,
    p_reference_id,
    true,
    p_business_id
  )
  RETURNING id INTO v_post_id;
  
  RETURN v_post_id;
END;
$function$;