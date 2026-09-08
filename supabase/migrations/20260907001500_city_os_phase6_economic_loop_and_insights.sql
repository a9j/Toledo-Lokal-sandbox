-- Phase 6, part two: where the money goes, what a business should do about it,
-- and how to start one.
--
--   business_suppliers   a business tags who it buys from. Each tag writes a
--                        'supplies' edge into city_edges, so the chain lives in
--                        the graph rather than in a table off to the side.
--   local_economic_loop  monthly Loop spend plus that chain, in one read.
--   business_insights    a few plain sentences a business can act on, generated
--                        from counts it already has.
--   app_settings         the Start a Business checklist, editable JSON.

-- ------------------------------------------------------- supplier tagging

create table if not exists public.business_suppliers (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  -- Either a local business we know about, or a name typed in free. A supplier
  -- outside Toledo still matters: it is the leak the loop is measuring.
  supplier_id    uuid references public.businesses(id) on delete cascade,
  supplier_name  text,
  category       text,
  is_local       boolean not null default true,
  -- Roughly what leaves per month. Optional, and never shown per supplier to
  -- anyone but the business itself.
  monthly_spend  numeric,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint business_suppliers_has_target
    check (supplier_id is not null or coalesce(trim(supplier_name), '') <> ''),
  constraint business_suppliers_not_self check (supplier_id is distinct from business_id)
);

create unique index if not exists business_suppliers_pair_idx
  on public.business_suppliers (business_id, supplier_id)
  where supplier_id is not null;
create index if not exists business_suppliers_supplier_idx
  on public.business_suppliers (supplier_id);

alter table public.business_suppliers enable row level security;

-- Who supplies whom is public: that is the whole point of drawing the chain.
-- What it costs is not, so monthly_spend is filtered out of the public read
-- below rather than being exposed on the row.
drop policy if exists business_suppliers_read  on public.business_suppliers;
drop policy if exists business_suppliers_write on public.business_suppliers;
drop policy if exists business_suppliers_admin on public.business_suppliers;
create policy business_suppliers_read on public.business_suppliers for select
  using (true);
create policy business_suppliers_write on public.business_suppliers for all
  using (public.user_owns_business(business_id))
  with check (public.user_owns_business(business_id));
create policy business_suppliers_admin on public.business_suppliers for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- monthly_spend is on a world readable table, so take it off the column grant.
-- The public read below never selects it; the owner reads it through
-- my_suppliers, which is definer and checks ownership.
revoke select (monthly_spend) on public.business_suppliers from anon, authenticated;

-- A tag between two known businesses becomes a 'supplies' edge, pointing the
-- way the goods move: supplier supplies buyer.
create or replace function public.business_suppliers_sync_edge() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_from uuid; v_to uuid;
begin
  if tg_op = 'DELETE' then
    if old.supplier_id is null then return old; end if;
    delete from public.city_edges ce
    using public.city_entities s, public.city_entities b
    where s.source_table = 'businesses' and s.source_id = old.supplier_id
      and b.source_table = 'businesses' and b.source_id = old.business_id
      and ce.from_entity = s.id and ce.to_entity = b.id and ce.relation = 'supplies';
    return old;
  end if;

  if new.supplier_id is null then return new; end if;

  select s.id, b.id into v_from, v_to
  from public.city_entities s, public.city_entities b
  where s.source_table = 'businesses' and s.source_id = new.supplier_id
    and b.source_table = 'businesses' and b.source_id = new.business_id;

  if v_from is not null and v_to is not null and v_from <> v_to then
    insert into public.city_edges (from_entity, to_entity, relation)
    values (v_from, v_to, 'supplies')
    on conflict (from_entity, to_entity, relation) do nothing;
  end if;

  return new;
end $$;

drop trigger if exists trg_business_suppliers_edge on public.business_suppliers;
create trigger trg_business_suppliers_edge
  after insert or update or delete on public.business_suppliers
  for each row execute function public.business_suppliers_sync_edge();

