-- Ask Toledo gets its own daily cap, 30 questions, counted in the existing
-- ai_chat_usage table alongside the older chat.
--
-- Like check_ai_rate_limit this both counts and checks in one call, so callers
-- must not increment separately or every question is billed twice.
create or replace function public.check_ask_toledo_rate_limit(_user_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  current_count integer;
  max_questions_per_day integer := 30;
begin
  insert into public.ai_chat_usage (user_id, message_count, usage_date)
  values (_user_id, 1, current_date)
  on conflict (user_id, usage_date)
  do update set message_count = ai_chat_usage.message_count + 1
  returning message_count into current_count;

  return current_count <= max_questions_per_day;
end $$;

revoke execute on function public.check_ask_toledo_rate_limit(uuid) from public, anon, authenticated;
