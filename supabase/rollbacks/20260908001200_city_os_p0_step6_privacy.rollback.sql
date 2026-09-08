-- Rollback for Step 6.
--
-- Note what this restores: set_home_parcel saving a home without asking, and
-- search using a home the person asked us not to use. Prefer leaving Step 6
-- in place.

drop function if exists public.set_privacy_setting(text, boolean);
drop function if exists public.my_privacy_settings();
drop table if exists public.privacy_settings;
-- privacy_allows is dropped last, because the search functions reference it.
do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname='public' and p.proname='citygraph_search';
  if v_def is not null then
    execute replace(v_def,
      'where rh.user_id = auth.uid() and public.privacy_allows(auth.uid(), ''share_location'')',
      'where rh.user_id = auth.uid()');
  end if;

  select pg_get_functiondef(p.oid) into v_def from pg_proc p
   join pg_namespace n on n.oid = p.pronamespace
   where n.nspname='public' and p.proname='my_city_near_me';
  if v_def is not null then
    execute replace(v_def,
      'where rh.user_id = auth.uid() and public.privacy_allows(auth.uid(), ''share_location'')',
      'where rh.user_id = auth.uid()');
  end if;
end $$;
drop function if exists public.privacy_allows(uuid, text);

-- set_home_parcel goes back to saving without asking.
create or replace function public.set_home_parcel(p_parcel_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid(); v_hood uuid; v_old_parcel uuid; v_old_hood uuid;
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if p_parcel_id is null then raise exception 'No parcel given'; end if;
  select neighborhood_id into v_hood from public.parcels where id = p_parcel_id;
  if not found then raise exception 'Unknown parcel'; end if;
  select rh.parcel_id, p.neighborhood_id into v_old_parcel, v_old_hood
  from public.resident_homes rh left join public.parcels p on p.id = rh.parcel_id
  where rh.user_id = v_user;
  insert into public.resident_homes (user_id, parcel_id, verified_at)
  values (v_user, p_parcel_id, null)
  on conflict (user_id) do update
    set parcel_id = excluded.parcel_id, verified_at = null, updated_at = now();
  if v_old_parcel is not null and v_old_parcel <> p_parcel_id then
    delete from public.entity_follows f where f.user_id = v_user
      and f.entity_id = public.citygraph_entity_id('parcels', v_old_parcel);
  end if;
  if v_old_hood is not null and v_old_hood is distinct from v_hood then
    delete from public.entity_follows f where f.user_id = v_user
      and f.entity_id = public.citygraph_entity_id('neighborhoods', v_old_hood);
  end if;
  insert into public.entity_follows (user_id, entity_id)
  select v_user, public.citygraph_entity_id('parcels', p_parcel_id)
  where public.citygraph_entity_id('parcels', p_parcel_id) is not null on conflict do nothing;
  if v_hood is not null then
    insert into public.entity_follows (user_id, entity_id)
    select v_user, public.citygraph_entity_id('neighborhoods', v_hood)
    where public.citygraph_entity_id('neighborhoods', v_hood) is not null on conflict do nothing;
  end if;
end $$;

alter table public.loop_wallets     drop constraint if exists loop_wallets_user_id_fkey;
alter table public.user_preferences drop constraint if exists user_preferences_user_id_fkey;
