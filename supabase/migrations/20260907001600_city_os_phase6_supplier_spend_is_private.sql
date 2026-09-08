-- Phase 6 fix: a private number on a world readable table, again.
--
-- business_suppliers is public on purpose. Who supplies whom is the whole point
-- of drawing the local chain, and it is the kind of thing a city should be able
-- to see. But I put monthly_spend on that same row and tried to protect it with
--
--   revoke select (monthly_spend) on public.business_suppliers from anon, authenticated;
--
-- which does nothing. Those roles hold a table wide SELECT grant, and in
-- Postgres a table level grant already covers every column: revoking one column
-- while the table grant stands changes nothing. Checked rather than assumed:
-- has_column_privilege('anon', 'public.business_suppliers', 'monthly_spend',
-- 'select') came back true.
--
-- This is the Phase 2 home address leak in a different costume, and it has the
-- same fix. RLS is row level, so no policy can hide one column; the number has
-- to live on a row that the public cannot select at all.
--
-- What leaked, had this shipped: what every business in Toledo pays each of its
-- suppliers every month. That is commercially sensitive to the buyer and to the
-- supplier, and it is exactly the sort of thing a competitor would read first.

create table if not exists public.business_supplier_spend (
  supplier_link_id uuid primary key
                   references public.business_suppliers(id) on delete cascade,
  monthly_spend    numeric,
  updated_at       timestamptz not null default now()
);

alter table public.business_supplier_spend enable row level security;

-- Only the business that recorded it. No admin read policy: there is no product
-- reason for staff to browse what a bakery pays for flour.
drop policy if exists business_supplier_spend_all on public.business_supplier_spend;
create policy business_supplier_spend_all on public.business_supplier_spend for all
  using (exists (select 1 from public.business_suppliers bs
                  where bs.id = supplier_link_id
                    and public.user_owns_business(bs.business_id)))
  with check (exists (select 1 from public.business_suppliers bs
                       where bs.id = supplier_link_id
                         and public.user_owns_business(bs.business_id)));

-- Move what is already there, then take the column off the public row.
insert into public.business_supplier_spend (supplier_link_id, monthly_spend)
select id, monthly_spend from public.business_suppliers
where monthly_spend is not null
on conflict (supplier_link_id) do update set monthly_spend = excluded.monthly_spend;

alter table public.business_suppliers drop column if exists monthly_spend;

-- The revoke above was a no op against a table wide grant, and the column it
-- named is gone. Nothing to undo.

-- Record the spend for one of your own supplier links.
create or replace function public.set_supplier_spend(p_link_id uuid, p_monthly_spend numeric)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.business_suppliers bs
                  where bs.id = p_link_id and public.user_owns_business(bs.business_id)) then
    raise exception 'Not your supplier link.' using errcode = '42501';
  end if;

  insert into public.business_supplier_spend (supplier_link_id, monthly_spend, updated_at)
  values (p_link_id, p_monthly_spend, now())
  on conflict (supplier_link_id) do update
    set monthly_spend = excluded.monthly_spend, updated_at = now();
end $$;

revoke execute on function public.set_supplier_spend(uuid, numeric) from public, anon;
grant   execute on function public.set_supplier_spend(uuid, numeric) to authenticated;

-- my_suppliers now reads the spend from its own table. Same signature, so
-- nothing calling it has to change.
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
           bs.category, bs.is_local, sp.monthly_spend
    from public.business_suppliers bs
    left join public.businesses b on b.id = bs.supplier_id
    left join public.business_supplier_spend sp on sp.supplier_link_id = bs.id
    where bs.business_id = p_business_id
    order by bs.is_local desc, sp.monthly_spend desc nulls last;
end $$;

revoke execute on function public.my_suppliers(uuid) from public, anon;
grant   execute on function public.my_suppliers(uuid) to authenticated;

-- What share of a business's own spend stays in Toledo. Definer and ownership
-- checked, because the shares are computed from the private numbers.
create or replace function public.my_local_spend_share(p_business_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_local numeric; v_total numeric;
begin
  if not public.user_owns_business(p_business_id) then
    raise exception 'Not your business.' using errcode = '42501';
  end if;

  select coalesce(sum(sp.monthly_spend) filter (where bs.is_local), 0),
         coalesce(sum(sp.monthly_spend), 0)
    into v_local, v_total
  from public.business_suppliers bs
  join public.business_supplier_spend sp on sp.supplier_link_id = bs.id
  where bs.business_id = p_business_id;

  return jsonb_build_object(
    'local_monthly', v_local,
    'total_monthly', v_total,
    'local_share', case when v_total > 0 then round(v_local / v_total, 3) end);
end $$;

revoke execute on function public.my_local_spend_share(uuid) from public, anon;
grant   execute on function public.my_local_spend_share(uuid) to authenticated;

-- One more that slipped through: business_suppliers_sync_edge is SECURITY
-- DEFINER and its two siblings were revoked but it was not, so it sat at
-- /rest/v1/rpc/ reachable by anon. Calling a trigger function directly raises
-- "trigger functions can only be called as triggers", so nothing could be done
-- with it, but Phase 1 shipped fifteen of these and the rule since then has
-- been that no trigger body is callable. Consistency is the whole defence.
revoke execute on function public.business_suppliers_sync_edge()
  from public, anon, authenticated;

-- Clearing a figure is a real thing an owner does, so p_monthly_spend defaults
-- to null and omitting it means "no longer recording this". Without the default
-- the generated client types map the parameter to a non-nullable number, and
-- the only way to clear one was to cast past the type.
create or replace function public.set_supplier_spend(
  p_link_id uuid,
  p_monthly_spend numeric default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.business_suppliers bs
                  where bs.id = p_link_id and public.user_owns_business(bs.business_id)) then
    raise exception 'Not your supplier link.' using errcode = '42501';
  end if;

  insert into public.business_supplier_spend (supplier_link_id, monthly_spend, updated_at)
  values (p_link_id, p_monthly_spend, now())
  on conflict (supplier_link_id) do update
    set monthly_spend = excluded.monthly_spend, updated_at = now();
end $$;

revoke execute on function public.set_supplier_spend(uuid, numeric) from public, anon;
grant   execute on function public.set_supplier_spend(uuid, numeric) to authenticated;
