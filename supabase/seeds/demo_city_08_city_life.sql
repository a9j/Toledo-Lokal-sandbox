-- Demo city, part 8: the rest of the city.
--
-- SANDBOX ONLY. Do not run against production.
--
-- Food trucks with a week of stops, more reported issues, memories on the
-- places, a few business impact numbers, some B2B requests, and change log
-- entries so the Civic Inbox has a week of notices in it.
--
-- All INVENTED. No truck is parked anywhere, no pothole has been reported, no
-- business has published these numbers, and none of the change notices
-- describes a real permit, closure or meeting.

-- ------------------------------------------------- food trucks and stops

insert into public.food_truck_locations (id, business_id, location_date, location_name,
                                         address, latitude, longitude, start_time,
                                         end_time, notes, featured, status)
select
  md5('demo-truck:' || b.slug || ':' || g.d::text)::uuid,
  b.id, current_date + g.d, v.location_name, v.address,
  v.lat, v.lng, v.start_time::time, v.end_time::time, v.notes, g.d = 0, 'active'
from generate_series(0, 6) as g(d)
join (values
  ('the-rolling-pin',       0, 'Promenade Park',       '400 Water St',      41.6512, -83.5352, '07:30', '11:30', 'Morning buns and drip coffee.'),
  ('the-rolling-pin',       2, 'Sylvania Main Street', '5700 Main St',      41.7192, -83.7128, '08:00', '12:00', 'Parked outside the coffee bar.'),
  ('the-rolling-pin',       4, 'Perrysburg Louisiana', '117 Louisiana Ave', 41.5571, -83.6272, '07:30', '11:00', 'Last stop of the week.'),
  ('smoke-and-sparrow-bbq', 0, 'Water St lot',         '28 Water St',       41.6531, -83.5361, '11:00', '14:00', 'Until the brisket runs out.'),
  ('smoke-and-sparrow-bbq', 1, 'Swan Creek Brewing',   '2205 Broadway St',  41.6182, -83.5671, '17:00', '21:00', 'Outside the taproom.'),
  ('smoke-and-sparrow-bbq', 5, 'Front Street',         '1188 Front St',     41.6472, -83.5148, '11:30', '15:00', 'Saturday, ribs on.'),
  ('glass-city-gyro-truck', 1, 'Swan Creek Brewing',   '2205 Broadway St',  41.6180, -83.5669, '17:00', '22:00', 'Taproom night.'),
  ('glass-city-gyro-truck', 3, 'Adams Street',         '1719 Adams St',     41.6552, -83.5423, '18:00', '23:00', 'Late window.'),
  ('glass-city-gyro-truck', 6, 'International Park',   '1 Main St',         41.6459, -83.5312, '12:00', '18:00', 'Sunday on the river.')
) as v(slug, day_offset, location_name, address, lat, lng, start_time, end_time, notes)
  on v.day_offset = g.d
join public.businesses b on b.slug = v.slug
where not exists (
  select 1 from public.food_truck_locations f
  where f.id = md5('demo-truck:' || b.slug || ':' || g.d::text)::uuid
);

-- truck_stops is the check in version of the same thing, used by the scanner.
insert into public.truck_stops (id, business_id, location_name, lat, lng, starts_at, ends_at, status, checkin_code)
select
  md5('demo-stop:' || f.id::text)::uuid, f.business_id, f.location_name,
  f.latitude::double precision, f.longitude::double precision,
  f.location_date::timestamptz + f.start_time,
  f.location_date::timestamptz + f.end_time,
  case when f.location_date < current_date then 'closed' else 'open' end,
  upper(substr(md5(f.id::text), 1, 6))
from public.food_truck_locations f
where not exists (select 1 from public.truck_stops t where t.id = md5('demo-stop:' || f.id::text)::uuid);

-- ------------------------------------------------------------- issues

insert into public.issues (id, kind, title, description, photo_url, neighborhood_id,
                           status, is_government, needs, progress, created_at, updated_at)
