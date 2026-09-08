-- Phase 4, the second half, reconstructed.
--
-- These objects were applied to the sandbox during Phase 4 through the
-- management API and never written to a migration file, which the review of
-- the whole branch caught: anything built from git alone would have had the
-- Phase 4 tables and none of the functions the Phase 4 screens call.
-- report_issue, pledge_to_issue, match_opportunities and save_resident_profile
-- would all have been 404s, and the orphan entity sweep would not exist.
--
-- Every definition below was read back from the live sandbox with
-- pg_get_functiondef and the catalog, then written here verbatim. The file is
-- numbered to sit between the Phase 4 tables (001000) and the first Phase 5
-- migration (001100), which is the first thing that depends on it.
--
-- Everything is idempotent, so applying it to the sandbox that already holds
-- these objects is a no op, and that application is how the file was checked.

-- ---------------------------------------------------------- issue_pledges
--
-- Not loop_transactions. That table is a points ledger keyed by wallet_id with
-- a constrained enum and running lifetime balances; a pledge of 500 dollars or
-- 20 hours is not points.

create table if not exists public.issue_pledges (
  id         uuid primary key default gen_random_uuid(),
  issue_id   uuid not null references public.issues(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('money','hours','materials')),
  amount     numeric not null check (amount > 0),
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists issue_pledges_issue_idx on public.issue_pledges (issue_id);
create index if not exists issue_pledges_user_idx  on public.issue_pledges (user_id);

alter table public.issue_pledges enable row level security;

-- Only the running total on the issue is public. Who pledged what is not.
drop policy if exists issue_pledges_select on public.issue_pledges;
drop policy if exists issue_pledges_insert on public.issue_pledges;
create policy issue_pledges_select on public.issue_pledges for select
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy issue_pledges_insert on public.issue_pledges for insert
  with check (auth.uid() = user_id);

-- ------------------------------------------------------------ reporting

create or replace function public.report_issue(
  p_kind            text,
  p_title           text,
  p_description     text    default null,
  p_photo_url       text    default null,
  p_lat             numeric default null,
  p_lng             numeric default null,
  p_neighborhood_id uuid    default null,
  p_is_government   boolean default true,
  p_needs           jsonb   default '{}'::jsonb
) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_user uuid := auth.uid();
  v_id   uuid;
  v_loc  extensions.geography(point,4326);
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if coalesce(btrim(p_title), '') = '' then raise exception 'A title is required'; end if;

  if p_lat is not null and p_lng is not null then
    v_loc := extensions.st_setsrid(
               extensions.st_makepoint(p_lng::float8, p_lat::float8), 4326)::extensions.geography;
  end if;

  insert into public.issues
    (kind, title, description, photo_url, location, neighborhood_id, is_government, needs)
  values
    (p_kind, btrim(p_title), p_description, p_photo_url, v_loc, p_neighborhood_id,
     coalesce(p_is_government, true), coalesce(p_needs, '{}'))
  returning id into v_id;

  insert into public.issue_reporters (issue_id, reporter_id) values (v_id, v_user);

  -- Report it and you follow it, so its status changes reach your inbox.
  insert into public.entity_follows (user_id, entity_id)
  select v_user, public.citygraph_entity_id('issues', v_id)
  where public.citygraph_entity_id('issues', v_id) is not null
  on conflict do nothing;

  return v_id;
end $$;

create or replace function public.my_reported_issues()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select issue_id from public.issue_reporters where reporter_id = auth.uid();
$$;

create or replace function public.pledge_to_issue(
  p_issue_id uuid,
  p_kind     text,
  p_amount   numeric,
  p_note     text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_is_gov boolean;
begin
  if v_user is null then raise exception 'Not signed in'; end if;
  if p_kind not in ('money','hours','materials') then
    raise exception 'A pledge is money, hours or materials';
  end if;
  if coalesce(p_amount, 0) <= 0 then raise exception 'Pledge something above zero'; end if;

  select is_government into v_is_gov from public.issues where id = p_issue_id;
  if not found then raise exception 'Unknown issue'; end if;
  if v_is_gov then raise exception 'This one is for the city to fix, not for pledges'; end if;

  insert into public.issue_pledges (issue_id, user_id, kind, amount, note)
  values (p_issue_id, v_user, p_kind, p_amount, p_note);

  -- Roll it into the issue's public running total.
  update public.issues
     set progress = jsonb_set(coalesce(progress, '{}'), array[p_kind],
                      to_jsonb(coalesce((progress ->> p_kind)::numeric, 0) + p_amount)),
         updated_at = now()
   where id = p_issue_id;

  -- Pledging is a way of caring about it, so follow it too.
  insert into public.entity_follows (user_id, entity_id)
  select v_user, public.citygraph_entity_id('issues', p_issue_id)
  where public.citygraph_entity_id('issues', p_issue_id) is not null
  on conflict do nothing;
end $$;

-- --------------------------------------------------------- opportunities

-- A stated requirement only excludes when we know it is not met. Someone who
-- has told us nothing sees everything, because not knowing about a person
-- must never hide help from them.
create or replace function public.match_opportunities(p_limit int default 50)
returns table (
  id uuid, title text, provider text, category text, description text,
  url text, phone text, deadline date, life_events text[], eligibility jsonb,
  provenance jsonb, matched_on text[], missing_info boolean
)
language sql stable security definer set search_path = public as $$
  with me as (
    select * from public.resident_profiles where user_id = auth.uid()
  )
  select o.id, o.title, o.provider, o.category, o.description,
         o.url, o.phone, o.deadline, o.life_events, o.eligibility, o.provenance,
         array_remove(array[
           case when (o.eligibility ? 'homeowner')      and (select homeowner      from me) then 'homeowner' end,
           case when (o.eligibility ? 'renter')         and (select renter         from me) then 'renter' end,
           case when (o.eligibility ? 'senior')         and (select senior         from me) then 'senior' end,
           case when (o.eligibility ? 'veteran')        and (select veteran        from me) then 'veteran' end,
           case when (o.eligibility ? 'has_children')   and (select has_children   from me) then 'has children' end,
           case when (o.eligibility ? 'business_owner') and (select business_owner from me) then 'business owner' end,
           case when o.life_events && coalesce((select life_events from me), '{}') then 'life event' end
         ], null),
         (select user_id from me) is null
  from public.opportunities o
  where o.active
    and (o.deadline is null or o.deadline >= current_date)
    and (not (o.eligibility ? 'homeowner')      or coalesce((select homeowner      from me), true))
    and (not (o.eligibility ? 'renter')         or coalesce((select renter         from me), true))
    and (not (o.eligibility ? 'senior')         or coalesce((select senior         from me), true))
    and (not (o.eligibility ? 'veteran')        or coalesce((select veteran        from me), true))
    and (not (o.eligibility ? 'has_children')   or coalesce((select has_children   from me), true))
    and (not (o.eligibility ? 'business_owner') or coalesce((select business_owner from me), true))
    and (
      not (o.eligibility ? 'max_income_band')
      or (select income_band from me) is null
      or array_position(array['<30k','30-60k','60-100k','100k+'], (select income_band from me))
         <= array_position(array['<30k','30-60k','60-100k','100k+'], o.eligibility ->> 'max_income_band')
    )
  order by cardinality(array_remove(array[
             case when (o.eligibility ? 'homeowner')    and (select homeowner    from me) then 'x' end,
             case when (o.eligibility ? 'senior')       and (select senior       from me) then 'x' end,
             case when (o.eligibility ? 'veteran')      and (select veteran      from me) then 'x' end,
             case when (o.eligibility ? 'has_children') and (select has_children from me) then 'x' end,
             case when o.life_events && coalesce((select life_events from me), '{}') then 'x' end
           ], null)) desc,
           o.deadline nulls last, o.title
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

create or replace function public.save_resident_profile(p_patch jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Not signed in'; end if;

  insert into public.resident_profiles as rp (
    user_id, household_size, income_band, homeowner, renter, business_owner,
    veteran, senior, has_children, life_events, updated_at)
  values (
    v_user,
    nullif(p_patch ->> 'household_size','')::int,
    nullif(p_patch ->> 'income_band',''),
    (p_patch ->> 'homeowner')::boolean,
    (p_patch ->> 'renter')::boolean,
    (p_patch ->> 'business_owner')::boolean,
    (p_patch ->> 'veteran')::boolean,
    (p_patch ->> 'senior')::boolean,
    (p_patch ->> 'has_children')::boolean,
    coalesce((select array_agg(value::text) from jsonb_array_elements_text(p_patch -> 'life_events')), '{}'),
    now())
  on conflict (user_id) do update set
    household_size = coalesce(excluded.household_size, rp.household_size),
    income_band    = coalesce(excluded.income_band,    rp.income_band),
    homeowner      = coalesce(excluded.homeowner,      rp.homeowner),
    renter         = coalesce(excluded.renter,         rp.renter),
    business_owner = coalesce(excluded.business_owner, rp.business_owner),
    veteran        = coalesce(excluded.veteran,        rp.veteran),
    senior         = coalesce(excluded.senior,         rp.senior),
    has_children   = coalesce(excluded.has_children,   rp.has_children),
    life_events    = case when p_patch ? 'life_events' then excluded.life_events else rp.life_events end,
    updated_at     = now();
end $$;

-- ------------------------------------------------- orphan entity sweep
--
-- The registry keys on (source_table, source_id) with no foreign key, so a
-- deleted source row used to leave an entity behind that stayed searchable,
-- answerable and followable, pointing at a page that no longer existed. One
-- generic trigger, attached to every registered table.

create or replace function public.citygraph_deregister_entity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Cascades take the edges, change log rows and inbox items with it.
  delete from public.city_entities
   where source_table = tg_argv[0] and source_id = old.id;
  return old;
end $$;

drop trigger if exists trg_citygraph_del_businesses    on public.businesses;
drop trigger if exists trg_citygraph_del_neighborhoods on public.neighborhoods;
drop trigger if exists trg_citygraph_del_nonprofits    on public.nonprofits;
drop trigger if exists trg_citygraph_del_events        on public.events;
drop trigger if exists trg_citygraph_del_jobs          on public.jobs;
drop trigger if exists trg_citygraph_del_parcels       on public.parcels;
drop trigger if exists trg_citygraph_del_issues        on public.issues;
drop trigger if exists trg_citygraph_del_opportunities on public.opportunities;

create trigger trg_citygraph_del_businesses    after delete on public.businesses
  for each row execute function public.citygraph_deregister_entity('businesses');
create trigger trg_citygraph_del_neighborhoods after delete on public.neighborhoods
  for each row execute function public.citygraph_deregister_entity('neighborhoods');
create trigger trg_citygraph_del_nonprofits    after delete on public.nonprofits
  for each row execute function public.citygraph_deregister_entity('nonprofits');
create trigger trg_citygraph_del_events        after delete on public.events
  for each row execute function public.citygraph_deregister_entity('events');
create trigger trg_citygraph_del_jobs          after delete on public.jobs
  for each row execute function public.citygraph_deregister_entity('jobs');
create trigger trg_citygraph_del_parcels       after delete on public.parcels
  for each row execute function public.citygraph_deregister_entity('parcels');
create trigger trg_citygraph_del_issues        after delete on public.issues
  for each row execute function public.citygraph_deregister_entity('issues');
create trigger trg_citygraph_del_opportunities after delete on public.opportunities
  for each row execute function public.citygraph_deregister_entity('opportunities');

-- Sweep anything already orphaned.
delete from public.city_entities e
 where (e.source_table = 'businesses'    and not exists (select 1 from public.businesses    s where s.id = e.source_id))
    or (e.source_table = 'neighborhoods' and not exists (select 1 from public.neighborhoods s where s.id = e.source_id))
    or (e.source_table = 'nonprofits'    and not exists (select 1 from public.nonprofits    s where s.id = e.source_id))
    or (e.source_table = 'events'        and not exists (select 1 from public.events        s where s.id = e.source_id))
    or (e.source_table = 'jobs'          and not exists (select 1 from public.jobs          s where s.id = e.source_id))
    or (e.source_table = 'parcels'       and not exists (select 1 from public.parcels       s where s.id = e.source_id))
    or (e.source_table = 'issues'        and not exists (select 1 from public.issues        s where s.id = e.source_id))
    or (e.source_table = 'opportunities' and not exists (select 1 from public.opportunities s where s.id = e.source_id));

-- ------------------------------------------------------------ life events

insert into public.app_settings (key, value)
values ('life_events', jsonb_build_object(
  'note', 'Checklists are starting points, not legal or financial advice. Steps that mention a deadline should be checked against the provider.',
  'events', jsonb_build_array(
    jsonb_build_object('key','moved','label','I moved','categories',jsonb_build_array('utility','home_repair'),
      'steps',jsonb_build_array('Set your address in My City','Check your new trash day and recycling week','Update your voter registration','Set up utilities in your name')),
    jsonb_build_object('key','bought_house','label','I bought a house','categories',jsonb_build_array('home_repair','down_payment'),
      'steps',jsonb_build_array('Set your address in My City','Look up your council district and school district','Check whether you qualify for repair help','Find out when your first tax bill is due')),
    jsonb_build_object('key','had_baby','label','I had a baby','categories',jsonb_build_array('childcare','food'),
      'steps',jsonb_build_array('Look into childcare help','Check whether you qualify for food support','Add your child to your health cover')),
    jsonb_build_object('key','started_business','label','I started a business','categories',jsonb_build_array('business','workforce'),
      'steps',jsonb_build_array('Claim or add your business listing','Look at city grants and loans','Check what licences you need')),
    jsonb_build_object('key','lost_job','label','I lost my job','categories',jsonb_build_array('utility','food','emergency','workforce'),
      'steps',jsonb_build_array('File for unemployment','Ask about a utility payment plan before you fall behind','Find a food pantry near you','Look at training vouchers')),
    jsonb_build_object('key','income_dropped','label','My income dropped','categories',jsonb_build_array('utility','food','emergency'),
      'steps',jsonb_build_array('Ask your utility about a payment plan','Check emergency assistance','Check food support')),
    jsonb_build_object('key','eviction','label','I am facing eviction','categories',jsonb_build_array('emergency','housing'),
      'steps',jsonb_build_array('Get legal advice before your court date','Ask about emergency rent help','Do not miss the hearing, going changes the outcome')),
    jsonb_build_object('key','left_military','label','I left the military','categories',jsonb_build_array('veteran'),
      'steps',jsonb_build_array('Contact the Lucas County Veterans Service Commission','Get help filing a VA claim','Ask what temporary financial help you qualify for')),
    jsonb_build_object('key','retired','label','I retired','categories',jsonb_build_array('senior','utility'),
      'steps',jsonb_build_array('Check senior programmes in Lucas County','Ask about utility discounts','Look at property tax reductions for seniors')),
    jsonb_build_object('key','started_school','label','I started school','categories',jsonb_build_array('workforce','childcare'),
      'steps',jsonb_build_array('Check scholarships in your field','Look at childcare help if you have children')),
    jsonb_build_object('key','changed_career','label','I am changing career','categories',jsonb_build_array('workforce'),
      'steps',jsonb_build_array('Look at training vouchers','Check who is hiring locally')),
    jsonb_build_object('key','got_married','label','I got married','categories',jsonb_build_array(),
      'steps',jsonb_build_array('Update your name on records if it changed','Review your health cover','Update your address if you moved')),
    jsonb_build_object('key','divorced','label','I got divorced','categories',jsonb_build_array('emergency','housing'),
      'steps',jsonb_build_array('Update your address in My City','Review who is on the utility accounts','Check what help you qualify for on one income')),
    jsonb_build_object('key','bereaved','label','Someone close to me died','categories',jsonb_build_array('emergency'),
      'steps',jsonb_build_array('Ask about funeral cost help','Check what benefits transfer','Take your time, most of this can wait a week')),
    jsonb_build_object('key','became_carer','label','I became a carer','categories',jsonb_build_array('senior','emergency'),
      'steps',jsonb_build_array('Check respite and in home support','Ask about carer benefits')),
    jsonb_build_object('key','disability','label','I have a new disability','categories',jsonb_build_array('senior','emergency','home_repair'),
      'steps',jsonb_build_array('Ask about home accessibility changes','Check transport help','Look into benefits you may qualify for')),
    jsonb_build_object('key','new_to_toledo','label','I am new to Toledo','categories',jsonb_build_array('utility'),
      'steps',jsonb_build_array('Set your address in My City','Follow your neighborhood','Find your trash day and polling place')),
    jsonb_build_object('key','first_job','label','I got my first job','categories',jsonb_build_array('workforce'),
      'steps',jsonb_build_array('Check the bus route to work','Look at what your employer offers')))))
on conflict (key) do update set value = excluded.value;

-- ----------------------------------------------------------------- grants

revoke execute on function public.report_issue(text, text, text, text, numeric, numeric, uuid, boolean, jsonb)
  from public, anon;
revoke execute on function public.my_reported_issues()                  from public, anon;
revoke execute on function public.pledge_to_issue(uuid, text, numeric, text) from public, anon;
revoke execute on function public.match_opportunities(int)             from public, anon;
revoke execute on function public.save_resident_profile(jsonb)         from public, anon;
revoke execute on function public.citygraph_deregister_entity()        from public, anon, authenticated;

grant execute on function public.report_issue(text, text, text, text, numeric, numeric, uuid, boolean, jsonb)
  to authenticated;
grant execute on function public.my_reported_issues()                   to authenticated;
grant execute on function public.pledge_to_issue(uuid, text, numeric, text) to authenticated;
grant execute on function public.match_opportunities(int)              to authenticated;
grant execute on function public.save_resident_profile(jsonb)          to authenticated;