-- The owner's view of their own chain, spend included.
create or replace function public.my_suppliers(p_business_id uuid)
returns table (
  id            uuid,
  supplier_id   uuid,
  supplier_name text,
  category      text,
  is_local      boolean,
  monthly_spend numeric
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.user_owns_business(p_business_id) then
    raise exception 'Not your business.' using errcode = '42501';
  end if;
  return query
    select bs.id, bs.supplier_id, coalesce(b.name, bs.supplier_name),
           bs.category, bs.is_local, bs.monthly_spend
    from public.business_suppliers bs
    left join public.businesses b on b.id = bs.supplier_id
    where bs.business_id = p_business_id
    order by bs.is_local desc, bs.monthly_spend desc nulls last;
end $$;

revoke execute on function public.my_suppliers(uuid) from public, anon;
grant   execute on function public.my_suppliers(uuid) to authenticated;

-- --------------------------------------------------- local economic loop
--
-- Two halves, honestly separated.
--
-- Spend is summed from loop_transactions, which is the only record of money
-- moving that this app actually holds. Where there are no transactions the
-- answer is zero, and the UI says "no spend recorded yet" rather than drawing a
-- chart of nothing.
--
-- The chain is the 'supplies' edges. It is real whether or not any points have
-- ever moved, because a business tagging its suppliers is a statement of fact.
create or replace function public.local_economic_loop(p_months int default 6)
returns jsonb
language sql stable security invoker set search_path = public as $$
  with months as (
    select to_char(date_trunc('month', t.created_at), 'YYYY-MM') as month,
           sum(t.points)::bigint as points,
           count(*)::int as transactions,
           count(distinct t.business_id)::int as businesses
    from public.loop_transactions t
    where t.created_at >= date_trunc('month', now())
                          - ((least(greatest(coalesce(p_months, 6), 1), 24) - 1) || ' months')::interval
    group by 1
  ),
  top_businesses as (
    select b.id, b.name, sum(t.points)::bigint as points
    from public.loop_transactions t
    join public.businesses b on b.id = t.business_id
    group by b.id, b.name
    order by 3 desc
    limit 10
  ),
  chain as (
    select bs.business_id, buyer.name as buyer_name,
           bs.supplier_id, coalesce(sup.name, bs.supplier_name) as supplier_name,
           bs.is_local, bs.category
    from public.business_suppliers bs
    join public.businesses buyer on buyer.id = bs.business_id
    left join public.businesses sup on sup.id = bs.supplier_id
  )
  select jsonb_build_object(
    'months', coalesce((select jsonb_agg(jsonb_build_object(
                  'month', month, 'points', points,
                  'transactions', transactions, 'businesses', businesses)
                order by month) from months), '[]'::jsonb),
    'top_businesses', coalesce((select jsonb_agg(jsonb_build_object(
                  'business_id', id, 'name', name, 'points', points)) from top_businesses), '[]'::jsonb),
    'links', coalesce((select jsonb_agg(jsonb_build_object(
                  'business_id', business_id, 'buyer', buyer_name,
                  'supplier_id', supplier_id, 'supplier', supplier_name,
                  'is_local', is_local, 'category', category)) from chain), '[]'::jsonb),
    'supplier_count', (select count(*) from chain),
    'local_supplier_count', (select count(*) from chain where is_local),
    'has_spend_data', exists (select 1 from public.loop_transactions)
  );
$$;

grant execute on function public.local_economic_loop(int) to anon, authenticated;

-- ------------------------------------------------------- business insights

create table if not exists public.business_insights (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  kind        text not null,
  headline    text not null,
  detail      text,
  -- 1 is act on this now, 3 is worth knowing.
  priority    int not null default 2 check (priority between 1 and 3),
  metrics     jsonb not null default '{}',
  generated_at timestamptz not null default now()
);

create index if not exists business_insights_business_idx
  on public.business_insights (business_id, priority, generated_at desc);
create unique index if not exists business_insights_kind_idx
  on public.business_insights (business_id, kind);

alter table public.business_insights enable row level security;

-- An insight names this business's own weak spots. Only the business sees it.
drop policy if exists business_insights_read  on public.business_insights;
drop policy if exists business_insights_admin on public.business_insights;
create policy business_insights_read on public.business_insights for select
  using (public.user_owns_business(business_id) or public.is_platform_admin(auth.uid()));
create policy business_insights_admin on public.business_insights for all
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- The Business Command Center numbers, straight from tables the business
-- already generates.
create or replace function public.business_command_center(p_business_id uuid, p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_window interval; v_result jsonb;
begin
  if not (public.user_owns_business(p_business_id) or public.is_platform_admin(auth.uid())) then
    raise exception 'Not your business.' using errcode = '42501';
  end if;
  v_window := (least(greatest(coalesce(p_days, 30), 1), 365) || ' days')::interval;

  select jsonb_build_object(
    'days', least(greatest(coalesce(p_days, 30), 1), 365),
    'profile_views', (select count(*) from public.analytics_events a
                       where a.business_id = p_business_id
                         and a.event_type = 'business_view'
                         and a.created_at > now() - v_window),
    'events_logged', (select count(*) from public.analytics_events a
                       where a.business_id = p_business_id
                         and a.created_at > now() - v_window),
    'checkins',      (select count(*) from public.passport_checkins c
                       where c.business_id = p_business_id
                         and c.created_at > now() - v_window),
    'deal_redemptions', (select count(*) from public.deal_redemptions d
                          where d.business_id = p_business_id
                            and d.redeemed_at > now() - v_window),
    'followers',     (select count(*) from public.entity_follows f
                       join public.city_entities e on e.id = f.entity_id
                       where e.source_table = 'businesses' and e.source_id = p_business_id),
    'active_deals',  (select count(*) from public.deals d
                       where d.business_id = p_business_id and d.status = 'approved'
                         and (d.start_date is null or d.start_date <= current_date)
                         and (d.end_date is null or d.end_date >= current_date)),
    'open_jobs',     (select count(*) from public.jobs j
                       where j.business_id = p_business_id and j.status = 'approved'),
    'upcoming_events', (select count(*) from public.events ev
                         where ev.business_id = p_business_id and ev.status = 'approved'
                           and ev.start_date_time > now()),
    'suppliers',     (select count(*) from public.business_suppliers bs
                       where bs.business_id = p_business_id),
    'local_suppliers', (select count(*) from public.business_suppliers bs
                         where bs.business_id = p_business_id and bs.is_local)
  ) into v_result;

  return v_result;
end $$;

revoke execute on function public.business_command_center(uuid, int) from public, anon;
grant   execute on function public.business_command_center(uuid, int) to authenticated;

-- Recommendations, derived from those same counts.
--
-- The plan asks for a nightly job. Nothing in this sandbox runs cron, so this
-- is a function the dashboard calls instead, and it is idempotent: the same
-- inputs overwrite the same rows rather than piling up. Pointing a scheduler at
-- it later is a one line change and nothing above it moves.
create or replace function public.refresh_business_insights(p_business_id uuid)
returns int
language plpgsql security definer set search_path = public as $$
declare v_stats jsonb; v_written int := 0;
begin
  if not (public.user_owns_business(p_business_id) or public.is_platform_admin(auth.uid())) then
    raise exception 'Not your business.' using errcode = '42501';
  end if;

  v_stats := public.business_command_center(p_business_id, 30);

  delete from public.business_insights where business_id = p_business_id;

  -- Each rule states the number it is built on, so a business owner can check
  -- the advice rather than take it on faith.
  if (v_stats ->> 'active_deals')::int = 0 then
    insert into public.business_insights (business_id, kind, headline, detail, priority, metrics)
    values (p_business_id, 'no_active_deal',
            'You have no deal running',
            'A live deal is the most common reason someone opens a business page here. Adding one takes a minute.',
            1, jsonb_build_object('active_deals', 0));
    v_written := v_written + 1;
  end if;

  if (v_stats ->> 'followers')::int < 10 then
    insert into public.business_insights (business_id, kind, headline, detail, priority, metrics)
    values (p_business_id, 'few_followers',
            'Only ' || (v_stats ->> 'followers') || ' people follow you',
            'Followers get your changes in their Civic Inbox. Ask regulars to follow you when they are in.',
            2, jsonb_build_object('followers', (v_stats ->> 'followers')::int));
    v_written := v_written + 1;
  end if;

  if (v_stats ->> 'upcoming_events')::int = 0 then
    insert into public.business_insights (business_id, kind, headline, detail, priority, metrics)
    values (p_business_id, 'no_upcoming_event',
            'Nothing on your calendar',
            'One event a month keeps you in the city feed and in Ask Toledo answers about what is on.',
            3, jsonb_build_object('upcoming_events', 0));
    v_written := v_written + 1;
  end if;

  if (v_stats ->> 'suppliers')::int = 0 then
    insert into public.business_insights (business_id, kind, headline, detail, priority, metrics)
    values (p_business_id, 'no_suppliers',
            'Tag who you buy from',
            'It draws your part of the local supply chain and shows how much of your spend stays in Toledo.',
            3, jsonb_build_object('suppliers', 0));
    v_written := v_written + 1;
  elsif (v_stats ->> 'local_suppliers')::int = 0 then
    insert into public.business_insights (business_id, kind, headline, detail, priority, metrics)
    values (p_business_id, 'no_local_suppliers',
            'None of your suppliers are local',
            'Every one of them is money leaving Toledo. Procurement may have someone closer.',
            2, jsonb_build_object('local_suppliers', 0,
                                  'suppliers', (v_stats ->> 'suppliers')::int));
    v_written := v_written + 1;
  end if;

  if (v_stats ->> 'checkins')::int = 0 and (v_stats ->> 'deal_redemptions')::int = 0 then
    insert into public.business_insights (business_id, kind, headline, detail, priority, metrics)
    values (p_business_id, 'no_footfall_signal',
            'No check ins or redemptions in 30 days',
            'Either nobody is scanning, or your QR code is somewhere people do not see it. Both are fixable.',
            2, jsonb_build_object('checkins', 0, 'deal_redemptions', 0));
    v_written := v_written + 1;
  end if;

  return v_written;
end $$;

revoke execute on function public.refresh_business_insights(uuid) from public, anon;
grant   execute on function public.refresh_business_insights(uuid) to authenticated;

-- --------------------------------------------------- start a business

insert into public.app_settings (key, value)
values ('start_a_business', jsonb_build_object(
  'note', 'A rough order, not legal advice. Check every step with the office named.',
  'steps', jsonb_build_array(
    jsonb_build_object('key','idea','title','Write down what you sell and to whom',
      'body','One paragraph. If it takes longer than that, the idea is still two ideas.',
      'category', null),
    jsonb_build_object('key','name','title','Check the name is free',
      'body','Search the Ohio Secretary of State business register before you print anything.',
      'category','professional_service'),
    jsonb_build_object('key','structure','title','Pick a structure and register it',
      'body','Sole trader, LLC or corporation. An accountant will save you more than they cost here.',
      'category','professional_service'),
    jsonb_build_object('key','ein','title','Get an EIN',
      'body','Free from the IRS, online, same day. You need it to open a business bank account.',
      'category', null),
    jsonb_build_object('key','bank','title','Open a business account',
      'body','Keep it separate from your own money from day one. It makes tax time an afternoon, not a week.',
      'category','professional_service'),
    jsonb_build_object('key','licence','title','Check what licence you need',
      'body','Food, childcare, trades and anything with a vehicle all have their own. Ask the city before you sign a lease.',
      'category', null),
    jsonb_build_object('key','space','title','Find a space',
      'body','Empty Space lists what is available now. Rent is not the only cost: ask about utilities and repairs.',
      'category', null),
    jsonb_build_object('key','insurance','title','Get insured',
      'body','General liability at minimum. Your landlord and your first big customer will both ask for proof.',
      'category','professional_service'),
    jsonb_build_object('key','suppliers','title','Line up suppliers',
      'body','Procurement lists what other Toledo businesses are buying, and who they buy it from.',
      'category', null),
    jsonb_build_object('key','listing','title','List yourself here',
      'body','A page, a deal and one event. That is enough to be findable in Ask Toledo.',
      'category', null))))
on conflict (key) do update set value = excluded.value;
