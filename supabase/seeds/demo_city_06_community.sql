-- Demo city, part 6: the community side.
--
-- SANDBOX ONLY. Do not run against production.
--
-- Six more INVENTED nonprofits (making twelve), pictures for the six that were
-- already here, plus stories, tours, challenges and programs. None of these
-- organisations exists. Nobody has agreed to be listed, no volunteer shift is
-- real, and every link goes to example.com rather than to a live donation page.

insert into public.nonprofits (
  id, name, slug, cause_category, neighborhood_id, mission_statement,
  what_this_helps, community_support_types, human_note, founding_community_partner,
  claimed, website, email, phone, address, logo_url, cover_image_url, status, created_at
)
select
  ('d3110006-c006-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  v.name, 'demo-' || v.slug, v.cause::public.cause_category, h.id, v.mission,
  v.helps, v.support::public.community_support_type[], v.note, v.founding, false,
  'https://example.com/' || v.slug, v.slug || '@demo.toledolokal.invalid',
  '(419) 555-' || lpad((1000 + (abs(hashtext(v.name)) % 9000))::text, 4, '0'),
  v.address, '/art/' || v.logo || '.svg', '/art/' || v.art || '.svg', 'active',
  now() - ((abs(hashtext(v.slug)) % 400) || ' days')::interval
from (values
  (1, 'Warm Coats Toledo', 'warm-coats-toledo', 'community_support', 'West Toledo', '3810 Secor Rd',
   'Collect, clean and hand out winter coats so nobody in Lucas County goes without one.',
   'A coat, hat and gloves for anyone who asks, from October to March.',
   array['donations','volunteers','supplies'], 'Started with a rail in a church porch and now fills a shop unit each winter.',
   false, 'obj-volunteer', 'logo-hanger'),
  (2, 'Reading Corner Tutors', 'reading-corner-tutors', 'education', 'East Toledo', '1015 Front St',
   'One to one reading help for children in grades one to four, after school and free.',
   'An hour a week with the same tutor, for as long as a child needs it.',
   array['volunteers','donations'], 'Tutors commit to a whole school year, because swapping people mid year does not work.',
   true, 'in-classroom', 'logo-book'),
  (3, 'Bridge Street Animal Rescue', 'bridge-street-animal-rescue', 'animal_welfare', 'South Toledo', '1740 Airport Hwy',
   'Foster, treat and rehome cats and dogs from across the county.',
   'Vet care and a foster place for animals that would otherwise be put down.',
   array['volunteers','donations','supplies'], 'Every animal goes to a foster home first. There are no kennels here.',
   false, 'bld-clinic', 'logo-leaf'),
  (4, 'Veterans Workshop', 'veterans-workshop', 'veterans', 'Downtown', '210 N Erie St',
   'A workshop and a coffee pot where veterans teach each other trades.',
   'Tools, bench space and company, four days a week.',
   array['volunteers','donations','supplies'], 'Nobody is asked what they did. They are asked what they want to make.',
   false, 'svc-studio', 'logo-hammer'),
  (5, 'Open Doors Disability Advocates', 'open-doors-disability-advocates', 'disability_services', 'Old West End', '2101 Collingwood Blvd',
   'Help people get the services they are entitled to, and push buildings to open up.',
   'Someone in your corner for a benefits appeal, a housing form or an access complaint.',
   array['volunteers','awareness','donations'], 'Half the staff have a disability themselves, which is the point.',
   true, 'bld-centre', 'logo-pin'),
  (6, 'Neighborhood Health Van', 'neighborhood-health-van', 'health', 'Downtown', '600 Jefferson Ave',
   'A clinic on wheels parked where people already are, four days a week.',
   'Blood pressure, blood sugar, flu shots and a referral if you need one.',
   array['volunteers','donations','awareness'], 'The van route is published every Sunday and it does not change on a whim.',
   false, 'bld-clinic', 'logo-bulb')
) as v(n, name, slug, cause, hood, address, mission, helps, support, note, founding, art, logo)
join public.neighborhoods h on h.name = v.hood
where not exists (
  select 1 from public.nonprofits np
  where np.id = ('d3110006-c006-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);

-- Pictures for the six seeded earlier.
update public.nonprofits np
set cover_image_url = '/art/' || v.art || '.svg',
    logo_url = '/art/' || v.logo || '.svg'
from (values
  ('demo-glass-city-food-share',      'in-cafe',        'logo-fork'),
  ('demo-porch-light-housing-fund',   'bld-bungalow',   'logo-house'),
  ('demo-maumee-valley-youth-build',  'bld-construction','logo-hammer'),
  ('demo-riverbank-restoration',      'out-riverfront', 'logo-leaf'),
  ('demo-toledo-story-collective',    'svc-gallery',    'logo-palette'),
  ('demo-second-shift-senior-care',   'bld-centre',     'logo-pin')
) as v(slug, art, logo)
where np.slug = v.slug and np.cover_image_url is null;

-- --------------------------------------------------------------- stories

insert into public.stories (id, author_id, business_id, neighborhood_id, title, content,
                            image_url, story_type, likes_count, status, featured, created_at)
select
  ('d3110006-57a6-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  a.id, b.id, h.id, v.title, v.content, '/art/' || v.art || '.svg', v.story_type,
  (abs(hashtext(v.title)) % 60) + 4, 'approved', v.n <= 3,
  now() - (v.days_ago || ' days')::interval
from (values
  (1, 'rosa.delgado@demo.toledolokal.invalid', 'glass-city-roasters', 'Downtown', 'The morning I learned everyone here has a usual',
   'I came in for a month before anybody said anything to me beyond the order. Then one Tuesday the person on bar started making my drink when I walked through the door and asked how the move went. I had mentioned it once, in October. That is the thing about a small place. Nothing is anonymous for long, and after a while you stop wanting it to be.',
   'cafe-coffee', 'hidden_gem', 12),
  (2, 'marcus.bell@demo.toledolokal.invalid', 'warehouse-district-glassworks', 'Downtown', 'Why we are still called the Glass City',
   'My grandfather worked a furnace on the east side for thirty one years. He used to say the city smelled like sand and heat. Most of that is gone now, but on a Saturday morning you can still stand in a hot shop downtown and watch a gather turn into something. It is a small thing next to what the industry was. It is not nothing.',
   'bld-factory', 'memory', 26),
  (3, 'hannah.pham@demo.toledolokal.invalid', null, 'East Toledo', 'Our street closed itself for a day',
   'Somebody put a note through every door: we are closing the block on Saturday, bring a chair. Eleven households came out. By four in the afternoon there were forty people, three grills and a paddling pool that nobody could account for. Nobody had asked the city. Nobody needed to. We just moved the cones back at seven.',
   'ev-block-party', 'memory', 40),
  (4, 'dwayne.oketch@demo.toledolokal.invalid', 'northside-plumbing', 'West Toledo', 'The apprenticeship that changed the year',
   'I was stacking pallets nights and going nowhere. A guy at the counter of the hardware shop said the plumbers were taking someone on with no experience. Eight months later I can size a line and I know what I am doing under a sink. I am not going to pretend it was easy. It was just possible, which is more than I had before.',
   'obj-job', 'recommendation', 60),
  (5, 'sofia.kowalski@demo.toledolokal.invalid', 'toledo-pierogi-house', 'West Toledo', 'Two dozen at a time, the way she did it',
   'My grandmother folded pierogi at a kitchen table on Lagrange for fifty years and never wrote a recipe down. I went to the folding class here mostly to see if I could get close. I did not. But I came home with two dozen and a pinch that is nearly hers, and I cried in the car about it, which I did not expect.',
   'in-cafe', 'memory', 88),
  (6, 'terrence.hobbs@demo.toledolokal.invalid', 'collingwood-books', 'Old West End', 'The shop that knows what I have already read',
   'I have bought maybe two hundred books here. They keep no record of it and somehow they still know. Every time I go in there is a stack by the till with my name on a slip of paper. Half of it I would never have picked up. Most of that half turned out to be the good half.',
   'shop-books', 'recommendation', 33),
  (7, 'amira.saleh@demo.toledolokal.invalid', null, 'Sylvania', 'Learning the school run by bike',
   'We tried it for a week as an experiment and it stuck. It takes eleven minutes longer than the car and the children arrive awake. The only hard part was the stretch with no crossing, which is now the thing I turn up to council meetings about.',
   'out-trail', 'tip', 17),
  (8, 'ellis.vance@demo.toledolokal.invalid', 'cornerstone-community-kitchen', 'South Toledo', 'What three hundred meals a week actually looks like',
   'Six people in a kitchen built for two, an order that arrives at seven and a queue that starts forming before the doors open. It is not sad in there. It is loud and fast and people know each other. The hard part is not the cooking. It is that the numbers go up every year.',
   'in-cafe', 'hidden_gem', 51)
) as v(n, author_email, business_slug, hood, title, content, art, story_type, days_ago)
join auth.users a on a.email = v.author_email
left join public.businesses b on b.slug = v.business_slug
join public.neighborhoods h on h.name = v.hood
where not exists (
  select 1 from public.stories s
  where s.id = ('d3110006-57a6-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);

-- ----------------------------------------------------------------- tours

insert into public.tours (id, title, description, neighborhood_id, duration_minutes,
                          distance_miles, difficulty, image_url, featured, status, created_at)
select
  ('d3110006-70a6-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  v.title, v.description, h.id, v.minutes, v.miles, v.difficulty,
  '/art/' || v.art || '.svg', v.n <= 2, 'active', now() - (v.n * 12 || ' days')::interval
from (values
  (1, 'A morning downtown', 'Coffee, a record shop and the river, in the order that makes sense before lunch.', 'Downtown', 120, 1.4, 'easy', 'out-skyline'),
  (2, 'Old West End porches', 'Nine blocks of Victorian houses with a stop for a haircut and a book.', 'Old West End', 150, 2.1, 'easy', 'bld-victorian'),
  (3, 'Eat the east side', 'Four places within a mile, none of which take more than twenty minutes.', 'East Toledo', 180, 1.8, 'easy', 'cafe-diner'),
  (4, 'Makers and menders', 'A print shop, a pottery studio and a hot shop, with the hardware store in between.', 'Downtown', 210, 2.6, 'moderate', 'svc-print'),
  (5, 'The long way along the water', 'A river walk with two stops for food and one for ice cream.', 'Maumee', 240, 4.2, 'moderate', 'out-riverfront')
) as v(n, title, description, hood, minutes, miles, difficulty, art)
join public.neighborhoods h on h.name = v.hood
where not exists (
  select 1 from public.tours t
  where t.id = ('d3110006-70a6-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);

insert into public.tour_stops (id, tour_id, business_id, stop_order, title, description, tip, deal_text)
select
  md5(v.tour_n::text || ':stop:' || v.stop_order::text)::uuid,
  ('d3110006-70a6-4000-8000-0000000000' || lpad(v.tour_n::text, 2, '0'))::uuid,
  b.id, v.stop_order, v.title, v.description, v.tip, v.deal_text
from (values
  (1, 1, 'glass-city-roasters',           'Start with coffee',      'Ground floor of a restored warehouse. Order at the bar.', 'Before ten is quiet.', 'Two dollars off any pour over'),
  (1, 2, 'vinyl-and-verse-records',       'Records next door',      'Twenty minutes in the used bins is the right amount.', 'Ask what came in this week.', null),
  (1, 3, 'adams-street-pizza-co',         'Slice on the way out',   'Two slices and a drink is the whole lunch.', 'Cheese is the honest test.', 'Two slices and a drink for six'),
  (2, 1, 'collingwood-books',             'Books first',            'Local history is the shelf by the window.', 'The reading chairs upstairs are fair game.', 'Buy two used, get one free'),
  (2, 2, 'old-west-end-barber-co',        'A haircut mid tour',     'Walk in and wait on the bench outside if it is warm.', 'Cash is faster.', null),
  (2, 3, 'kiln-and-key-pottery',          'Finish at the studio',   'Members are usually working and happy to be watched.', 'Saturday afternoon is busiest.', null),
  (3, 1, 'fassett-street-diner',          'Breakfast, any time',    'Breakfast runs until close, which is the point.', 'Sit at the counter.', 'Kids eat free on Saturday'),
  (3, 2, 'front-street-provisions',       'Pick up something',      'Corner grocery with local dairy and good bread.', 'The produce is best on delivery days.', null),
  (3, 3, 'smoke-and-sparrow-bbq',         'If the truck is out',    'Check the app for where it parked today.', 'Go before two or it is gone.', null),
  (4, 1, 'riverbend-print-shop',          'Ink first',              'Screen printing and risograph in one room.', 'They will show you the press.', null),
  (4, 2, 'monroe-street-hardware',        'The middle stop',        'Keys, paint and the answer to most questions.', 'Free key cut with any purchase.', 'Free key cut with any purchase'),
  (4, 3, 'warehouse-district-glassworks', 'Finish hot',             'Demonstrations run on Saturdays.', 'Stand behind the line, it is genuinely hot.', null),
  (5, 1, 'maumee-bend-bakery',            'Bread for the walk',     'Buy it now, eat it on a bench later.', 'Closed Mondays.', 'Free loaf with a dozen pastries'),
  (5, 2, 'maumee-river-boathouse',        'The turn',               'The lawn is the halfway point and a good place to stop.', 'Watch for rowing crews early.', null),
  (5, 3, 'sandpiper-scoops',              'Ice cream to end',       'Walk up window, flavour board changes weekly.', 'Second scoop is free before five.', 'Second scoop free')
) as v(tour_n, stop_order, slug, title, description, tip, deal_text)
join public.businesses b on b.slug = v.slug
where not exists (
  select 1 from public.tour_stops s
  where s.id = md5(v.tour_n::text || ':stop:' || v.stop_order::text)::uuid
);

-- ------------------------------------------------------------ challenges

insert into public.challenges (id, title, description, category_id, required_visits,
                               reward_description, badge_icon, badge_color, start_date,
                               end_date, featured, status, created_at)
select
  ('d3110006-c4a1-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  v.title, v.description,
  (select id from public.categories where slug = v.cat_slug),
  v.visits, v.reward, v.icon, v.colour,
  current_date - v.started, current_date + v.runs, v.n <= 2, 'active',
  now() - (v.started || ' days')::interval
from (values
  (1, 'Five coffees, five neighbourhoods', 'Buy a coffee in five different neighbourhoods. Any size, any shop on the list.', 'food-drink', 5, 'A free drink at the fifth stop and the Glass City badge.', 'coffee', '#2F7BEE', 12, 60),
  (2, 'Eat the east side', 'Three meals at three east side places in one month.', 'food-drink', 3, 'Ten dollars off your next meal at any of them.', 'utensils', '#BE6B3D', 20, 45),
  (3, 'Maker month', 'Visit four studios or workshops and watch something being made.', 'arts-nightlife', 4, 'Entry to the maker fair and a badge for the passport.', 'palette', '#22836B', 5, 75),
  (4, 'Shop the small ones', 'Six independent shops before the end of the season.', 'shopping', 6, 'A tote from the shop of your choice.', 'shopping-bag', '#FBBE2E', 30, 90),
  (5, 'Walk the river', 'Three riverfront places on foot, in any order.', 'outdoors-recreation', 3, 'The Riverbank badge and a free hot drink at the last stop.', 'map', '#26566E', 8, 50)
) as v(n, title, description, cat_slug, visits, reward, icon, colour, started, runs)
where not exists (
  select 1 from public.challenges c
  where c.id = ('d3110006-c4a1-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);

-- ------------------------------------------------------------- programs

insert into public.programs (id, title, overview, eligibility, benefits, signup_url,
                             status, featured, category_id, created_at)
select
  ('d3110006-9106-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  v.title, v.overview, v.eligibility, v.benefits, 'https://example.com/' || v.slug,
  case when v.n = 5 then 'coming_soon' else 'open' end, v.n <= 2,
  (select id from public.categories where slug = v.cat_slug),
  now() - (v.n * 21 || ' days')::interval
from (values
  (1, 'Storefront Facade Grant', 'storefront-facade-grant',
   'Matching money for shopfront repairs on a main street: paint, signage, awnings and glass.',
   'Any independent business renting or owning a ground floor unit on a designated corridor.',
   'Up to five thousand dollars, matched one to one. Paid on receipts after the work.', 'home-services'),
  (2, 'First Job Program', 'first-job-program',
   'Six weeks of paid work over the summer for people aged sixteen to nineteen, placed with local employers.',
   'Aged sixteen to nineteen, living in Lucas County, no prior work history needed.',
   'Paid at the state minimum or better, plus a bus pass and a reference at the end.', 'jobs-opportunities'),
  (3, 'Home Repair Fund', 'home-repair-fund',
   'Help with the repairs that keep a house safe: roofs, furnaces, steps and ramps.',
   'Owner occupiers under a household income threshold. One award per household.', 
   'Grants up to twelve thousand dollars, with a contractor from an approved list.', 'home-services'),
  (4, 'Small Business Bookkeeping Clinic', 'bookkeeping-clinic',
   'Four evenings with an accountant, in a group of ten, working on your own books.',
   'Any business trading under three years, or thinking about starting one.',
   'Free, including the software licence for a year.', 'professional-services'),
  (5, 'Neighborhood Tree Planting', 'neighborhood-tree-planting',
   'A free street tree planted outside your house, chosen for the space and the soil.',
   'Any address on a residential street with a verge wide enough.',
   'The tree, the planting and two years of watering visits, at no cost.', 'outdoors-recreation'),
  (6, 'Digital Skills at the Library', 'digital-skills-library',
   'Weekly drop in sessions on the things people actually get stuck on, from email to spreadsheets.',
   'Anyone with a library card, which is also free.',
   'One to one help, and a laptop to borrow for the course if you need one.', 'education-classes')
) as v(n, title, slug, overview, eligibility, benefits, cat_slug)
where not exists (
  select 1 from public.programs p
  where p.id = ('d3110006-9106-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);
