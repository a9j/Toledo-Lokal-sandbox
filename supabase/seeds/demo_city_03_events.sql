-- Demo city, part 3: what is on.
--
-- SANDBOX ONLY. Do not run against production.
--
-- Forty INVENTED events across the next ten weeks, plus pictures for the ten
-- that earlier phases seeded. None of these is happening. Nobody has booked a
-- room, hired a band or applied for a street closure.
--
-- Every start time is written as an offset from the day the seed runs, so the
-- calendar is full of upcoming things whenever it is loaded rather than a list
-- that expired the week it was written.

insert into public.events (
  id, business_id, title, description, start_date_time, end_date_time,
  location_text, status, featured, image_url, event_type, capacity,
  price_cents, is_free, ticket_url, created_at
)
select
  ('d3110003-e003-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  b.id, v.title, v.description,
  (current_date + v.day_offset)::timestamptz + (v.hour || ' hours')::interval,
  (current_date + v.day_offset)::timestamptz + ((v.hour + v.length) || ' hours')::interval,
  v.location_text, 'approved', v.featured, '/art/' || v.art || '.svg', 'event',
  v.capacity, v.price_cents, v.price_cents is null,
  case when v.price_cents is not null then 'https://example.com/tickets' end,
  now() - ((abs(hashtext(v.title)) % 40) || ' days')::interval
from (values
  (1,  0, 17, 3, 'Thursday Night Market', 'Twenty stalls of makers and growers under the strung lights. Free to walk through.', 'Promenade Park', 'ev-night-market', null, true,  600, null::integer),
  (2,  0, 19, 2, 'Open Mic at the Taproom', 'Sign up at the bar from six. Five songs or ten minutes, whichever runs out first.', 'Swan Creek Brewing', 'ev-stage', 'swan-creek-brewing', false, 80, null),
  (3,  1, 8,  2, 'Riverside Morning Run', 'Easy five kilometres along the water. All paces, nobody left behind.', 'International Park', 'ev-run', null, false, 120, null),
  (4,  1, 18, 3, 'First Friday Gallery Walk', 'Fifteen studios and shopfronts open late with work on the walls.', 'Adams Street', 'ev-artfair', null, true, 900, null),
  (5,  2, 10, 6, 'Farmers Market on Superior', 'Produce, bread, eggs and cut flowers. Runs rain or shine.', 'N Superior St', 'ev-market', null, true, 1200, null),
  (6,  2, 11, 3, 'Glassblowing Demonstration', 'Watch a piece go from gather to anneal, with a maker talking through it.', 'Warehouse District Glassworks', 'bld-factory', 'warehouse-district-glassworks', false, 40, null),
  (7,  2, 20, 3, 'Saturday Night Sets', 'Three local bands, doors at eight, over by eleven.', 'The Valentine Loft', 'ev-stage', 'the-valentine-loft', false, 120, 1500),
  (8,  3, 12, 4, 'Community Kitchen Sunday Lunch', 'A hot meal for anyone who wants one. No questions, no cost.', 'Cornerstone Community Kitchen', 'in-cafe', 'cornerstone-community-kitchen', true, 300, null),
  (9,  4, 18, 2, 'Beginner Wheel Class', 'Two hours on the wheel with clay and firing included.', 'Kiln and Key Pottery', 'svc-studio', 'kiln-and-key-pottery', false, 12, 4500),
  (10, 5, 19, 2, 'Neighborhood Block Watch', 'Monthly meeting. Open to anyone who lives on the block.', 'East Toledo Branch Library', 'bld-library', null, false, 60, null),
  (11, 6, 7,  2, 'Sunrise Yoga on the Lawn', 'Bring a mat. Class runs whatever the weather unless it is lightning.', 'Maumee Valley Yoga', 'out-park', 'maumee-valley-yoga', false, 40, 1000),
  (12, 6, 17, 4, 'Taco Tuesday Street Party', 'The block closes at five. Four trucks, one long table.', 'Western Ave', 'ev-block-party', null, true, 500, null),
  (13, 7, 18, 2, 'Records and Rarities Night', 'Bring one record, play one side, tell everyone why.', 'Vinyl and Verse Records', 'shop-records', 'vinyl-and-verse-records', false, 45, null),
  (14, 8, 9,  3, 'Repair Cafe', 'Bring something broken. Volunteers will try to fix it with you.', 'Monroe Street Hardware', 'shop-hardware', 'monroe-street-hardware', false, 70, null),
  (15, 9, 19, 3, 'Supper Club: Late Summer', 'One seating, six courses, reservations only.', 'South End Supper Club', 'cafe-supper', 'south-end-supper-club', true, 24, 7500),
  (16, 10, 10, 5, 'Old West End Porch Tour', 'Nine houses open their porches, with a map you pick up at the start.', 'Collingwood Blvd', 'bld-victorian', null, true, 400, 1200),
  (17, 11, 18, 2, 'Pierogi Folding Workshop', 'Learn the pinch. You take home two dozen.', 'Toledo Pierogi House', 'in-cafe', 'toledo-pierogi-house', false, 16, 3500),
  (18, 12, 17, 4, 'Food Truck Rally', 'Eight trucks in the lot behind the taproom.', 'Water St lot', 'svc-foodtruck', null, false, 800, null),
  (19, 13, 11, 3, 'Kids Bike Rodeo', 'Helmet checks, a skills course and free tune ups for anything with two wheels.', 'Anthony Wayne Cycles', 'shop-bikes', 'anthony-wayne-cycles', false, 90, null),
  (20, 14, 20, 3, 'Fireworks Over the Maumee', 'Twenty minutes off the barge. Best watched from either bank.', 'Riverfront', 'ev-fireworks', null, true, 5000, null),
  (21, 15, 13, 4, 'Fall Art Fair', 'Sixty booths down a closed street, with food at the top end.', 'Huron St', 'ev-artfair', null, true, 2000, null),
  (22, 16, 19, 2, 'Poetry at the Bookshop', 'Three readers and an open list at the end.', 'Collingwood Books', 'shop-books', 'collingwood-books', false, 50, null),
  (23, 17, 9,  4, 'Community Garden Work Day', 'Beds to turn and a fence to mend. Tools provided, gloves welcome.', 'Fassett St garden', 'out-garden', null, false, 40, null),
  (24, 18, 18, 3, 'Trivia at the Diner', 'Six rounds, teams of four, pie for the winners.', 'Fassett Street Diner', 'cafe-diner', 'fassett-street-diner', false, 60, null),
  (25, 19, 12, 5, 'Neighborhood Yard Sale', 'Forty houses on the same day, one map.', 'Old West End', 'bld-bungalow', null, false, 1000, null),
  (26, 21, 19, 3, 'Brewery Trivia and Chili Cook Off', 'Ten pots, one spoon each, bring your judgement.', 'Swan Creek Brewing', 'cafe-brewery', 'swan-creek-brewing', false, 120, 500),
  (27, 22, 10, 3, 'Small Business Saturday Workshop', 'Bookkeeping and taxes, explained without jargon.', 'Ledger and Lantern CPA', 'in-office', 'ledger-and-lantern-cpa', false, 30, null),
  (28, 23, 11, 4, 'Riverfront Cleanup', 'Bags and grabbers provided. Two hours on the bank, then lunch.', 'International Park', 'out-riverfront', null, true, 150, null),
  (29, 24, 20, 3, 'Late Night Screening', 'A film on the wall of the loft, with blankets.', 'The Valentine Loft', 'svc-venue', 'the-valentine-loft', false, 100, 800),
  (30, 26, 9,  6, 'Maumee River Boat Show', 'Boats in the water and on the hard, plus a lawn full of trailers.', 'Maumee River Boathouse', 'out-marina', 'maumee-river-boathouse', false, 700, null),
  (31, 28, 18, 2, 'Screen Printing 101', 'Pull your own print on a tote you take home.', 'Riverbend Print Shop', 'svc-print', 'riverbend-print-shop', false, 14, 4000),
  (32, 30, 10, 4, 'Fall Parade', 'Bands, floats and the fire trucks at the end.', 'Summit St', 'ev-parade', null, true, 3000, null),
  (33, 33, 19, 2, 'Story Night: Growing Up Here', 'Six people, six minutes each, no notes.', 'Collingwood Books', 'shop-books', 'collingwood-books', false, 60, null),
  (34, 35, 8,  4, 'Half Marathon', 'One loop through five neighbourhoods, finishing at the park.', 'Promenade Park', 'ev-run', null, true, 1500, 4000),
  (35, 38, 17, 4, 'Harvest Night Market', 'The market after dark, with cider and a fire pit.', 'N Superior St', 'ev-night-market', null, false, 900, null),
  (36, 42, 12, 5, 'Glass City Maker Fair', 'Everything made within an hour of here, in one hall.', 'The Warehouse Room', 'ev-market', 'the-warehouse-room', true, 1200, null),
  (37, 45, 18, 3, 'Neighborhood Chili Supper', 'A church hall, twelve pots and a raffle.', 'Cornerstone Community Kitchen', 'in-cafe', 'cornerstone-community-kitchen', false, 200, 700),
  (38, 49, 11, 3, 'Winter Coat Drive', 'Drop a coat, take a coat. Sorted by size on the day.', 'Second Story Thrift', 'shop-thrift', 'second-story-thrift', false, 250, null),
  (39, 56, 19, 3, 'Holiday Lights Switch On', 'The tree, the trolley and a choir at the end of it.', 'Downtown', 'ev-block-party', null, true, 4000, null),
  (40, 63, 10, 6, 'Winter Makers Market', 'Indoors, sixty stalls, the last market of the year.', 'The Warehouse Room', 'ev-market', 'the-warehouse-room', false, 1500, null)
) as v(n, day_offset, hour, length, title, description, location_text, art, business_slug, featured, capacity, price_cents)
left join public.businesses b on b.slug = v.business_slug
where not exists (
  select 1 from public.events e
  where e.id = ('d3110003-e003-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);

-- Pictures for the ten events the earlier phases seeded, which have none.
update public.events e
set image_url = '/art/' || v.art || '.svg'
from (values
  ('0c105001-e001-4000-8000-000000000000'::uuid, 'cafe-coffee'),
  ('0c105001-e001-4000-8000-000000000001'::uuid, 'cafe-bakery'),
  ('0c105001-e001-4000-8000-000000000002'::uuid, 'shop-bikes'),
  ('0c105001-e001-4000-8000-000000000003'::uuid, 'svc-barber'),
  ('0c105001-e001-4000-8000-000000000004'::uuid, 'in-gym'),
  ('0c105001-e001-4000-8000-000000000005'::uuid, 'svc-studio'),
  ('0c105001-e001-4000-8000-000000000006'::uuid, 'ev-market'),
  ('0c105001-e001-4000-8000-000000000007'::uuid, 'in-office'),
  ('0c105001-e001-4000-8000-000000000008'::uuid, 'cafe-supper'),
  ('0c105001-e001-4000-8000-000000000009'::uuid, 'out-garden')
) as v(id, art)
where e.id = v.id and e.image_url is null;

-- Those ten were written with fixed September dates and most have already
-- passed. Move them onto the coming fortnight so the calendar is not half
-- history on the day the demo is opened.
update public.events e
set start_date_time = (current_date + v.day_offset)::timestamptz + (v.hour || ' hours')::interval,
    end_date_time   = (current_date + v.day_offset)::timestamptz + ((v.hour + 2) || ' hours')::interval
from (values
  ('0c105001-e001-4000-8000-000000000000'::uuid, 2,  18),
  ('0c105001-e001-4000-8000-000000000001'::uuid, 4,  10),
  ('0c105001-e001-4000-8000-000000000002'::uuid, 5,  9),
  ('0c105001-e001-4000-8000-000000000003'::uuid, 7,  10),
  ('0c105001-e001-4000-8000-000000000004'::uuid, 1,  8),
  ('0c105001-e001-4000-8000-000000000005'::uuid, 3,  18),
  ('0c105001-e001-4000-8000-000000000006'::uuid, 8,  11),
  ('0c105001-e001-4000-8000-000000000007'::uuid, 11, 12),
  ('0c105001-e001-4000-8000-000000000008'::uuid, 6,  19),
  ('0c105001-e001-4000-8000-000000000009'::uuid, 10, 10)
) as v(id, day_offset, hour)
where e.id = v.id and e.start_date_time < now();
