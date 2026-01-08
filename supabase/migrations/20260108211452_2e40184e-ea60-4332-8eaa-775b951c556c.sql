-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_logs;

-- No direct INSERT policy needed - audit logs are only inserted via SECURITY DEFINER functions
-- This ensures audit logs can only be created by the system, not by users directly

-- Prevent any direct modifications to audit logs
CREATE POLICY "No direct inserts allowed"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No updates allowed"
ON public.admin_audit_logs
FOR UPDATE
USING (false);

CREATE POLICY "No deletes allowed"
ON public.admin_audit_logs
FOR DELETE
USING (false);