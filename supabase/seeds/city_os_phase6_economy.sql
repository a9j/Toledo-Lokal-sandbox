-- Phase 6 demo seed: eight empty spaces, a supplier chain, and job filters.
--
-- INVENTED, like every seed in this repo except the Phase 4 opportunities. The
-- spaces sit on the invented parcels from Phase 2 and carry a deliberately
-- unusable contact address. Nothing here describes a real listing.
--
-- What is NOT seeded, on purpose: loop_transactions. Points move only when a
-- real person scans a real code, and faking a few months of spend would put a
-- chart of invented money on the Local Economic Loop page. The function reports
-- has_spend_data false and the page says so instead.

-- ---------------------------------------------------------------- spaces
--
-- Parcel offset 7 so these do not collide with the two the Phase 5
-- developments seed takes from each neighborhood.

with hood as (
  select n.id, n.name,
         (select p.id from public.parcels p
           where p.neighborhood_id = n.id order by p.address offset 7 limit 1) as parcel
  from public.neighborhoods n
),
spec (hood_name, name, kind, sqft, rent, description) as (values
  ('Downtown','Adams Street corner unit','storefront', 1400, 1650,
   'Glass on two sides, previously a print shop. Basement storage included.'),
  ('East Toledo','Front Street commercial kitchen','kitchen', 900, 1200,
   'Shared prep kitchen with walk in cooler. Nights and weekends available.'),
  ('Old West End','Collingwood ground floor studio','studio', 650, 750,
   'Single room with a sink and good north light. Suits an artist or a therapist.'),
  ('West Toledo','Sylvania Avenue office suite','office', 2200, 2400,
   'Four rooms and a reception, parking for eight.'),
  ('South Toledo','Broadway yard and shed','land', 8000, 900,
   'Fenced yard with a dry shed. Suits a trade needing somewhere to park a van.'),
  ('Maumee','Conant Street pop up','popup', 500, 600,
   'Six month term, fully fitted. Good for testing an idea before signing a lease.'),
  ('Perrysburg','Louisiana Avenue warehouse bay','warehouse', 5200, 3100,
   'One loading dock, fourteen foot ceilings, three phase power.'),
  ('Sylvania','Main Street shop','storefront', 1100, 1400,
   'Between a bakery and a barber. Steady footfall on Saturdays.')
)
insert into public.spaces (name, kind, parcel_id, neighborhood_id, sqft, rent_monthly,
                           available_from, description, contact_name, contact_email, status)
select s.name, s.kind, h.parcel, h.id, s.sqft, s.rent,
       current_date + 30, s.description,
       'Sandbox listing', 'nobody@example.invalid', 'available'
from spec s join hood h on h.name = s.hood_name
where not exists (select 1 from public.spaces x where x.name = s.name);

-- -------------------------------------------------------- the supply chain
--
-- Ten links between demo businesses, which the trigger turns into 'supplies'
-- edges in city_edges, and four out of town suppliers, which deliberately do
-- not: a supplier outside Toledo is the leak the loop is measuring, and it has
-- no entity to point at.
--
-- Businesses are picked by creation order rather than by name so the seed does
-- not break if a demo business is renamed.

with b as (select id, row_number() over (order by created_at, id) as n from public.businesses)
insert into public.business_suppliers (business_id, supplier_id, supplier_name, category, is_local)
select buyer.id, sup.id, null, l.category, true
from (values (1,3,'produce'), (1,5,'baked goods'), (2,3,'produce'),
             (4,6,'coffee beans'), (7,5,'baked goods'), (8,3,'produce'),
             (9,6,'coffee beans'), (10,11,'printing'), (12,11,'printing'),
             (2,11,'printing')) as l(buyer_n, sup_n, category)
join b buyer on buyer.n = l.buyer_n
join b sup   on sup.n   = l.sup_n
where buyer.id <> sup.id
  and not exists (select 1 from public.business_suppliers x
                   where x.business_id = buyer.id and x.supplier_id = sup.id);

with b as (select id, row_number() over (order by created_at, id) as n from public.businesses)
insert into public.business_suppliers (business_id, supplier_id, supplier_name, category, is_local)
select buyer.id, null, l.sup_name, l.category, false
from (values (1,'Midwest Restaurant Supply (Detroit)','equipment'),
             (4,'National Paper Group','packaging'),
             (8,'Great Lakes Linen (Cleveland)','linen'),
             (10,'Ohio Wholesale Cleaning','cleaning')) as l(buyer_n, sup_name, category)
join b buyer on buyer.n = l.buyer_n
where not exists (select 1 from public.business_suppliers x
                   where x.business_id = buyer.id and x.supplier_name = l.sup_name);

-- Monthly spend goes in its own table, not on the public row. Anyone can see
-- who supplies whom; only the buying business can see what it pays.
with links as (
  select bs.id, bs.is_local,
         row_number() over (order by bs.created_at, bs.id) as n
  from public.business_suppliers bs
)
insert into public.business_supplier_spend (supplier_link_id, monthly_spend)
select l.id, v.amount
from links l
join (values (1,2400),(2,900),(3,1800),(4,1500),(5,600),(6,2100),(7,800),
             (8,450),(9,300),(10,260),(11,1900),(12,720),(13,540),(14,310))
  as v(n, amount) on v.n = l.n
on conflict (supplier_link_id) do nothing;

-- ------------------------------------------------------------- job filters
--
-- The eight seeded jobs get a spread across the ten new booleans so the
-- filters on the Jobs page have something to bite on.

with j as (select id, row_number() over (order by created_at, id) as n from public.jobs)
update public.jobs t set
  no_experience_needed = j.n in (1,3,5,7),
  transit_accessible   = j.n in (1,2,3,6,8),
  weekends_only        = j.n in (4,7),
  evenings_nights      = j.n in (2,5,7),
  teen_friendly        = j.n in (3,7),
  second_chance        = j.n in (1,5,6),
  benefits_offered     = j.n in (2,4,8),
  training_provided    = j.n in (1,4,6),
  weekly_pay           = j.n in (3,5,6),
  remote_ok            = j.n in (8)
from j where j.id = t.id;
