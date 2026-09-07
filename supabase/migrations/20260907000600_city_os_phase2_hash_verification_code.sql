-- Bcrypt lives in one place. Only the service role calls this: the
-- send-address-code edge function hashes the code it just generated before
-- storing it. Revoked from anon and authenticated so it cannot be used as a
-- hashing oracle.
create or replace function public.hash_verification_code(p_code text)
returns text
language sql volatile security definer set search_path = public, extensions as $$
  select extensions.crypt(p_code, extensions.gen_salt('bf'));
$$;

revoke execute on function public.hash_verification_code(text) from public, anon, authenticated;
