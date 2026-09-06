-- Phase 1 demo seed. SANDBOX ONLY. Do not run against production.
--
-- The sandbox has no businesses, events, nonprofits or jobs, so the CityGraph
-- backfill produces 9 neighborhood entities and nothing else. Without this the
-- follow button, the civic inbox and the Recent changes lists all render empty.
--
-- Every business, nonprofit and job named here is INVENTED. Nothing in this file
-- describes a real Toledo business or a real opening. Coordinates are approximate
-- neighborhood centers, good enough for distance ranking in a sandbox and not
-- accurate street geocodes. Ids are fixed so the seed is idempotent and
-- city_os_phase1_demo_undo.sql removes exactly these rows and nothing else.
--
-- The city_entities rows come for free: the Phase 1 sync triggers fire on every
-- insert below, so the registry, the located_in edges and the hosts and employs
-- edges are all built as a side effect. Run this AFTER the three Phase 1
-- migrations.

-- businesses ----------------------------------------------------------------
insert into public.businesses
  (id, name, category, neighborhood_id, address, description, status, verified,
   referral_source)
values
  ('0c105001-b001-4000-8000-000000000000', 'Glass City Roasters', 'restaurant',
   (select id from public.neighborhoods where name = 'Downtown'),
   '512 Jefferson Ave', 'Small batch coffee roaster and cafe on the ground floor of a restored warehouse.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000001', 'Maumee Bend Bakery', 'restaurant',
   (select id from public.neighborhoods where name = 'Maumee'),
   '1104 Conant St', 'Sourdough, pastry and a short lunch menu. Closed Mondays.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000002', 'Anthony Wayne Cycles', 'retail',
   (select id from public.neighborhoods where name = 'Perrysburg'),
   '233 Louisiana Ave', 'Bike sales, fitting and repair. Winter tune ups start in November.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000003', 'Old West End Barber Co', 'salon_barber',
   (select id from public.neighborhoods where name = 'Old West End'),
   '2018 Collingwood Blvd', 'Walk in barbershop in a Victorian storefront. Cash and card.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000004', 'Riverside Strength', 'gym_fitness',
   (select id from public.neighborhoods where name = 'East Toledo'),
   '710 Main St', 'Neighborhood gym with open lifting hours and a small group class schedule.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000005', 'Sylvania Timber Works', 'contractor_service',
   (select id from public.neighborhoods where name = 'Sylvania'),
   '5840 Monroe St', 'Decks, porches and interior trim carpentry for homes in Lucas County.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000006', 'Little Lantern Childcare', 'childcare',
   (select id from public.neighborhoods where name = 'West Toledo'),
   '3320 W Sylvania Ave', 'Licensed care for infants through pre kindergarten. Waitlist opens in spring.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000007', 'Kiln and Key Pottery', 'artist_maker',
   (select id from public.neighborhoods where name = 'Old West End'),
   '2245 Parkwood Ave', 'Working pottery studio with member shelves and beginner wheel classes.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000008', 'The Warehouse Room', 'event_venue',
   (select id from public.neighborhoods where name = 'Downtown'),
   '28 Water St', 'Rentable event floor for 40 to 200 people, with a loading dock and kitchen.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000009', 'Ledger and Lantern CPA', 'professional_service',
   (select id from public.neighborhoods where name = 'Downtown'),
   '420 Madison Ave', 'Bookkeeping and tax prep for small businesses and sole proprietors.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000010', 'South End Supper Club', 'restaurant',
   (select id from public.neighborhoods where name = 'South Toledo'),
   '2901 Broadway St', 'Rotating weekly menu, one seating a night, reservations only.', 'approved', true, 'city-os-demo-seed'),
  ('0c105001-b001-4000-8000-000000000011', 'Front Street Provisions', 'retail',
   (select id from public.neighborhoods where name = 'East Toledo'),
   '1188 Front St', 'Corner grocery carrying produce, pantry staples and local dairy.', 'approved', true, 'city-os-demo-seed')
on conflict (id) do nothing;

-- primary locations, the only source of geometry in Phase 1 -----------------
insert into public.business_locations
  (id, business_id, label, street_address, city, state, zip_code, neighborhood,
   latitude, longitude, is_primary, is_active)
