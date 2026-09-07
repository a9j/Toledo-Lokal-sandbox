-- Phase 5 demo seed: 16 developments and a short City Memory timeline.
--
-- INVENTED, like every seed in this repo except the Phase 4 opportunities.
-- The project names, developers, case numbers and amounts are made up, and they
-- sit on the invented parcels the Phase 2 seed created. Nothing here describes a
-- real project in Toledo.
--
-- Every row is stamped documents->>'source' = 'city-os-demo-seed' so it can be
-- found and removed in one statement, and the Development Radar page says on
-- screen that this is sandbox data.

-- Two parcels per neighborhood, picked by address so the choice is stable
-- across reruns.
with hood as (
  select n.id, n.name,
         (select p.id from public.parcels p
           where p.neighborhood_id = n.id order by p.address limit 1)          as parcel_a,
         (select p.id from public.parcels p
           where p.neighborhood_id = n.id order by p.address offset 3 limit 1) as parcel_b
  from public.neighborhoods n
),
spec (hood_name, slot, name, summary, developer, planning_case, kind, status, est_completion, investment_amount) as (values
  ('Downtown','a','Jefferson Block Lofts',
   'Forty two apartments over ground floor retail in a rehabilitated 1920s warehouse.',
   'Riverbend Development Partners','PC-2026-0141','housing','under_construction',
   date '2027-06-30', 11400000),
  ('Downtown','b','Summit Street Transit Plaza',
   'A covered bus plaza with real time arrival boards and a public restroom.',
   'City of Toledo (demo)','PC-2026-0118','infrastructure','approved',
   date '2027-03-15', 3250000),
  ('East Toledo','a','Front Street Grocery',
   'A full service grocery on a lot that has been vacant since 2011.',
   'Eastside Community Development Corp','PC-2026-0203','retail','under_review',
   date '2028-01-31', 6800000),
  ('East Toledo','b','Navarre Park Splash Pad',
   'A splash pad, shade structures and two accessible play areas.',
   'City of Toledo (demo)','PC-2026-0207','park','under_construction',
   date '2027-05-24', 890000),
  ('Old West End','a','Collingwood Terrace Restoration',
   'Six boarded up doubles brought back as twelve rental units, exteriors kept.',
   'Heritage Housing Trust','PC-2026-0166','housing','under_construction',
   date '2027-09-30', 4200000),
  ('Old West End','b','Robinwood Corner Cafe',
   'A cafe and shared workspace in a corner storefront that has been empty two years.',
   'Marin Holdings LLC','PC-2026-0171','retail','proposed',
   date '2027-11-01', 720000),
  ('West Toledo','a','Sylvania Avenue Medical Offices',
   'A two storey clinic with a pharmacy and twelve exam rooms.',
   'Northwest Ohio Health Properties','PC-2026-0244','civic','approved',
   date '2028-04-30', 15900000),
  ('West Toledo','b','Bancroft Street Bike Lanes',
   'Two miles of protected bike lane with rebuilt crossings at six intersections.',
   'City of Toledo (demo)','PC-2026-0249','infrastructure','under_construction',
   date '2027-08-15', 2100000),
  ('South Toledo','a','Broadway Makers Yard',
   'Eighteen small industrial bays for trades and light manufacturing.',
   'Glass City Industrial LLC','PC-2026-0288','industrial','proposed',
   date '2028-06-30', 9300000),
  ('South Toledo','b','Detroit Avenue Senior Housing',
   'Sixty income restricted apartments for residents over 62, with a clinic on site.',
   'Maumee Valley Housing Group','PC-2026-0291','housing','under_review',
   date '2028-09-30', 18700000),
  ('Maumee','a','Conant Street Mixed Use',
   'Ground floor shops with twenty four apartments above, replacing a surface lot.',
   'Conant Street Partners','PC-2026-0312','mixed_use','approved',
   date '2027-12-31', 13500000),
  ('Maumee','b','Side Cut Trail Extension',
   'One and a half miles of paved trail linking the park to the river walk.',
   'Lucas County Parks (demo)','PC-2026-0317','park','completed',
   date '2026-08-30', 1450000),
  ('Perrysburg','a','Louisiana Avenue Hotel',
   'A sixty room hotel with a restaurant open to the street.',
   'Fort Meigs Hospitality','PC-2026-0355','mixed_use','stalled',
   date '2028-12-31', 22000000),
  ('Perrysburg','b','Riverside Green',
   'Two acres of open lawn, a bandstand and river access steps.',
   'City of Perrysburg (demo)','PC-2026-0361','park','proposed',
   date '2028-05-31', 2650000),
  ('Sylvania','a','Main Street Library Annex',
   'A childrens wing and a public meeting room added to the existing branch.',
   'Sylvania Library District (demo)','PC-2026-0402','civic','under_construction',
   date '2027-07-31', 5600000),
  ('Sylvania','b','Monroe Street Townhomes',
   'Twenty eight for sale townhomes on the site of a closed car dealership.',
   'Whiteford Land Company','PC-2026-0408','housing','cancelled',
   date '2028-03-31', 16200000)
)
insert into public.developments
  (name, summary, developer, planning_case, kind, status, parcel_id,
   neighborhood_id, est_completion, investment_amount, documents)
