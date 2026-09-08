-- Phase 7, part three: plugins, entity targets, neighborhood stats, and the year
-- in review.

-- ---------------------------------------------------------------- plugins
--
-- A plugin is an organisation declaring screens and actions. The manifest is
-- jsonb so a plugin can ship without a migration, and the shape is checked here
-- rather than trusted, because a manifest is third party content.
--
-- Ask Toledo reading actions as tools is NOT wired. The two model calls have
-- never run in this environment (Phases 3 to 6), and handing an unexercised
-- model a set of callable actions would be building a second untested thing on
-- top of a first one. The registry, the validation and the surfacing are here;
-- the tool binding waits until one real question has been answered.

create table if not exists public.plugins (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  summary      text,
  -- The organisation that owns it, as a CityGraph entity. Null for platform
  -- plugins like the city's own report flow.
  org_entity   uuid references public.city_entities(id) on delete set null,
  -- {screens: [{key,title,route}], actions: [{key,title,kind,target,params}]}
  -- kind is one of: deep_link, internal_route, rpc.
  manifest     jsonb not null default '{}',
  status       text not null default 'draft'
               check (status in ('draft','review','published','suspended')),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists plugins_status_idx on public.plugins (status, name);

alter table public.plugins enable row level security;

-- Published plugins are a public directory. Everything else is its author's and
-- an admin's, so a draft manifest is not browsable before anyone has read it.
drop policy if exists plugins_read  on public.plugins;
drop policy if exists plugins_own   on public.plugins;
drop policy if exists plugins_admin on public.plugins;
create policy plugins_read on public.plugins for select
  using (status = 'published'
         or auth.uid() = created_by
         or public.is_platform_admin(auth.uid()));
create policy plugins_own on public.plugins for all
  using (auth.uid() = created_by and status in ('draft','review'))
  with check (auth.uid() = created_by and status in ('draft','review'));
create policy plugins_admin on public.plugins for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- A manifest is third party content, so its shape is checked on the way in
-- rather than assumed on the way out. Anything malformed is refused with a
-- message naming the problem.
create or replace function public.plugins_validate_manifest() returns trigger
language plpgsql set search_path = public as $$
declare v_action jsonb; v_screen jsonb;
begin
  if jsonb_typeof(new.manifest) <> 'object' then
    raise exception 'Manifest must be an object.' using errcode = '22023';
  end if;

  if new.manifest ? 'screens' then
    if jsonb_typeof(new.manifest -> 'screens') <> 'array' then
      raise exception 'Manifest screens must be an array.' using errcode = '22023';
    end if;
    for v_screen in select * from jsonb_array_elements(new.manifest -> 'screens') loop
      if coalesce(v_screen ->> 'key', '') = '' or coalesce(v_screen ->> 'title', '') = '' then
        raise exception 'Every screen needs a key and a title.' using errcode = '22023';
      end if;
    end loop;
  end if;

  if new.manifest ? 'actions' then
    if jsonb_typeof(new.manifest -> 'actions') <> 'array' then
      raise exception 'Manifest actions must be an array.' using errcode = '22023';
    end if;
    for v_action in select * from jsonb_array_elements(new.manifest -> 'actions') loop
      if coalesce(v_action ->> 'key', '') = '' or coalesce(v_action ->> 'title', '') = '' then
        raise exception 'Every action needs a key and a title.' using errcode = '22023';
      end if;
      if coalesce(v_action ->> 'kind', '') not in ('deep_link','internal_route','rpc') then
        raise exception 'Action kind must be deep_link, internal_route or rpc.'
          using errcode = '22023';
      end if;
      -- A deep link must be a real external URL, not javascript: or data:.
      if v_action ->> 'kind' = 'deep_link'
         and coalesce(v_action ->> 'target', '') !~ '^https?://' then
        raise exception 'A deep_link target must be an http or https URL.'
          using errcode = '22023';
      end if;
      -- An internal route must stay inside the app. The second character
      -- matters: "//evil.example.com" is a protocol relative URL, and a browser
      -- follows it straight off the site. An earlier version of this check
      -- allowed it, because '/' was in the character class for the whole
      -- string. The first segment must now start with a letter, digit or
      -- underscore, which rejects "//host" and "/\\host" alike.
      if v_action ->> 'kind' = 'internal_route'
         and coalesce(v_action ->> 'target', '') !~ '^/[A-Za-z0-9_][A-Za-z0-9/_:.-]*$' then
        raise exception 'An internal_route target must be an app path starting with / and a letter, digit or underscore.'
          using errcode = '22023';
      end if;
    end loop;
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_plugins_validate on public.plugins;
create trigger trg_plugins_validate before insert or update on public.plugins
  for each row execute function public.plugins_validate_manifest();

create or replace function public.published_plugins()
returns table (
  id uuid, slug text, name text, summary text,
  org_entity uuid, org_name text, manifest jsonb
)
language sql stable security invoker set search_path = public as $$
  select p.id, p.slug, p.name, p.summary, p.org_entity, e.name, p.manifest
  from public.plugins p
  left join public.city_entities e on e.id = p.org_entity
  where p.status = 'published'
  order by p.name;
$$;

grant execute on function public.published_plugins() to anon, authenticated;

-- ------------------------------------------------- entity targets on Loop
--
-- The plan asks for an entity_id target on missions, stamps and challenges so
-- anything in the graph can be a step. Nullable columns, so nothing existing
-- changes behaviour.

alter table public.loop_missions
  add column if not exists target_entity_id uuid references public.city_entities(id) on delete set null;
alter table public.passport_stamps
  add column if not exists target_entity_id uuid references public.city_entities(id) on delete set null;
alter table public.challenges
  add column if not exists target_entity_id uuid references public.city_entities(id) on delete set null;

create index if not exists loop_missions_entity_idx   on public.loop_missions (target_entity_id);
create index if not exists passport_stamps_entity_idx on public.passport_stamps (target_entity_id);
create index if not exists challenges_entity_idx      on public.challenges (target_entity_id);

-- ------------------------------------------------------- neighborhood stats
--
-- The Health Dashboard and the Digital Twin are the same numbers at two levels
-- of drama. These are counts of things the graph already holds, so they are
-- computed live rather than stored: a stored copy would need a nightly job that
-- does not exist here, and would be wrong between runs.

create or replace function public.neighborhood_stats(p_neighborhood_id uuid default null)
returns table (
  neighborhood_id   uuid,
  neighborhood_name text,
  businesses        int,
  nonprofits        int,
  jobs_open         int,
  events_upcoming   int,
  developments      int,
  under_construction int,
  spaces_available  int,
  issues_open       int,
  issues_completed  int,
  memories          int,
  changes_30d       int,
  parcels           int
)
language sql stable security invoker set search_path = public as $$
  select n.id, n.name,
    (select count(*)::int from public.businesses b
      where b.neighborhood_id = n.id and b.status = 'approved'),
    (select count(*)::int from public.nonprofits np
      where np.neighborhood_id = n.id and np.status = 'active'),
    (select count(*)::int from public.jobs j
      join public.businesses b on b.id = j.business_id
      where b.neighborhood_id = n.id and j.status = 'approved'),
    (select count(*)::int from public.events ev
      join public.businesses b on b.id = ev.business_id
      where b.neighborhood_id = n.id and ev.status = 'approved'
        and ev.start_date_time > now()),
    (select count(*)::int from public.developments d where d.neighborhood_id = n.id),
    (select count(*)::int from public.developments d
      where d.neighborhood_id = n.id and d.status = 'under_construction'),
    (select count(*)::int from public.spaces s
      where s.neighborhood_id = n.id and s.status = 'available'),
    (select count(*)::int from public.issues i
      where i.neighborhood_id = n.id and i.status <> 'completed'),
    (select count(*)::int from public.issues i
      where i.neighborhood_id = n.id and i.status = 'completed'),
    (select count(*)::int from public.memory_items m
      join public.city_entities e on e.id = m.entity_id
      where e.neighborhood_id = n.id and m.approved),
    (select count(*)::int from public.city_events_log l
      join public.city_entities e on e.id = l.entity_id
      where e.neighborhood_id = n.id
        and coalesce(l.occurs_at, l.created_at) > now() - interval '30 days'),
    (select count(*)::int from public.parcels pa where pa.neighborhood_id = n.id)
  from public.neighborhoods n
  where p_neighborhood_id is null or n.id = p_neighborhood_id
  order by n.name;
$$;

grant execute on function public.neighborhood_stats(uuid) to anon, authenticated;

-- --------------------------------------------------------- my Toledo year
--
-- What one resident did in a year. Invoker, so it can only ever be the
-- caller's own: there is no user id argument by design.
--
-- The plan asks for a shareable card image. Rendering an image is not something
-- this codebase can do yet, so this returns the numbers and the UI shows them.
-- An image generator is a separate job with its own decisions about what a
-- shareable card reveals.
create or replace function public.my_toledo_year(p_year int default null)
returns jsonb
language sql stable security invoker set search_path = public as $$
  with bounds as (
    select make_timestamptz(coalesce(p_year, extract(year from now())::int), 1, 1, 0, 0, 0) as from_at,
           make_timestamptz(coalesce(p_year, extract(year from now())::int) + 1, 1, 1, 0, 0, 0) as to_at
  )
  select jsonb_build_object(
    'year', coalesce(p_year, extract(year from now())::int),
    'follows', (select count(*) from public.entity_follows f
                 where f.user_id = auth.uid()
                   and f.created_at >= (select from_at from bounds)
                   and f.created_at <  (select to_at from bounds)),
    'following_now', (select count(*) from public.entity_follows f where f.user_id = auth.uid()),
    'checkins', (select count(*) from public.passport_checkins c
                  where c.user_id = auth.uid()
                    and c.created_at >= (select from_at from bounds)
                    and c.created_at <  (select to_at from bounds)),
    'issues_reported', (select count(*) from public.issue_reporters ir
                         join public.issues i on i.id = ir.issue_id
                         where ir.reporter_id = auth.uid()
                           and ir.created_at >= (select from_at from bounds)
                           and ir.created_at <  (select to_at from bounds)),
    'memories_added', (select count(*) from public.memory_items m
                        where m.contributor_id = auth.uid()
                          and m.created_at >= (select from_at from bounds)
                          and m.created_at <  (select to_at from bounds)),
    'inbox_items', (select count(*) from public.inbox_items ii
                     where ii.user_id = auth.uid()
                       and ii.created_at >= (select from_at from bounds)
                       and ii.created_at <  (select to_at from bounds)),
    'neighborhoods_followed', (select count(distinct e.neighborhood_id)
                                from public.entity_follows f
                                join public.city_entities e on e.id = f.entity_id
                                where f.user_id = auth.uid() and e.neighborhood_id is not null),
    'top_kinds', coalesce((
      select jsonb_agg(x) from (
        select jsonb_build_object('kind', e.kind::text, 'count', count(*)) as x
        from public.entity_follows f
        join public.city_entities e on e.id = f.entity_id
        where f.user_id = auth.uid()
        group by e.kind
        order by count(*) desc
        limit 5
      ) t), '[]'::jsonb)
  );
$$;

grant execute on function public.my_toledo_year(int) to authenticated;

revoke execute on function public.plugins_validate_manifest() from public, anon, authenticated;