values
  ('0c105001-1001-4000-8000-000000000000', '0c105001-b001-4000-8000-000000000000', 'Main', '512 Jefferson Ave', 'Toledo', 'OH',
   '43604', 'Downtown', 41.649200, -83.541000, true, true),
  ('0c105001-1001-4000-8000-000000000001', '0c105001-b001-4000-8000-000000000001', 'Main', '1104 Conant St', 'Toledo', 'OH',
   '43537', 'Maumee', 41.560200, -83.655000, true, true),
  ('0c105001-1001-4000-8000-000000000002', '0c105001-b001-4000-8000-000000000002', 'Main', '233 Louisiana Ave', 'Toledo', 'OH',
   '43551', 'Perrysburg', 41.557000, -83.625900, true, true),
  ('0c105001-1001-4000-8000-000000000003', '0c105001-b001-4000-8000-000000000003', 'Main', '2018 Collingwood Blvd', 'Toledo', 'OH',
   '43620', 'Old West End', 41.670800, -83.552800, true, true),
  ('0c105001-1001-4000-8000-000000000004', '0c105001-b001-4000-8000-000000000004', 'Main', '710 Main St', 'Toledo', 'OH',
   '43605', 'East Toledo', 41.651600, -83.518100, true, true),
  ('0c105001-1001-4000-8000-000000000005', '0c105001-b001-4000-8000-000000000005', 'Main', '5840 Monroe St', 'Toledo', 'OH',
   '43560', 'Sylvania', 41.715400, -83.714000, true, true),
  ('0c105001-1001-4000-8000-000000000006', '0c105001-b001-4000-8000-000000000006', 'Main', '3320 W Sylvania Ave', 'Toledo', 'OH',
   '43613', 'West Toledo', 41.688200, -83.608900, true, true),
  ('0c105001-1001-4000-8000-000000000007', '0c105001-b001-4000-8000-000000000007', 'Main', '2245 Parkwood Ave', 'Toledo', 'OH',
   '43620', 'Old West End', 41.669000, -83.552800, true, true),
  ('0c105001-1001-4000-8000-000000000008', '0c105001-b001-4000-8000-000000000008', 'Main', '28 Water St', 'Toledo', 'OH',
   '43604', 'Downtown', 41.654600, -83.541000, true, true),
  ('0c105001-1001-4000-8000-000000000009', '0c105001-b001-4000-8000-000000000009', 'Main', '420 Madison Ave', 'Toledo', 'OH',
   '43604', 'Downtown', 41.656400, -83.538900, true, true),
  ('0c105001-1001-4000-8000-000000000010', '0c105001-b001-4000-8000-000000000010', 'Main', '2901 Broadway St', 'Toledo', 'OH',
   '43609', 'South Toledo', 41.608400, -83.568900, true, true),
  ('0c105001-1001-4000-8000-000000000011', '0c105001-b001-4000-8000-000000000011', 'Main', '1188 Front St', 'Toledo', 'OH',
   '43605', 'East Toledo', 41.646200, -83.511800, true, true)
on conflict (id) do nothing;

-- nonprofits ----------------------------------------------------------------
insert into public.nonprofits
  (id, name, slug, cause_category, neighborhood_id, mission_statement, status)
values
  ('0c105001-a001-4000-8000-000000000000', 'Glass City Food Share', 'demo-glass-city-food-share', 'food_insecurity',
   (select id from public.neighborhoods where name = 'East Toledo'),
   'We move surplus food from local kitchens to neighbors who need it, six days a week.', 'active'),
  ('0c105001-a001-4000-8000-000000000001', 'Porch Light Housing Fund', 'demo-porch-light-housing-fund', 'housing',
   (select id from public.neighborhoods where name = 'Old West End'),
   'We help renters and homeowners cover emergency repairs so they can stay in their homes.', 'active'),
  ('0c105001-a001-4000-8000-000000000002', 'Maumee Valley Youth Build', 'demo-maumee-valley-youth-build', 'youth',
   (select id from public.neighborhoods where name = 'South Toledo'),
   'After school trades program teaching carpentry and electrical basics to teenagers.', 'active'),
  ('0c105001-a001-4000-8000-000000000003', 'Riverbank Restoration', 'demo-riverbank-restoration', 'environment',
   (select id from public.neighborhoods where name = 'Perrysburg'),
   'Volunteer crews clearing invasive species and replanting native cover along the river.', 'active'),
  ('0c105001-a001-4000-8000-000000000004', 'Toledo Story Collective', 'demo-toledo-story-collective', 'arts_culture',
   (select id from public.neighborhoods where name = 'Downtown'),
   'We record and publish oral histories from longtime residents of every neighborhood.', 'active'),
  ('0c105001-a001-4000-8000-000000000005', 'Second Shift Senior Care', 'demo-second-shift-senior-care', 'seniors',
   (select id from public.neighborhoods where name = 'West Toledo'),
   'Rides, yard work and check in visits for seniors living alone.', 'active')
on conflict (id) do nothing;

-- events --------------------------------------------------------------------
insert into public.events
  (id, business_id, title, description, start_date_time, end_date_time,
   location_text, status, event_type, is_free)
