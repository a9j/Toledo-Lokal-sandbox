-- Demo city, part 4: offers and openings.
--
-- SANDBOX ONLY. Do not run against production.
--
-- Twenty INVENTED deals and twenty two INVENTED job posts. No business has
-- agreed to any of these offers, nobody is hiring for these roles, and the
-- application addresses are on the reserved .invalid domain so they cannot
-- reach anyone. Every deal carries the same warning in its terms.

insert into public.deals (id, business_id, title, description, status, deal_type,
                          start_date, end_date, terms, featured, image_url,
                          redemption_method, redemption_limit, created_at)
select
  ('d3110004-d004-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  b.id, v.title, v.description, 'approved', 'discount',
  current_date - v.started, current_date + v.runs,
  'Sandbox data. This offer is not real and no business has agreed to it.',
  v.featured, '/art/' || v.art || '.svg', 'show_app', v.limit_count,
  now() - (v.started || ' days')::interval
from (values
  (1,  'glass-city-roasters',        'Two dollars off any pour over',        'Good all week before ten in the morning. Show the app at the register.', 14, 45, true,  'cafe-coffee', 200),
  (2,  'maumee-bend-bakery',         'Free loaf with a dozen pastries',      'One loaf of the day, Tuesday through Friday.', 9, 30, false, 'cafe-bakery', 100),
  (3,  'fassett-street-diner',       'Kids eat free on Saturday',            'One free kids meal with every adult meal, all day Saturday.', 21, 60, true,  'cafe-diner', null),
  (4,  'adams-street-pizza-co',      'Two slices and a drink for six',       'Weekdays until four. Cheese or pepperoni.', 6, 40, false, 'cafe-pizza', 300),
  (5,  'swan-creek-brewing',         'First pour half price',                'One per person on your first visit. Show the app at the bar.', 30, 90, true,  'cafe-brewery', 500),
  (6,  'la-milpa-taqueria',          'Three tacos for eight dollars',        'Any three street tacos, all day Tuesday.', 12, 55, false, 'cafe-taco', null),
  (7,  'sandpiper-scoops',           'Second scoop free',                    'Buy one scoop, get the second free, before five in the afternoon.', 3, 25, false, 'cafe-icecream', 150),
  (8,  'broadway-deli-and-market',   'Soup and half sandwich for seven',     'Weekday lunch, eleven to two, while the pot lasts.', 18, 50, false, 'cafe-deli', null),
  (9,  'toledo-pierogi-house',       'Dozen frozen pierogi, four off',       'Takeaway only. Any filling on the board that day.', 8, 35, true,  'in-cafe', 120),
  (10, 'birdseye-coffee-bar',        'Free refill on drip',                  'Bring the same cup back the same day.', 25, 70, false, 'cafe-coffee', null),
  (11, 'anthony-wayne-cycles',       'Free safety check',                    'Twenty minute look over any bike, no appointment.', 16, 60, false, 'shop-bikes', 80),
  (12, 'collingwood-books',          'Buy two used, get one free',           'Cheapest of the three is free. Used stock only.', 11, 45, true,  'shop-books', null),
  (13, 'vinyl-and-verse-records',    'Ten percent off the used bins',        'Any Sunday. Does not stack with the buy back.', 5, 40, false, 'shop-records', null),
  (14, 'second-story-thrift',        'Half price on the colour of the week', 'Check the board by the door for this week colour.', 20, 80, false, 'shop-thrift', null),
  (15, 'monroe-street-hardware',     'Free key cut with any purchase',       'One standard key. Not car keys.', 7, 30, false, 'shop-hardware', 200),
  (16, 'cherry-street-cuts',         'Kids cuts half price before noon',     'Saturday mornings, walk in only.', 13, 50, true,  'svc-salon', null),
  (17, 'maumee-valley-yoga',         'First class free',                     'Any drop in class. Mats provided.', 40, 120, false, 'in-gym', 250),
  (18, 'grove-auto-repair',          'Oil change twenty off',                'Most cars and light trucks. Call to check yours.', 10, 45, false, 'svc-auto', 100),
  (19, 'sunshine-laundry-co',        'Wash and fold, one dollar off a pound','Minimum ten pounds. Drop off before ten.', 4, 35, false, 'svc-laundry', null),
  (20, 'perrysburg-flower-market',   'Five off a bunch on Mondays',          'Cut flowers only, while stock lasts.', 2, 28, false, 'shop-florist', 60)
) as v(n, slug, title, description, started, runs, featured, art, limit_count)
join public.businesses b on b.slug = v.slug
where not exists (
  select 1 from public.deals d
  where d.id = ('d3110004-d004-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);

-- Pictures for the three deals seeded in an earlier phase.
update public.deals d
set image_url = coalesce(d.image_url, '/art/obj-deal.svg')
where d.image_url is null;

-- ------------------------------------------------------------------- jobs

insert into public.jobs (
  id, business_id, title, job_type, pay_min, pay_max, pay_type, schedule,
  description, requirements, location_text, hiring_now, apply_method,
  apply_contact, status, featured, no_experience_needed, transit_accessible,
  weekends_only, evenings_nights, teen_friendly, second_chance,
  benefits_offered, training_provided, weekly_pay, remote_ok, created_at
)
select
  ('d3110004-a004-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  b.id, v.title, v.job_type, v.pay_min, v.pay_max, 'hourly', v.schedule,
  v.description, v.requirements, h.name || ', Toledo', true, 'email',
  'jobs.' || b.slug || '@demo.toledolokal.invalid', 'approved', v.n in (1, 5, 10, 17, 21),
  v.no_exp, v.transit, v.weekends, v.evenings, v.teen, v.second_chance,
  v.benefits, v.training, v.weekly, false,
  now() - ((abs(hashtext(v.title)) % 45) || ' days')::interval
from (values
  (1,  'fassett-street-diner',        'Line cook, evenings',        'full-time', 17.0, 20.0, 'Tuesday to Saturday, three to eleven', 'Cooking on a short menu at a busy counter. Two years on a line preferred but we will train the right person.', 'Able to stand a full shift and work Saturdays.', false, true, true, false, true, false, true, true, true),
  (2,  'fassett-street-diner',        'Server, weekend mornings',   'part-time', 12.0, 12.0, 'Saturday and Sunday, six to two', 'Front of house on the two busiest mornings of the week. Tips are pooled.', 'No experience needed. Sixteen and over.', true, true, true, true, false, true, false, false, true, true),
  (3,  'glass-city-roasters',         'Barista, opening shift',     'part-time', 14.0, 16.0, 'Weekdays, six thirty to one', 'Opening the cafe, pulling shots and keeping the bar clean.', 'Comfortable with early starts.', true, true, false, false, false, true, true, false, true, false),
  (4,  'swan-creek-brewing',          'Taproom bartender',          'part-time', 12.0, 14.0, 'Thursday to Sunday nights', 'Pouring, running tabs and closing the bar down.', 'Twenty one and over.', true, true, false, true, false, true, false, false, true, false),
  (5,  'swan-creek-brewing',          'Cellar assistant',           'full-time', 18.0, 21.0, 'Weekdays, seven to three', 'Kegging, cleaning tanks and moving grain. Physical work.', 'Able to lift 50 pounds repeatedly.', true, false, false, false, false, true, true, true, false, false),
  (6,  'maumee-bend-bakery',          'Baker, overnight',           'full-time', 19.0, 23.0, 'Tuesday to Saturday, eleven at night to seven', 'Mixing, shaping and baking the morning bread.', 'One year in a production bakery.', false, false, false, false, true, false, true, true, false, false),
  (7,  'la-milpa-taqueria',           'Prep cook',                  'full-time', 16.0, 18.0, 'Six days, mornings', 'Prepping fillings, salsas and pressing tortillas.', 'Spanish or English, either is fine.', true, true, false, false, false, true, false, true, true, false),
  (8,  'the-rolling-pin',             'Truck assistant',            'part-time', 13.0, 15.0, 'Three mornings a week', 'Serving from the window and restocking between stops.', 'Valid driver licence helps but is not required.', true, true, false, false, false, true, false, false, true, true),
  (9,  'smoke-and-sparrow-bbq',       'Pitmaster assistant',        'part-time', 16.0, 19.0, 'Friday and Saturday, five in the morning on', 'Tending the smoker from before dawn and portioning through service.', 'Willing to start very early.', true, false, false, true, false, false, true, false, true, true),
  (10, 'anthony-wayne-cycles',        'Bike mechanic',              'full-time', 18.0, 24.0, 'Tuesday to Saturday', 'Builds, tune ups and warranty work. Tools provided.', 'Two years wrenching, or a course plus enthusiasm.', false, true, false, false, false, false, true, true, true, false),
  (11, 'collingwood-books',           'Bookseller',                 'part-time', 13.0, 15.0, 'Three days including Saturday', 'Shelving, buying used stock and running the till.', 'Reading widely counts as experience here.', true, true, false, true, false, false, false, false, true, false),
  (12, 'monroe-street-hardware',      'Counter help',               'part-time', 14.0, 16.0, 'Weekday afternoons', 'Helping people find the right fastener and cutting keys.', 'Willing to learn the stock.', true, true, false, false, false, true, true, false, true, true),
  (13, 'second-story-thrift',         'Sorting room assistant',     'part-time', 12.0, 13.0, 'Weekday mornings', 'Sorting donations, tagging and stocking the floor.', 'No experience needed.', true, true, false, false, false, true, true, false, true, true),
  (14, 'cherry-street-cuts',          'Licensed barber',            'gig',       25.0, 40.0, 'Chair rental, set your own days', 'A chair in a busy shop. You keep your book, we cover the shop.', 'Ohio barber licence required.', false, true, false, true, false, false, false, false, false, false),
  (15, 'bloom-hair-studio',           'Salon assistant',            'part-time', 13.0, 15.0, 'Thursday to Saturday', 'Shampooing, folding towels and keeping the floor moving.', 'Cosmetology students welcome.', true, true, false, true, false, true, false, false, true, true),
  (16, 'iron-bridge-strength',        'Front desk, early mornings', 'part-time', 13.0, 14.0, 'Weekdays, five thirty to ten', 'Opening the gym, checking members in and wiping down.', 'Reliable at five in the morning.', true, true, false, false, false, true, false, false, true, true),
  (17, 'northside-plumbing',          'Apprentice plumber',         'full-time', 18.0, 22.0, 'Weekdays', 'Ride along and learn the trade. Paid apprenticeship with a route to licence.', 'Driver licence. No trade experience needed.', true, false, false, false, false, true, true, true, true, true),
  (18, 'grove-auto-repair',           'Tyre and lube technician',   'full-time', 17.0, 20.0, 'Weekdays, eight to five', 'Tyres, oil and inspections in a two bay shop.', 'Own hand tools preferred.', true, true, false, false, false, true, true, true, false, true),
  (19, 'bright-path-learning-center', 'Preschool aide',             'full-time', 15.0, 17.0, 'Weekdays, seven to three thirty', 'Supporting a lead teacher in a room of sixteen.', 'Background check. Training paid for.', true, true, false, false, false, true, false, true, true, false),
  (20, 'warehouse-district-glassworks','Studio assistant',          'part-time', 16.0, 18.0, 'Three days a week', 'Preparing the hot shop, annealing and packing for shipping.', 'Heat tolerance and steady hands.', true, true, false, false, false, false, false, true, true, false),
  (21, 'the-valentine-loft',          'Event setup crew',           'gig',       18.0, 22.0, 'By the event, mostly weekends', 'Setting rooms, running the lift and breaking down after.', 'Able to lift 40 pounds. Late finishes.', true, true, true, true, true, true, true, false, true, true),
  (22, 'cornerstone-community-kitchen','Kitchen coordinator',       'full-time', 20.0, 24.0, 'Tuesday to Saturday', 'Running the meal service, the volunteer rota and the pantry order.', 'Food safety certificate, or we will pay for it.', false, true, false, true, false, false, true, true, true, false)
) as v(n, slug, title, job_type, pay_min, pay_max, schedule, description, requirements,
       no_exp, transit, weekends, evenings, teen, second_chance, benefits, training, weekly)
join public.businesses b on b.slug = v.slug
join public.neighborhoods h on h.id = b.neighborhood_id
where not exists (
  select 1 from public.jobs j
  where j.id = ('d3110004-a004-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);
