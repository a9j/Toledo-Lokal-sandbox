-- Hire Local follow-up: least-privilege on the trigger functions.
--
-- enforce_record_item_verification and enforce_reference_verification are
-- trigger functions only. They have no business being callable as REST RPCs, so
-- revoke EXECUTE from the API roles. Calling them outside a trigger context
-- would error anyway, but this keeps the surface tight and clears the
-- security-definer-executable advisory for them.

REVOKE ALL ON FUNCTION public.enforce_record_item_verification() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_reference_verification() FROM public, anon, authenticated;
