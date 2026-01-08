-- Create an audit log table for tracking admin access to sensitive data
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  query_details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (for review purposes)
CREATE POLICY "Only admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs (using security definer function)
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (true);

-- Create a function to log admin profile access
CREATE OR REPLACE FUNCTION public.log_admin_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  accessing_user_id uuid;
  is_admin boolean;
  is_own_profile boolean;
BEGIN
  accessing_user_id := auth.uid();
  
  -- Check if the accessing user is an admin
  SELECT has_role(accessing_user_id, 'admin') INTO is_admin;
  
  -- Check if admin is accessing their own profile
  is_own_profile := (OLD.user_id = accessing_user_id);
  
  -- Log only if admin is accessing someone else's profile
  IF is_admin AND NOT is_own_profile THEN
    INSERT INTO public.admin_audit_logs (
      admin_user_id,
      action,
      table_name,
      record_id,
      query_details
    ) VALUES (
      accessing_user_id,
      'SELECT',
      'profiles',
      OLD.id,
      jsonb_build_object(
        'accessed_user_id', OLD.user_id,
        'accessed_at', now()
      )
    );
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create a secure function for admins to query profiles with automatic audit logging
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  admin_id := auth.uid();
  
  -- Verify the user is an admin
  IF NOT has_role(admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Log the bulk access
  INSERT INTO public.admin_audit_logs (
    admin_user_id,
    action,
    table_name,
    query_details
  ) VALUES (
    admin_id,
    'SELECT_ALL',
    'profiles',
    jsonb_build_object(
      'action', 'bulk_profile_access',
      'accessed_at', now()
    )
  );
  
  -- Return all profiles
  RETURN QUERY SELECT * FROM public.profiles;
END;
$$;

-- Create index for faster audit log queries
CREATE INDEX idx_admin_audit_logs_admin_user_id ON public.admin_audit_logs(admin_user_id);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_table_name ON public.admin_audit_logs(table_name);