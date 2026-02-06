-- Add user_pulse_enabled column for users who opt-in to auto-posting activity
ALTER TABLE pulse_posts ADD COLUMN IF NOT EXISTS activity_type text;
ALTER TABLE pulse_posts ADD COLUMN IF NOT EXISTS reference_id uuid;
ALTER TABLE pulse_posts ADD COLUMN IF NOT EXISTS auto_generated boolean DEFAULT false;

-- Create index for efficient querying of auto-generated posts
CREATE INDEX IF NOT EXISTS idx_pulse_posts_auto_generated ON pulse_posts(auto_generated) WHERE auto_generated = true;
CREATE INDEX IF NOT EXISTS idx_pulse_posts_author_type ON pulse_posts(author_type);

-- Add user pulse preferences to user_preferences table
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS user_pulse_enabled boolean DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS pulse_visibility text DEFAULT 'public';

-- Create function to generate user pulse post
CREATE OR REPLACE FUNCTION generate_user_pulse(
  p_user_id uuid,
  p_activity_type text,
  p_reference_id uuid,
  p_business_id uuid DEFAULT NULL,
  p_content text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pulse_enabled boolean;
  v_post_id uuid;
  v_business_name text;
  v_generated_content text;
  v_expires_at timestamptz;
BEGIN
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
      WHEN 'save' THEN 'Added ' || COALESCE(v_business_name, 'a new spot') || ' to My Toledo ⭐'
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
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_user_pulse TO authenticated;