select s.name, s.summary, s.developer, s.planning_case, s.kind, s.status,
       case s.slot when 'a' then h.parcel_a else h.parcel_b end,
       h.id, s.est_completion, s.investment_amount,
       jsonb_build_object(
         'source', 'city-os-demo-seed',
         'files', jsonb_build_array(
           jsonb_build_object('label', 'Planning application', 'url', null),
           jsonb_build_object('label', 'Site plan', 'url', null)))
from spec s
join hood h on h.name = s.hood_name
where not exists (
  select 1 from public.developments d where d.name = s.name
);

-- ------------------------------------------------------- City Memory seed
--
-- Attached to neighborhood entities, pre approved, no contributor. A real
-- submission comes from a signed in resident and waits for approval; these are
-- here so the timeline is not empty on a fresh sandbox.

insert into public.memory_items (entity_id, year, kind, title, body, approved)
select e.id, m.year, m.kind, m.title, m.body, true
from (values
  ('Downtown', 1937, 'story', 'The Willys plant ran three shifts',
   'My grandmother packed lunches at four in the morning for the second shift. She said you could set your watch by the whistle.'),
  ('Downtown', 1969, 'clipping', 'Riverfront cleared for the new bridge',
   'Six blocks came down that spring. The photograph in the paper showed the corner store still standing on its own.'),
  ('Old West End', 1912, 'story', 'When the streetcar turned at Collingwood',
   'The line ran up the middle of the avenue. Children would ride to the end and walk back through the park.'),
  ('Old West End', 1974, 'photo', 'Festival on the lawn',
   'The first year of the summer festival. Somebody brought a piano out onto the grass.'),
  ('East Toledo', 1955, 'story', 'Saturday at the Navarre theatre',
   'A quarter got you in and a bag of popcorn. It closed the year the mall opened.'),
  ('Maumee', 1929, 'clipping', 'The canal locks come down',
   'The last of the old lock gates were pulled that autumn. A few of the stones are still in the park wall.')
) as m(hood_name, year, kind, title, body)
join public.neighborhoods n on n.name = m.hood_name
join public.city_entities e
  on e.source_table = 'neighborhoods' and e.source_id = n.id
where not exists (
  select 1 from public.memory_items x where x.title = m.title and x.entity_id = e.id
);

-- ------------------------------------------------- feed sources with no rows
--
-- pulse_posts and city_signals are both empty in a fresh sandbox, so the merged
-- City Pulse feed would only ever show two of its four sources. These prove the
-- other two. Neighborhood is stored by name on both tables, which is what the
-- feed matches on.

insert into public.pulse_posts
  (category, content, headline, preview_text, neighborhood, business_id, expires_at, auto_generated)
select p.category::public.pulse_category, p.content, p.headline, p.preview, p.hood,
       (select b.id from public.businesses b
         join public.neighborhoods n on n.id = b.neighborhood_id
        where n.name = p.hood order by b.created_at limit 1),
       now() + (p.hours || ' hours')::interval, true
from (values
  ('right_now','Line is out the door but moving fast. Worth the wait for the cinnamon rolls.',
   'Bakery line moving fast','Worth the wait for the cinnamon rolls.','Downtown', 8),
  ('heads_up','Water main work has Summit closed between Cherry and Locust until Friday.',
   'Summit closed to Friday','Water main work between Cherry and Locust.','Downtown', 72),
  ('community_ask','Looking for two more volunteers for the Saturday cleanup at the park.',
   'Two volunteers needed Saturday','Park cleanup, nine to noon.','East Toledo', 96),
  ('good_stuff','The corner store reopened this morning after eight months closed.',
   'Corner store is open again','Eight months closed, back this morning.','Old West End', 48)
) as p(category, content, headline, preview, hood, hours)
where not exists (select 1 from public.pulse_posts x where x.headline = p.headline);

insert into public.city_signals (signal_type, title, subtitle, neighborhood, valid_from, valid_until)
select s.signal_type, s.title, s.subtitle, s.hood, now() - interval '2 hours',
       now() + (s.hours || ' hours')::interval
from (values
  ('closure','Bancroft closed at Detroit','Utility work, one lane each way from Monday.','West Toledo', 120),
  ('meeting','Council hears the Front Street grocery case','Tuesday at six, One Government Center.','East Toledo', 96),
  ('weather','Snow route parking ban in effect','Move cars off marked snow routes tonight.','South Toledo', 24)
) as s(signal_type, title, subtitle, hood, hours)
where not exists (select 1 from public.city_signals x where x.title = s.title);
