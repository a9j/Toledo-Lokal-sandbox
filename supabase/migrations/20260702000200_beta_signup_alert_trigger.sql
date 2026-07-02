-- Trigger: email alert on every new beta signup via the beta-signup-alert edge function.
-- Uses pg_net to make an async HTTP POST so the INSERT is never blocked.

create extension if not exists pg_net;

create or replace function public.notify_beta_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://nnepslwwqjxfhlurwoyw.supabase.co/functions/v1/beta-signup-alert',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('record', row_to_json(NEW))
  );
  return NEW;
end;
$$;

drop trigger if exists on_beta_signup_insert on public.beta_signups;
create trigger on_beta_signup_insert
  after insert on public.beta_signups
  for each row execute function public.notify_beta_signup();