values
  ('0c105001-e001-4000-8000-000000000000', '0c105001-b001-4000-8000-000000000000', 'Cupping Table: Ethiopia Lot 4',
   'Hosted at Glass City Roasters.',
   date_trunc('day', now()) + interval '3 days 18 hours',
   date_trunc('day', now()) + interval '3 days 20 hours',
   'Glass City Roasters', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000001', '0c105001-b001-4000-8000-000000000001', 'Sourdough Basics Workshop',
   'Hosted at Maumee Bend Bakery.',
   date_trunc('day', now()) + interval '5 days 10 hours',
   date_trunc('day', now()) + interval '5 days 12 hours',
   'Maumee Bend Bakery', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000002', '0c105001-b001-4000-8000-000000000002', 'Winter Tune Up Clinic',
   'Hosted at Anthony Wayne Cycles.',
   date_trunc('day', now()) + interval '6 days 9 hours',
   date_trunc('day', now()) + interval '6 days 11 hours',
   'Anthony Wayne Cycles', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000003', '0c105001-b001-4000-8000-000000000003', 'Free Cuts for Kids Day',
   'Hosted at Old West End Barber Co.',
   date_trunc('day', now()) + interval '8 days 10 hours',
   date_trunc('day', now()) + interval '8 days 12 hours',
   'Old West End Barber Co', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000004', '0c105001-b001-4000-8000-000000000004', 'Saturday Open Lift',
   'Hosted at Riverside Strength.',
   date_trunc('day', now()) + interval '2 days 8 hours',
   date_trunc('day', now()) + interval '2 days 10 hours',
   'Riverside Strength', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000005', '0c105001-b001-4000-8000-000000000007', 'Beginner Wheel Night',
   'Hosted at Kiln and Key Pottery.',
   date_trunc('day', now()) + interval '4 days 18 hours',
   date_trunc('day', now()) + interval '4 days 20 hours',
   'Kiln and Key Pottery', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000006', '0c105001-b001-4000-8000-000000000008', 'Warehouse Winter Market',
   'Hosted at The Warehouse Room.',
   date_trunc('day', now()) + interval '9 days 11 hours',
   date_trunc('day', now()) + interval '9 days 13 hours',
   'The Warehouse Room', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000007', '0c105001-b001-4000-8000-000000000009', 'Quarterly Tax Q and A',
   'Hosted at Ledger and Lantern CPA.',
   date_trunc('day', now()) + interval '12 days 12 hours',
   date_trunc('day', now()) + interval '12 days 14 hours',
   'Ledger and Lantern CPA', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000008', '0c105001-b001-4000-8000-000000000010', 'Supper Club: Root Vegetables',
   'Hosted at South End Supper Club.',
   date_trunc('day', now()) + interval '7 days 19 hours',
   date_trunc('day', now()) + interval '7 days 21 hours',
   'South End Supper Club', 'approved', 'event', true),
  ('0c105001-e001-4000-8000-000000000009', '0c105001-b001-4000-8000-000000000011', 'Neighborhood Produce Swap',
   'Hosted at Front Street Provisions.',
   date_trunc('day', now()) + interval '11 days 10 hours',
   date_trunc('day', now()) + interval '11 days 12 hours',
   'Front Street Provisions', 'approved', 'event', true)
on conflict (id) do nothing;

-- jobs ----------------------------------------------------------------------
insert into public.jobs
  (id, business_id, title, job_type, description, apply_method, apply_contact,
   status, hiring_now)
values
  ('0c105001-f001-4000-8000-000000000000', '0c105001-b001-4000-8000-000000000000', 'Barista, morning shift', 'part_time',
   'Pull shots, run the bar and open two mornings a week.', 'email', 'hiring@example.com', 'approved', true),
  ('0c105001-f001-4000-8000-000000000001', '0c105001-b001-4000-8000-000000000001', 'Baker assistant', 'full_time',
   'Overnight shift shaping and loading. We train.', 'email', 'hiring@example.com', 'approved', true),
  ('0c105001-f001-4000-8000-000000000002', '0c105001-b001-4000-8000-000000000002', 'Bike mechanic', 'full_time',
   'Full builds and repairs. Own tools helpful but not required.', 'email', 'hiring@example.com', 'approved', true),
  ('0c105001-f001-4000-8000-000000000003', '0c105001-b001-4000-8000-000000000003', 'Licensed barber', 'contract',
   'Chair rental available, bring your own book or build one here.', 'email', 'hiring@example.com', 'approved', true),
  ('0c105001-f001-4000-8000-000000000004', '0c105001-b001-4000-8000-000000000004', 'Front desk and cleaning', 'part_time',
   'Evenings and weekend mornings. Free membership included.', 'email', 'hiring@example.com', 'approved', true),
  ('0c105001-f001-4000-8000-000000000005', '0c105001-b001-4000-8000-000000000005', 'Finish carpenter', 'full_time',
   'Trim and cabinetry work on residential jobs across the county.', 'email', 'hiring@example.com', 'approved', true),
  ('0c105001-f001-4000-8000-000000000006', '0c105001-b001-4000-8000-000000000006', 'Infant room teacher', 'full_time',
   'CDA or equivalent preferred. Paid training toward certification.', 'email', 'hiring@example.com', 'approved', true),
  ('0c105001-f001-4000-8000-000000000007', '0c105001-b001-4000-8000-000000000008', 'Event setup crew', 'part_time',
   'Load in, floor setup and tear down. Nights and weekends.', 'email', 'hiring@example.com', 'approved', true)
on conflict (id) do nothing;