select
  ('d3110008-1550-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  v.kind, v.title, v.description, '/art/' || v.art || '.svg', h.id, v.status,
  v.is_government, v.needs::jsonb, v.progress::jsonb,
  now() - (v.days_ago || ' days')::interval,
  now() - ((v.days_ago / 2) || ' days')::interval
from (values
  (1,  'pothole',     'Pothole at Bancroft and Detroit',   'Deep enough to take a hubcap off. Two cars stopped to check tyres while I was there.', 'obj-pothole', 'Old West End', 'assigned',  true,  '{}', '{"reported":true,"assigned":true}', 9),
  (2,  'streetlight', 'Streetlight out on Fassett',        'Three lamps in a row are dark. The stretch by the school is the worst of it.', 'obj-pothole', 'East Toledo', 'scheduled', true,  '{}', '{"reported":true,"assigned":true,"scheduled":true}', 16),
  (3,  'sidewalk',    'Sidewalk lifted by a tree root',    'Buggy cannot get past. People are walking in the road to get round it.', 'obj-pothole', 'Old West End', 'reported',  true,  '{}', '{"reported":true}', 3),
  (4,  'dumping',     'Fly tipping behind the lot',        'Two sofas and a pile of tyres, added to over the last fortnight.', 'out-lot', 'South Toledo', 'reported', true, '{}', '{"reported":true}', 6),
  (5,  'graffiti',    'Tagging on the underpass',          'Recent, and it has spread along the whole wall since last month.', 'out-lot', 'Downtown', 'completed', true, '{}', '{"reported":true,"assigned":true,"scheduled":true,"completed":true}', 40),
  (6,  'crossing',    'No crossing outside the school',    'Children cross four lanes here twice a day. Been asked for since 2023.', 'bld-school', 'Sylvania', 'assigned', true, '{}', '{"reported":true,"assigned":true}', 55),
  (7,  'volunteers',  'Benches needed at the garden',      'Two benches would make the garden usable for people who cannot stand long.', 'out-garden', 'East Toledo', 'reported', false, '{"volunteers":6,"materials":true}', '{"pledged":2}', 12),
  (8,  'volunteers',  'Coat sorting help, Saturdays',      'The rails fill faster than they can be sorted. Two hours does a lot.', 'obj-volunteer', 'West Toledo', 'assigned', false, '{"volunteers":10}', '{"pledged":6}', 20),
  (9,  'volunteers',  'Paint for the community centre',    'Two rooms, and the paint is the whole cost. Labour is already covered.', 'bld-centre', 'South Toledo', 'reported', false, '{"funds":800,"volunteers":4}', '{"pledged":1}', 8),
  (10, 'volunteers',  'Drivers for the meal run',          'Thursday nights, one hour, deliver eight meals on a fixed route.', 'in-cafe', 'South Toledo', 'assigned', false, '{"volunteers":5}', '{"pledged":3}', 26),
  (11, 'flooding',    'Drain backs up on Western',         'Any real rain and the corner floods to the kerb. Happens most months.', 'obj-pothole', 'South Toledo', 'scheduled', true, '{}', '{"reported":true,"assigned":true,"scheduled":true}', 33),
  (12, 'tree',        'Dead tree over the pavement',       'Big limb hanging. It has dropped smaller ones twice this summer.', 'out-trail', 'Perrysburg', 'reported', true, '{}', '{"reported":true}', 4)
) as v(n, kind, title, description, art, hood, status, is_government, needs, progress, days_ago)
join public.neighborhoods h on h.name = v.hood
where not exists (
  select 1 from public.issues i
  where i.id = ('d3110008-1550-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);

-- Pictures for the five issues an earlier phase seeded.
update public.issues set photo_url = '/art/obj-pothole.svg' where photo_url is null;

-- ----------------------------------------------------- memory on places

insert into public.memory_items (id, entity_id, year, kind, title, body, media_url, approved, created_at)
select
  md5('demo-memory:' || v.n::text)::uuid,
  e.id, v.year, v.kind, v.title, v.body, '/art/' || v.art || '.svg', true,
  now() - (v.n * 9 || ' days')::interval
from (values
  (1, 'businesses', 'warehouse-district-glassworks', 1962, 'photo',    'The furnace crew, second shift',      'Eleven men on the second shift, photographed outside the loading door.', 'bld-factory'),
  (2, 'businesses', 'the-warehouse-room',            1948, 'clipping', 'Sold as a produce warehouse',         'A short notice in the paper listing the sale and the new owner.', 'bld-warehouse'),
  (3, 'businesses', 'collingwood-books',             1974, 'story',    'It was a doctor surgery',             'The waiting room was where poetry is now, and the pharmacy was the back office.', 'shop-books'),
  (4, 'businesses', 'fassett-street-diner',          1957, 'photo',    'The counter, the year it opened',     'Same counter, different stools. The clock on the back wall is still there.', 'cafe-diner'),
  (5, 'businesses', 'old-west-end-barber-co',        1931, 'clipping', 'A barber advertises for an apprentice','Two lines in the classifieds, asking for a boy who could keep a razor sharp.', 'svc-barber'),
  (6, 'neighborhoods', 'Old West End',               1905, 'photo',    'Collingwood before the elms went',    'The street under a full canopy, taken from the middle of the road.', 'bld-victorian'),
  (7, 'neighborhoods', 'East Toledo',                1969, 'story',    'When the ferry still ran',            'People remember queuing on the bank and the fare being small enough to forget.', 'out-riverfront'),
  (8, 'neighborhoods', 'Downtown',                   1983, 'clipping', 'The last glass plant closes',         'A front page and a photograph of the gate with a chain on it.', 'bld-factory')
) as v(n, source_table, source_key, year, kind, title, body, art)
join public.city_entities e
  on e.source_table = v.source_table
 and e.source_id = coalesce(
      (select b.id from public.businesses b where b.slug = v.source_key),
      (select nb.id from public.neighborhoods nb where nb.name = v.source_key)
    )
where not exists (
  select 1 from public.memory_items m where m.id = md5('demo-memory:' || v.n::text)::uuid
);

-- -------------------------------------------------------- impact numbers

insert into public.impact_metrics (id, business_id, metric_type, label, value, unit,
                                   period_start, period_end, notes)
select
  md5('demo-impact:' || b.slug || ':' || v.label)::uuid,
  b.id, v.metric_type, v.label, v.value, v.unit,
  date_trunc('year', current_date)::date, current_date,
  'Sandbox figure. Invented, not reported by the business.'
from (values
  ('glass-city-roasters',           'local_spend', 'Spent with local suppliers', 42000, 'dollars'),
  ('glass-city-roasters',           'jobs',        'People employed',            9,     'people'),
  ('cornerstone-community-kitchen', 'meals',       'Meals served this year',     15600, 'meals'),
  ('cornerstone-community-kitchen', 'volunteers',  'Volunteer hours',            4200,  'hours'),
  ('swan-creek-brewing',            'local_spend', 'Spent with local suppliers', 88000, 'dollars'),
  ('swan-creek-brewing',            'jobs',        'People employed',            14,    'people'),
  ('warehouse-district-glassworks', 'apprentices', 'Apprentices trained',        6,     'people'),
  ('second-story-thrift',           'diverted',    'Items kept out of landfill', 31000, 'items'),
  ('northside-plumbing',            'apprentices', 'Apprentices trained',        3,     'people'),
  ('maumee-bend-bakery',            'local_spend', 'Flour bought in Ohio',       26000, 'dollars')
) as v(slug, metric_type, label, value, unit)
join public.businesses b on b.slug = v.slug
where not exists (
  select 1 from public.impact_metrics im where im.id = md5('demo-impact:' || b.slug || ':' || v.label)::uuid
);

-- ----------------------------------------------------------- requests

insert into public.requests (id, created_by_user_id, category_id, neighborhood_id, title,
                             description, budget_min, budget_max, needed_by_date_time,
                             contact_preference, status, is_b2b, is_barter, need_category, created_at)
select
  md5('demo-request:' || v.n::text)::uuid,
  u.id, (select id from public.categories where slug = v.cat_slug), h.id,
  v.title, v.description, v.budget_min, v.budget_max,
  now() + (v.needed_in_days || ' days')::interval, 'app', v.status, v.is_b2b, v.is_barter,
  v.need_category, now() - (v.days_ago || ' days')::interval
from (values
  (1, 'marcus.bell@demo.toledolokal.invalid',    'Downtown',    'Signwriter for a hand painted facade', 'Looking for someone who paints signs by hand, not vinyl. Two windows and a fascia.', 800, 2000, 21, 'open', true, false, 'design', 'arts-nightlife', 4),
  (2, 'rosa.delgado@demo.toledolokal.invalid',   'Old West End','Weekly delivery run, small van',       'Three drops a week across the west side. Regular work for the right driver.', 300, 500, 14, 'open', true, false, 'logistics', 'local-services', 9),
  (3, 'grant.mueller@demo.toledolokal.invalid',  'Perrysburg',  'Trade: bookkeeping for web work',      'I will do a year of books for a small site and a booking form. Happy to swap.', null, null, 45, 'open', true, true, 'professional', 'professional-services', 12),
  (4, 'sofia.kowalski@demo.toledolokal.invalid', 'West Toledo', 'Commercial kitchen, four hours a week', 'Need certified kitchen time on a Tuesday for a small bake run.', 100, 250, 10, 'open', true, false, 'space', 'food-drink', 6),
  (5, 'hannah.pham@demo.toledolokal.invalid',    'East Toledo', 'Someone to fix a back gate',           'Sagging gate and a rotted post. Small job, cash or trade.', 80, 200, 7, 'open', false, false, 'trades', 'home-services', 2),
  (6, 'ellis.vance@demo.toledolokal.invalid',    'South Toledo','Photographer for a community night',   'Two hours on a Thursday, photos we can use on the website.', 150, 350, 18, 'open', false, false, 'creative', 'arts-nightlife', 5),
  (7, 'terrence.hobbs@demo.toledolokal.invalid', 'Downtown',    'Bulk print run, five hundred posters', 'A3, two colours. Local printer preferred over an online one.', 200, 450, 12, 'closed', true, false, 'print', 'shopping', 30)
) as v(n, author_email, hood, title, description, budget_min, budget_max, needed_in_days,
       status, is_b2b, is_barter, need_category, cat_slug, days_ago)
join auth.users u on u.email = v.author_email
join public.neighborhoods h on h.name = v.hood
where not exists (
  select 1 from public.requests r where r.id = md5('demo-request:' || v.n::text)::uuid
);

-- --------------------------------------------------------- change log

insert into public.city_events_log (id, entity_id, event_type, title, body, occurs_at)
select
  md5('demo-change:' || v.n::text)::uuid, e.id, v.event_type, v.title, v.body,
  now() - (v.hours_ago || ' hours')::interval
from (values
  (1,  'businesses', 'swan-creek-brewing',            'opened',        'Swan Creek Brewing is taking bookings', 'The taproom is open Thursday to Sunday and the back room can be booked.', 6),
  (2,  'businesses', 'collingwood-books',             'deal_added',    'Buy two used books, get one free',      'Cheapest of the three is free. Used stock only.', 14),
  (3,  'businesses', 'fassett-street-diner',          'hiring',        'Two roles at the diner',                'A line cook and a weekend server. No experience needed for the second.', 20),
  (4,  'neighborhoods', 'Downtown',                   'closure',       'Water Street is one lane at Jefferson', 'Utility work. Full reopening expected at the end of next week.', 5),
  (5,  'neighborhoods', 'East Toledo',                'meeting',       'Block watch meets Tuesday',             'Seven at the branch library. Open to anyone who lives here.', 30),
  (6,  'businesses', 'warehouse-district-glassworks', 'event_added',   'Glass demonstration on Saturday',       'Free to watch, no booking, eleven in the morning.', 12),
  (7,  'businesses', 'cherry-street-cuts',            'status_change', 'Cherry Street Cuts now books online',   'Walk ins are still taken before noon.', 48),
  (8,  'neighborhoods', 'Sylvania',                   'completed',     'The crossing on Central is in',         'Signals live from this week. Three years after it was first asked for.', 40),
  (9,  'businesses', 'northside-plumbing',            'hiring',        'Apprentice plumber wanted',             'Paid apprenticeship with a route to licence. No trade experience needed.', 60),
  (10, 'neighborhoods', 'West Toledo',                'notice',        'Bulk pickup moves to Wednesday',        'One week only, because of the holiday.', 36),
  (11, 'businesses', 'toledo-pierogi-house',          'event_added',   'Pierogi folding workshop added',        'Sixteen places, and you take home two dozen.', 26),
  (12, 'neighborhoods', 'South Toledo',               'notice',        'Drain work scheduled on Western',       'The corner that floods is on the list for next month.', 72),
  (13, 'businesses', 'second-story-thrift',           'event_added',   'Winter coat drive announced',           'Drop a coat, take a coat. Sorted by size on the day.', 18),
  (14, 'businesses', 'the-valentine-loft',            'deal_added',    'Weeknight hire rate cut',               'Monday to Wednesday bookings are a third off until spring.', 90),
  (15, 'neighborhoods', 'Old West End',               'meeting',       'Porch tour planning meeting',           'Anyone opening a porch this year should come to this one.', 54)
) as v(n, source_table, source_key, event_type, title, body, hours_ago)
join public.city_entities e
  on e.source_table = v.source_table
 and e.source_id = coalesce(
      (select b.id from public.businesses b where b.slug = v.source_key),
      (select nb.id from public.neighborhoods nb where nb.name = v.source_key)
    )
where not exists (
  select 1 from public.city_events_log c where c.id = md5('demo-change:' || v.n::text)::uuid
);
