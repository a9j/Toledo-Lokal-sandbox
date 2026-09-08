-- Phase 2: Lokal ID and the City Receipt.

-- ---------------------------------------------------- Lokal ID

-- A code emailed to the resident, stored only as a bcrypt hash so a database
-- read cannot verify anyone's address. The client never sees the code: the
-- send-address-code edge function generates it, writes the hash with the
-- service role, and emails the plain text.
create table if not exists public.address_verifications (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  parcel_id   uuid not null references public.parcels(id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.address_verifications enable row level security;
-- No policy at all: this table is service role and definer functions only.
-- Nobody reads their own pending code, not even its hash.

-- Confirm the code. Rate limited by attempts so a six digit code cannot be
-- guessed, and single use: the row is deleted whether or not it matched out.
create or replace function public.confirm_address_verification(p_code text)
returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user uuid := auth.uid();
  v_row  public.address_verifications%rowtype;
begin
  if v_user is null then
    raise exception 'Not signed in';
  end if;

  select * into v_row from public.address_verifications where user_id = v_user;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_code');
  end if;

  if v_row.expires_at < now() then
    delete from public.address_verifications where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  if v_row.attempts >= 5 then
    delete from public.address_verifications where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'too_many_attempts');
  end if;

  if v_row.code_hash <> extensions.crypt(coalesce(p_code, ''), v_row.code_hash) then
    update public.address_verifications
       set attempts = attempts + 1
     where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'wrong_code',
                              'attempts_left', 4 - v_row.attempts);
  end if;

  -- Only verify the address the code was actually sent for. If they changed
  -- their home after requesting the code, this is not proof of the new one.
  update public.profiles
     set home_verified_at = now(), updated_at = now()
   where user_id = v_user and home_parcel_id = v_row.parcel_id;

  if not found then
    delete from public.address_verifications where user_id = v_user;
    return jsonb_build_object('ok', false, 'reason', 'home_changed');
  end if;

  delete from public.address_verifications where user_id = v_user;
  return jsonb_build_object('ok', true);
end $$;

revoke execute on function public.confirm_address_verification(text) from public, anon;
grant   execute on function public.confirm_address_verification(text) to authenticated;

-- ---------------------------------------------------- City Receipt

-- The split is editable rather than hard coded, because published city budget
-- percentages change every year and this should not need a deploy.
insert into public.app_settings (key, value)
values ('city_budget_split', jsonb_build_object(
  'note', 'Placeholder percentages. Replace with the published City of Toledo general fund breakdown before this is shown to residents.',
  'source', 'placeholder',
  'shares', jsonb_build_array(
    jsonb_build_object('label', 'Police',  'percent', 32),
    jsonb_build_object('label', 'Fire',    'percent', 24),
    jsonb_build_object('label', 'Roads',   'percent', 14),
    jsonb_build_object('label', 'Refuse',  'percent', 9),
    jsonb_build_object('label', 'Parks',   'percent', 6),
    jsonb_build_object('label', 'Other',   'percent', 15)
  )))
on conflict (key) do nothing;
