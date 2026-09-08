-- City OS Phase 0, Step 6: Lokal identity and the privacy control centre.
--
-- The identity audit the roadmap asks for, first, because it gates the rest:
--
--   profiles.user_id      -> auth.users, and it is unique
--   loop_wallets.user_id  -> a uuid, no foreign key (see below)
--   saved_items.user_id   -> auth.users
--   entity_follows.user_id-> auth.users
--   event_rsvps.user_id   -> auth.users
--   resident_homes.user_id-> auth.users, primary key
--   passport_checkins.user_id -> auth.users
--   inbox_items.user_id   -> auth.users
--
-- Every one keys on the auth user, and one auth user has at most one profiles
-- row. There is no second identity to unify, so no unification migration is
-- needed and nothing here stops for approval on that point.
--
-- Two tables key on user_id with no foreign key behind it, loop_wallets and
-- user_preferences. That is an integrity gap rather than an identity one: a
-- deleted user leaves a wallet behind. Both are empty, so the constraint is
-- added here and costs nothing.
--
-- Then the control centre itself. Every switch defaults to the least sharing
-- option, which has one consequence worth saying out loud: a resident must
-- turn on "keep my address" before a home can be saved at all. set_home_parcel
-- refuses until they do, and says so in words rather than failing silently.

-- ------------------------------------------------------ 1. close the two gaps
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'loop_wallets_user_id_fkey')
     and not exists (select 1 from public.loop_wallets w
                      where not exists (select 1 from auth.users u where u.id = w.user_id)) then
    alter table public.loop_wallets
      add constraint loop_wallets_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_preferences_user_id_fkey')
     and not exists (select 1 from public.user_preferences p
                      where p.user_id is not null
                        and not exists (select 1 from auth.users u where u.id = p.user_id)) then
    alter table public.user_preferences
      add constraint user_preferences_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

-- ------------------------------------------------------- 2. privacy settings
create table if not exists public.privacy_settings (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  -- Every one of these defaults to the quietest answer.
  share_location        boolean not null default false,
  store_home_address    boolean not null default false,
  personalization       boolean not null default false,
  ai_recommendations    boolean not null default false,
  public_activity       boolean not null default false,
  public_rewards        boolean not null default false,
  -- Notifications are the exception the roadmap names: on by default, and
  -- the detail lives in notification_preferences.
  notification_categories jsonb not null default '{"enabled": true}'::jsonb,
  updated_at            timestamptz not null default now()
);

comment on table public.privacy_settings is
  'One row per person. Every switch defaults to the least sharing option. No row means every default.';

alter table public.privacy_settings enable row level security;
drop policy if exists privacy_settings_own on public.privacy_settings;
create policy privacy_settings_own on public.privacy_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------- 3. the reader
-- One question, one answer, usable from any policy or function. A person with
-- no row gets the defaults, so a new account is private without doing
-- anything.
create or replace function public.privacy_allows(p_user_id uuid, p_setting text)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case p_setting
              when 'share_location'     then s.share_location
              when 'store_home_address' then s.store_home_address
              when 'personalization'    then s.personalization
              when 'ai_recommendations' then s.ai_recommendations
              when 'public_activity'    then s.public_activity
              when 'public_rewards'     then s.public_rewards
              else false
            end
       from public.privacy_settings s where s.user_id = p_user_id),
    false);
$$;

grant execute on function public.privacy_allows(uuid, text) to authenticated;

create or replace function public.my_privacy_settings()
returns table (
  share_location boolean, store_home_address boolean, personalization boolean,
  ai_recommendations boolean, public_activity boolean, public_rewards boolean,
  notification_categories jsonb
)
language sql stable security invoker set search_path = public as $$
  select coalesce(s.share_location, false),
         coalesce(s.store_home_address, false),
         coalesce(s.personalization, false),
         coalesce(s.ai_recommendations, false),
         coalesce(s.public_activity, false),
         coalesce(s.public_rewards, false),
         coalesce(s.notification_categories, '{"enabled": true}'::jsonb)
    from (select 1) one
    left join public.privacy_settings s on s.user_id = auth.uid();
