-- Demo city, part 7: the front page and the feed.
--
-- SANDBOX ONLY. Do not run against production.
--
-- The Today tab reads daily_drops, and with none published it shows its empty
-- state, which means the front door of the demo is a shrug. This publishes a
-- drop for today and the six days before it, and fills the Pulse feed.
--
-- Everything is INVENTED: no business posted these, no event is happening, and
-- the neighbourhood energy numbers are made up rather than measured.

-- ------------------------------------------------------------ pulse posts
--
-- Two constraints shape these rows. content is capped at 140 characters, and
-- every post must have either a user or a business behind it, so the city
-- notices are attributed to a resident passing them on rather than to nobody.

insert into public.pulse_posts (
  id, category, content_type, content, headline, preview_text, why_it_matters,
  created_at, expires_at, business_id, nonprofit_id, user_id, location_text,
  neighborhood, status, is_pinned, helpful_count, reaction_count, author_type,
  hero_image, tags, post_type, share_enabled, auto_generated
)
select
  ('d3110007-9075-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid,
  v.category::public.pulse_category, v.content_type, v.content, v.headline,
  left(v.content, 110), v.why,
  now() - (v.hours_ago || ' hours')::interval,
  now() + (v.expires_in_hours || ' hours')::interval,
  b.id, np.id, u.id, v.location_text, v.hood, 'active'::public.pulse_post_status,
  v.n <= 2, (abs(hashtext(v.headline)) % 24), (abs(hashtext(v.content)) % 40),
  case when b.id is not null then 'business' else 'user' end,
  case when v.art is not null then '/art/' || v.art || '.svg' end,
  v.tags, 'update', true, false
from (values
  (1, 'right_now', 'business_activity', 'Fresh morning buns just out. About twenty left and then that is it for today.', 'Morning buns are out', 'Bakery things go fast and this is the only warning you get.', 2, 8, 'glass-city-roasters', null, null, 'Glass City Roasters', 'Downtown', 'cafe-bakery', array['food','morning']),
  (2, 'heads_up', 'city_signal', 'Water Street is one lane at Jefferson while the utility work finishes. Add five minutes at rush hour.', 'One lane on Water Street', 'It is the main way into the warehouse district from the north.', 5, 72, null, null, 'marcus.bell@demo.toledolokal.invalid', 'Water St at Jefferson', 'Downtown', null, array['traffic','downtown']),
  (3, 'good_stuff', 'community_activity', 'The coat drive filled two rails on the first morning. Still taking anything warm in adult sizes.', 'Two rails filled by lunchtime', 'Every coat here goes straight back out the same week.', 9, 96, null, 'demo-warm-coats-toledo', 'rosa.delgado@demo.toledolokal.invalid', 'Second Story Thrift', 'West Toledo', 'obj-volunteer', array['volunteer','winter']),
  (4, 'right_now', 'business_activity', 'Parked on Water Street until two, or until the brisket runs out. Usually the brisket.', 'Parked on Water Street', 'The truck moves daily and this is where it landed.', 1, 6, 'smoke-and-sparrow-bbq', null, null, 'Water St lot', 'Downtown', 'svc-foodtruck', array['food','truck']),
  (5, 'community_ask', 'community_activity', 'Need two more for the garden work day on Saturday. Tools are there, you just need boots.', 'Two more for Saturday', 'The beds have to be turned before the frost.', 14, 120, null, null, 'hannah.pham@demo.toledolokal.invalid', 'Fassett St garden', 'East Toledo', 'out-garden', array['volunteer','garden']),
  (6, 'energy_check', 'local_moment', 'Downtown is busy for a Thursday. Something is on at the park and every outside table is taken.', 'Busy for a Thursday', 'Good to know before you drive in looking for a quiet lunch.', 3, 10, null, null, 'marcus.bell@demo.toledolokal.invalid', 'Promenade Park', 'Downtown', 'out-skyline', array['downtown','busy']),
  (7, 'heads_up', 'business_activity', 'Closed Monday for a floor refinish. Back Tuesday at the usual time.', 'Closed Monday only', 'Save yourself the trip.', 20, 168, 'old-west-end-barber-co', null, null, 'Old West End Barber Co', 'Old West End', null, array['hours']),
  (8, 'good_stuff', 'local_moment', 'Somebody has been quietly weeding the tree pits along Collingwood all week. Thank you.', 'Thank you to whoever is weeding', 'Small maintenance nobody is paid to do.', 26, 96, null, null, 'terrence.hobbs@demo.toledolokal.invalid', 'Collingwood Blvd', 'Old West End', null, array['neighbourhood']),
  (9, 'right_now', 'business_activity', 'Twelve taps on and the food truck outside tonight is the gyro one.', 'Taproom open, gyros outside', 'The truck rotates, so it is worth knowing which one it is.', 4, 9, 'swan-creek-brewing', null, null, 'Swan Creek Brewing', 'South Toledo', 'cafe-brewery', array['food','evening']),
  (10, 'community_ask', 'community_activity', 'Four more readers needed for the spring term. One hour a week, same child each time.', 'Four tutors needed', 'The commitment is a school year, which is why they ask early.', 30, 240, null, 'demo-reading-corner-tutors', 'amira.saleh@demo.toledolokal.invalid', 'East Toledo Branch Library', 'East Toledo', 'in-classroom', array['volunteer','children']),
  (11, 'heads_up', 'city_signal', 'Bulk pickup on the east side moves to Wednesday next week because of the holiday.', 'Bulk pickup moves to Wednesday', 'Missing it means another fortnight with the sofa on the verge.', 40, 168, null, null, 'hannah.pham@demo.toledolokal.invalid', 'East Toledo', 'East Toledo', null, array['city','waste']),
  (12, 'good_stuff', 'business_activity', 'Hot shop demonstration this Saturday at eleven. Free to watch, no booking.', 'Glass demo Saturday', 'The furnace is only open to the public once a week.', 12, 120, 'warehouse-district-glassworks', null, null, 'Warehouse District Glassworks', 'Downtown', 'bld-factory', array['makers','free']),
  (13, 'energy_check', 'local_moment', 'The market on Superior is quieter than usual, probably the rain. Good time to go.', 'Market is quiet today', 'Same stalls, a third of the people.', 6, 8, null, null, 'kayla.brightwater@demo.toledolokal.invalid', 'N Superior St', 'Downtown', 'ev-market', array['market']),
  (14, 'right_now', 'business_activity', 'Two chairs free right now, walk in if you are nearby.', 'Two chairs free', 'Walk in only until noon, so this is the window.', 1, 4, 'cherry-street-cuts', null, null, 'Cherry Street Cuts', 'Downtown', 'svc-salon', array['services']),
  (15, 'community_ask', 'community_activity', 'Short on volunteers Thursday night. Two hours, washing up and serving.', 'Short on Thursday', 'Three hundred meals a week only happens if the rota fills.', 8, 60, 'cornerstone-community-kitchen', null, null, 'Cornerstone Community Kitchen', 'South Toledo', 'in-cafe', array['volunteer','food']),
  (16, 'good_stuff', 'community_activity', 'The new crossing on Central went in this week. It took three years of asking.', 'The crossing is finally in', 'Turning up to meetings sometimes works.', 18, 168, null, null, 'amira.saleh@demo.toledolokal.invalid', 'W Central Ave', 'Sylvania', null, array['city','walking']),
  (17, 'heads_up', 'business_activity', 'Fish fry is Friday and Saturday only this month. Takeout window round the side.', 'Fish fry, Friday and Saturday', 'People turn up on a Thursday and are disappointed.', 22, 120, 'point-place-fish-fry', null, null, 'Point Place Fish Fry', 'West Toledo', 'cafe-deli', array['food']),
  (18, 'right_now', 'local_moment', 'Rowing crews out and the light on the water is doing something worth stopping for.', 'The river this morning', 'Ten minutes on the bank beats ten on the phone.', 3, 12, null, null, 'grant.mueller@demo.toledolokal.invalid', 'Maumee River', 'Maumee', 'out-riverfront', array['outdoors']),
  (19, 'good_stuff', 'business_activity', 'The apprentice we took on in spring passed his first assessment this week.', 'Our apprentice passed', 'The programme works and it is still taking applications.', 34, 168, 'northside-plumbing', null, null, 'Northside Plumbing', 'West Toledo', 'obj-job', array['work']),
  (20, 'energy_check', 'city_signal', 'Every table on the block is full and the queue at the taco place is out the door.', 'Western Ave is packed', 'Park two streets back and walk.', 2, 6, null, null, 'ellis.vance@demo.toledolokal.invalid', 'Western Ave', 'South Toledo', 'ev-block-party', array['busy','food']),
  (21, 'heads_up', 'community_activity', 'The health van route for next week is posted. Two stops have changed.', 'Health van route changed', 'The van is the only clinic some of these streets get.', 16, 168, null, 'demo-neighborhood-health-van', 'sofia.kowalski@demo.toledolokal.invalid', 'Downtown', 'Downtown', 'bld-clinic', array['health']),
  (22, 'good_stuff', 'local_moment', 'The mural on the side of the print shop is finished. Bigger than it looked in the drawing.', 'The mural is finished', 'Go and look while it is new.', 28, 168, 'toledo-mural-collective', null, null, 'Riverbend Print Shop wall', 'East Toledo', 'svc-gallery', array['art']),
  (23, 'community_ask', 'community_activity', 'Anyone got a folding table we can borrow for Saturday? Ours has finally given up.', 'Table needed for Saturday', 'Borrowing beats buying for something used twice a year.', 7, 48, null, null, 'ellis.vance@demo.toledolokal.invalid', 'South Toledo', 'South Toledo', null, array['ask']),
  (24, 'right_now', 'business_activity', 'Second scoop is free until five and the board has three new flavours on it.', 'Second scoop free until five', 'The board changes weekly and today is a good week.', 2, 7, 'sandpiper-scoops', null, null, 'Sandpiper Scoops', 'Maumee', 'cafe-icecream', array['food','family'])
) as v(n, category, content_type, content, headline, why, hours_ago, expires_in_hours,
       business_slug, nonprofit_slug, author_email, location_text, hood, art, tags)
left join public.businesses b on b.slug = v.business_slug
left join public.nonprofits np on np.slug = v.nonprofit_slug
left join auth.users u on u.email = v.author_email
where not exists (
  select 1 from public.pulse_posts p
  where p.id = ('d3110007-9075-4000-8000-0000000000' || lpad(v.n::text, 2, '0'))::uuid
);

-- The four posts an earlier phase seeded have no picture and expire soon.
update public.pulse_posts
set hero_image = coalesce(hero_image, '/art/out-skyline.svg'),
    expires_at = greatest(expires_at, now() + interval '5 days')
where hero_image is null or expires_at < now();

-- ---------------------------------------------------------- daily drops

insert into public.daily_drops (id, drop_date, title, subtitle, status, publish_time, created_at)
select
  md5('demo-drop:' || (current_date - g.d)::text)::uuid,
  current_date - g.d,
  v.title, v.subtitle, 'published',
  (current_date - g.d)::timestamptz + interval '6 hours',
  (current_date - g.d)::timestamptz + interval '5 hours'
from generate_series(0, 6) as g(d)
join (values
  (0, 'Thursday in Toledo',  'A market under the lights, brisket on Water Street and one lane at Jefferson.'),
  (1, 'Wednesday in Toledo', 'Quiet downtown, a hot shop warming up and two chairs free on Cherry.'),
  (2, 'Tuesday in Toledo',   'Taco night on Western, and the taproom has the gyro truck outside.'),
  (3, 'Monday in Toledo',    'Slow start, bulk pickup moves this week, and the bakery is closed.'),
  (4, 'Sunday in Toledo',    'Lunch at the community kitchen and the long way along the water.'),
  (5, 'Saturday in Toledo',  'Market, glass demo and a block that closed itself for the afternoon.'),
  (6, 'Friday in Toledo',    'Fish fry, first Friday galleries and the light on the river at six.')
) as v(d, title, subtitle) on v.d = g.d
where not exists (
  select 1 from public.daily_drops dd where dd.drop_date = current_date - g.d
);

insert into public.daily_drop_highlights (id, daily_drop_id, highlight_type, title,
                                          subtitle, link_url, link_text, icon, sort_order)
select
  md5('demo-highlight:' || dd.drop_date::text || ':' || v.sort_order::text)::uuid,
  dd.id, v.highlight_type, v.title, v.subtitle, v.link_url, v.link_text, v.icon, v.sort_order
from public.daily_drops dd
join (values
  (0, 'event',        'Thursday Night Market',      'Twenty stalls in Promenade Park from five.',   '/events', 'See what is on', 'calendar'),
  (1, 'deal',         'Kids eat free on Saturday',  'One free kids meal with every adult meal.',    '/deals',  'See the deals',  'tag'),
  (2, 'announcement', 'One lane on Water Street',   'Utility work at Jefferson. Five extra minutes.','/inbox', 'City notices',   'megaphone'),
  (3, 'tip',          'Two chairs free at Cherry',  'Walk in only before noon.',                     '/discover', 'Find a place', 'sparkles')
) as v(sort_order, highlight_type, title, subtitle, link_url, link_text, icon) on true
where dd.drop_date between current_date - 6 and current_date
  and not exists (
    select 1 from public.daily_drop_highlights h
    where h.id = md5('demo-highlight:' || dd.drop_date::text || ':' || v.sort_order::text)::uuid
  );

insert into public.daily_drop_spotlights (id, daily_drop_id, business_id, spotlight_type,
                                          custom_headline, custom_description, sort_order)
select
  md5('demo-spotlight:' || dd.drop_date::text || ':' || v.sort_order::text)::uuid,
  dd.id, b.id, v.spotlight_type, v.headline, v.description, v.sort_order
from public.daily_drops dd
join (values
  (0, 'business',   'glass-city-roasters',           'The one everybody starts at',   'Small batch roaster on the ground floor of a restored warehouse.'),
  (1, 'food_truck', 'smoke-and-sparrow-bbq',         'Where the truck is today',      'Brisket, ribs and two sides. Usually gone by two.'),
  (2, 'business',   'warehouse-district-glassworks', 'Still the Glass City',          'Hot shop with demonstrations every Saturday morning.')
) as v(sort_order, spotlight_type, slug, headline, description) on true
join public.businesses b on b.slug = v.slug
where dd.drop_date between current_date - 6 and current_date
  and not exists (
    select 1 from public.daily_drop_spotlights s
    where s.id = md5('demo-spotlight:' || dd.drop_date::text || ':' || v.sort_order::text)::uuid
  );

insert into public.daily_drop_moments (id, daily_drop_id, title, description, image_url,
                                       link_url, link_text)
select
  md5('demo-moment:' || dd.drop_date::text)::uuid,
  dd.id, v.title, v.description, '/art/' || v.art || '.svg', '/stories', 'Read the story'
from public.daily_drops dd
join (values
  (0, 'Our street closed itself for a day',        'Eleven households, three grills and a paddling pool nobody could account for.', 'ev-block-party'),
  (1, 'Two dozen at a time, the way she did it',   'A folding class, a grandmother and a pinch that is nearly hers.',              'in-cafe'),
  (2, 'Why we are still called the Glass City',    'The furnaces are mostly gone. On a Saturday you can still watch one work.',    'bld-factory'),
  (3, 'The shop that knows what I have read',      'Two hundred books bought, no record kept, and a stack waiting every time.',    'shop-books'),
  (4, 'What three hundred meals a week looks like','Six people in a kitchen built for two, and a queue before the doors open.',    'in-cafe'),
  (5, 'The morning I learned everyone has a usual','A month of silence, then a drink started before the order.',                    'cafe-coffee'),
  (6, 'The apprenticeship that changed the year',  'Nights on a pallet stack to sizing a line in eight months.',                    'obj-job')
) as v(d, title, description, art) on v.d = (current_date - dd.drop_date)
where dd.drop_date between current_date - 6 and current_date
  and not exists (
    select 1 from public.daily_drop_moments m
    where m.id = md5('demo-moment:' || dd.drop_date::text)::uuid
  );

-- --------------------------------------------- signals and neighbourhood mood

insert into public.city_signals (id, signal_type, title, subtitle, neighborhood, category,
                                 metric, valid_from, valid_until, payload)
select
  md5('demo-signal:' || v.n::text)::uuid,
  v.signal_type, v.title, v.subtitle, v.hood, v.category, v.metric,
  now() - (v.hours_ago || ' hours')::interval,
  now() + (v.valid_hours || ' hours')::interval,
  jsonb_build_object('source', 'sandbox seed', 'invented', true)
from (values
  (1, 'busy',      'Downtown is busier than usual', 'About a third more people out than a normal Thursday.', 'Downtown', 'activity', 1.34, 2, 12),
  (2, 'closure',   'Water Street down to one lane',  'Utility work at Jefferson until the end of next week.', 'Downtown', 'traffic', null, 6, 168),
  (3, 'new',       'Three places opened this month', 'A taproom, a print shop and a preschool.', 'East Toledo', 'growth', 3, 48, 336),
  (4, 'weather',   'Rain from four this afternoon',  'The market runs anyway. Bring a bag you can close.', 'Downtown', 'weather', null, 3, 10),
  (5, 'quiet',     'West Toledo is quiet today',     'Half the usual foot traffic on Monroe.', 'West Toledo', 'activity', 0.52, 4, 14)
) as v(n, signal_type, title, subtitle, hood, category, metric, hours_ago, valid_hours)
where not exists (
  select 1 from public.city_signals s where s.id = md5('demo-signal:' || v.n::text)::uuid
);

-- neighborhood_activity is keyed by name and recomputed rather than appended,
-- so this replaces the row for each neighbourhood.
delete from public.neighborhood_activity where neighborhood in (
  select name from public.neighborhoods
);

insert into public.neighborhood_activity (neighborhood, activity_score, energy_level,
                                          energy_emoji, label, computed_at)
values
  -- energy_level is constrained to quiet | calm | steady | active | buzzing.
  ('Downtown',     0.86, 'buzzing', '🔥', 'Busy tonight',       now()),
  ('East Toledo',  0.61, 'active',  '✨', 'Steady',             now()),
  ('Old West End', 0.48, 'steady',  '🌿', 'Quiet and pleasant', now()),
  ('West Toledo',  0.35, 'calm',    '🌙', 'Slow today',         now()),
  ('South Toledo', 0.72, 'active',  '🌮', 'Taco night',         now()),
  ('Sylvania',     0.44, 'steady',  '🚲', 'Out and about',      now()),
  ('Maumee',       0.53, 'steady',  '🚣', 'On the water',       now()),
  ('Perrysburg',   0.40, 'quiet',   '☕', 'Gentle',             now());