$$;

-- Turning "keep my address" off forgets the address, rather than keeping it
-- and promising not to look. A promise is not a control.
create or replace function public.set_privacy_setting(p_setting text, p_value boolean)
returns void
language plpgsql security invoker set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if p_setting not in ('share_location', 'store_home_address', 'personalization',
                       'ai_recommendations', 'public_activity', 'public_rewards') then
    raise exception 'There is no setting called %', p_setting using errcode = '22023';
  end if;

  insert into public.privacy_settings (user_id) values (v_user)
  on conflict (user_id) do nothing;

  execute format('update public.privacy_settings set %I = $1, updated_at = now() where user_id = $2',
                 p_setting)
    using coalesce(p_value, false), v_user;

  if p_setting = 'store_home_address' and coalesce(p_value, false) = false then
    delete from public.resident_homes where user_id = v_user;
  end if;
end $$;

grant execute on function public.my_privacy_settings() to authenticated;
grant execute on function public.set_privacy_setting(text, boolean) to authenticated;

-- ------------------------------------------- 4. the home respects the switch
create or replace function public.set_home_parcel(p_parcel_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user       uuid := auth.uid();
  v_hood       uuid;
  v_old_parcel uuid;
  v_old_hood   uuid;
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if p_parcel_id is null then raise exception 'No parcel given'; end if;

  -- Privacy first. The default is off, so this is the normal path for a new
  -- account, and the message has to explain rather than just refuse.
  if not public.privacy_allows(v_user, 'store_home_address') then
    raise exception 'Turn on "Keep my address" in Privacy before saving a home.'
      using errcode = '42501';
  end if;

  select neighborhood_id into v_hood from public.parcels where id = p_parcel_id;
  if not found then raise exception 'Unknown parcel'; end if;

  select rh.parcel_id, p.neighborhood_id into v_old_parcel, v_old_hood
  from public.resident_homes rh
  left join public.parcels p on p.id = rh.parcel_id
  where rh.user_id = v_user;

  insert into public.resident_homes (user_id, parcel_id, verified_at)
  values (v_user, p_parcel_id, null)
  on conflict (user_id) do update
    set parcel_id = excluded.parcel_id, verified_at = null, updated_at = now();

  if v_old_parcel is not null and v_old_parcel <> p_parcel_id then
    delete from public.entity_follows f
    where f.user_id = v_user
      and f.entity_id = public.citygraph_entity_id('parcels', v_old_parcel);
  end if;
  if v_old_hood is not null and v_old_hood is distinct from v_hood then
    delete from public.entity_follows f
    where f.user_id = v_user
      and f.entity_id = public.citygraph_entity_id('neighborhoods', v_old_hood);
  end if;

  insert into public.entity_follows (user_id, entity_id)
  select v_user, public.citygraph_entity_id('parcels', p_parcel_id)
  where public.citygraph_entity_id('parcels', p_parcel_id) is not null
  on conflict do nothing;

  if v_hood is not null then
    insert into public.entity_follows (user_id, entity_id)
    select v_user, public.citygraph_entity_id('neighborhoods', v_hood)
    where public.citygraph_entity_id('neighborhoods', v_hood) is not null
    on conflict do nothing;
  end if;
end $$;

-- ------------------------------------- 5. search stops using a home you hid
-- citygraph_search sorts by distance from the caller's home. With location
-- sharing off, it must not, and the results simply carry no distance.
do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'citygraph_search';

  if v_def is not null and position('privacy_allows' in v_def) = 0 then
    v_def := replace(v_def,
      'where rh.user_id = auth.uid()',
      'where rh.user_id = auth.uid() and public.privacy_allows(auth.uid(), ''share_location'')');
    execute v_def;
  end if;
end $$;

do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'my_city_near_me';

  if v_def is not null and position('privacy_allows' in v_def) = 0 then
    v_def := replace(v_def,
      'where rh.user_id = auth.uid()',
      'where rh.user_id = auth.uid() and public.privacy_allows(auth.uid(), ''share_location'')');
    execute v_def;
  end if;
end $$;
