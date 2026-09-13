-- Demo city, part 2: the directory.
--
-- SANDBOX ONLY. Do not run against production.
--
-- Everything below is INVENTED. None of these businesses exist, nobody has
-- agreed to be listed, and the phone numbers are in the 555 range that is
-- reserved for fiction. Street names are real Toledo streets because a
-- directory of fake streets is useless for judging the layout, but no number
-- on them is a real address.
--
-- Pictures point at /art, the drawn set committed under public/art. They are
-- drawings, not photographs of these places, which is the honest thing to show
-- for a business that does not exist.
--
-- Idempotent: every insert is keyed on a fixed uuid and skipped if present.
-- Re-running refreshes the pictures and hours on the twelve rows that were
-- already here.

-- ---------------------------------------------------------------- new rows

with hood as (
  select name, id from public.neighborhoods
), hours_preset as (
  select * from (values
    ('cafe', '{"monday":{"open":"07:00","close":"15:00"},"tuesday":{"open":"07:00","close":"15:00"},"wednesday":{"open":"07:00","close":"15:00"},"thursday":{"open":"07:00","close":"15:00"},"friday":{"open":"07:00","close":"17:00"},"saturday":{"open":"08:00","close":"17:00"},"sunday":{"open":"08:00","close":"14:00"}}'::jsonb),
    ('dinner', '{"monday":{"closed":true},"tuesday":{"open":"16:00","close":"22:00"},"wednesday":{"open":"16:00","close":"22:00"},"thursday":{"open":"16:00","close":"22:00"},"friday":{"open":"16:00","close":"23:00"},"saturday":{"open":"12:00","close":"23:00"},"sunday":{"open":"12:00","close":"20:00"}}'::jsonb),
    ('shop', '{"monday":{"open":"10:00","close":"18:00"},"tuesday":{"open":"10:00","close":"18:00"},"wednesday":{"open":"10:00","close":"18:00"},"thursday":{"open":"10:00","close":"19:00"},"friday":{"open":"10:00","close":"19:00"},"saturday":{"open":"10:00","close":"17:00"},"sunday":{"closed":true}}'::jsonb),
    ('trade', '{"monday":{"open":"08:00","close":"17:00"},"tuesday":{"open":"08:00","close":"17:00"},"wednesday":{"open":"08:00","close":"17:00"},"thursday":{"open":"08:00","close":"17:00"},"friday":{"open":"08:00","close":"16:00"},"saturday":{"closed":true},"sunday":{"closed":true}}'::jsonb),
    ('early', '{"monday":{"open":"06:00","close":"18:00"},"tuesday":{"open":"06:00","close":"18:00"},"wednesday":{"open":"06:00","close":"18:00"},"thursday":{"open":"06:00","close":"18:00"},"friday":{"open":"06:00","close":"18:00"},"saturday":{"closed":true},"sunday":{"closed":true}}'::jsonb),
    ('late', '{"monday":{"open":"11:00","close":"23:00"},"tuesday":{"open":"11:00","close":"23:00"},"wednesday":{"open":"11:00","close":"23:00"},"thursday":{"open":"11:00","close":"00:00"},"friday":{"open":"11:00","close":"01:00"},"saturday":{"open":"11:00","close":"01:00"},"sunday":{"open":"12:00","close":"21:00"}}'::jsonb),
    ('allweek', '{"monday":{"open":"07:00","close":"21:00"},"tuesday":{"open":"07:00","close":"21:00"},"wednesday":{"open":"07:00","close":"21:00"},"thursday":{"open":"07:00","close":"21:00"},"friday":{"open":"07:00","close":"21:00"},"saturday":{"open":"08:00","close":"20:00"},"sunday":{"open":"09:00","close":"18:00"}}'::jsonb)
  ) as t(kind, hours)
), incoming as (
  select * from (values
    -- id, name, category, neighbourhood, address, art, logo, hours kind, slug, description, story, verified, featured
    ('d3110001-b002-4000-8000-000000000013'::uuid, 'Fassett Street Diner', 'restaurant', 'East Toledo', '414 Fassett St', 'cafe-diner', 'logo-fork', 'allweek', 'fassett-street-diner',
     'Booths, a counter and breakfast served until close. Cash and card.',
     'Two sisters took over the lease in 2016 and kept the original counter stools.', true, true),
    ('d3110001-b002-4000-8000-000000000014'::uuid, 'Adams Street Pizza Co', 'restaurant', 'Downtown', '1719 Adams St', 'cafe-pizza', 'logo-fork', 'late', 'adams-street-pizza-co',
     'Thin crust by the slice until late, whole pies to order.', null, true, false),
    ('d3110001-b002-4000-8000-000000000015'::uuid, 'Swan Creek Brewing', 'restaurant', 'South Toledo', '2205 Broadway St', 'cafe-brewery', 'logo-cup', 'late', 'swan-creek-brewing',
     'Taproom in a former hardware store. Twelve taps, no kitchen, food trucks most nights.',
     'The bar top is one plank off a barn that came down on Airport Highway.', true, true),
    ('d3110001-b002-4000-8000-000000000016'::uuid, 'La Milpa Taqueria', 'restaurant', 'South Toledo', '1030 Western Ave', 'cafe-taco', 'logo-fork', 'late', 'la-milpa-taqueria',
     'Tacos, tortas and aguas frescas. Tortillas pressed in house every morning.', null, true, false),
    ('d3110001-b002-4000-8000-000000000017'::uuid, 'Sandpiper Scoops', 'restaurant', 'Maumee', '108 W Wayne St', 'cafe-icecream', 'logo-cup', 'allweek', 'sandpiper-scoops',
     'Walk up ice cream window with a rotating flavour board.', null, false, false),
    ('d3110001-b002-4000-8000-000000000018'::uuid, 'Broadway Deli and Market', 'restaurant', 'South Toledo', '2626 Broadway St', 'cafe-deli', 'logo-loaf', 'cafe', 'broadway-deli-and-market',
     'Sandwich counter at the back of a small grocery. Soup changes daily.', null, true, false),
    ('d3110001-b002-4000-8000-000000000019'::uuid, 'Toledo Pierogi House', 'restaurant', 'West Toledo', '3245 Lagrange St', 'in-cafe', 'logo-fork', 'cafe', 'toledo-pierogi-house',
     'Pierogi by the dozen, frozen or on a plate, plus soups in winter.',
     'The recipe came over with a grandmother in 1951 and has not been written down since.', true, true),
    ('d3110001-b002-4000-8000-000000000020'::uuid, 'Birdseye Coffee Bar', 'restaurant', 'Sylvania', '5700 Main St', 'cafe-coffee', 'logo-cup', 'cafe', 'birdseye-coffee-bar',
     'Espresso, filter and a short pastry case. Quiet enough to work in.', null, true, false),
    ('d3110001-b002-4000-8000-000000000021'::uuid, 'Point Place Fish Fry', 'restaurant', 'West Toledo', '4842 Summit St', 'cafe-deli', 'logo-fork', 'dinner', 'point-place-fish-fry',
     'Perch and walleye, Friday and Saturday only. Takeout window round the side.', null, false, false),
    ('d3110001-b002-4000-8000-000000000022'::uuid, 'The Rolling Pin', 'food_truck', 'Downtown', 'Moves daily', 'svc-foodtruck', 'logo-loaf', 'cafe', 'the-rolling-pin',
     'Pastry truck. Morning buns, kouign amann and drip coffee.', null, true, false),
    ('d3110001-b002-4000-8000-000000000023'::uuid, 'Smoke and Sparrow BBQ', 'food_truck', 'East Toledo', 'Moves daily', 'svc-foodtruck', 'logo-fork', 'late', 'smoke-and-sparrow-bbq',
     'Brisket, ribs and two sides. Sells out most Saturdays by two.', null, true, true),
    ('d3110001-b002-4000-8000-000000000024'::uuid, 'Glass City Gyro Truck', 'food_truck', 'Downtown', 'Moves daily', 'svc-foodtruck', 'logo-fork', 'late', 'glass-city-gyro-truck',
     'Gyros, fries and a garlic sauce people ask about.', null, false, false),
    ('d3110001-b002-4000-8000-000000000025'::uuid, 'Collingwood Books', 'retail', 'Old West End', '2214 Collingwood Blvd', 'shop-books', 'logo-book', 'shop', 'collingwood-books',
     'Used and new, heavy on local history. Reading chairs upstairs.',
     'The building was a doctor surgery until 1974 and the waiting room is now poetry.', true, true),
    ('d3110001-b002-4000-8000-000000000026'::uuid, 'Vinyl and Verse Records', 'retail', 'Downtown', '26 N Huron St', 'shop-records', 'logo-spark', 'shop', 'vinyl-and-verse-records',
     'Records, tapes and a listening station. Buys collections on Sundays.', null, true, false),
    ('d3110001-b002-4000-8000-000000000027'::uuid, 'Second Story Thrift', 'retail', 'West Toledo', '3810 Secor Rd', 'shop-thrift', 'logo-hanger', 'shop', 'second-story-thrift',
     'Clothes, books and housewares. Half price tags change colour every Monday.', null, false, false),
    ('d3110001-b002-4000-8000-000000000028'::uuid, 'Monroe Street Hardware', 'retail', 'West Toledo', '4419 Monroe St', 'shop-hardware', 'logo-wrench', 'trade', 'monroe-street-hardware',
     'Fasteners, paint mixing, screen repair and keys cut while you wait.', null, true, false),
    ('d3110001-b002-4000-8000-000000000029'::uuid, 'Perrysburg Flower Market', 'retail', 'Perrysburg', '117 Louisiana Ave', 'shop-florist', 'logo-leaf', 'shop', 'perrysburg-flower-market',
     'Cut flowers, house plants and arrangements for pickup same day.', null, true, false),
    ('d3110001-b002-4000-8000-000000000030'::uuid, 'Sylvania Home Goods', 'retail', 'Sylvania', '5645 N Main St', 'shop-boutique', 'logo-house', 'shop', 'sylvania-home-goods',
     'Kitchen things, linens and gifts from makers in the region.', null, false, false),
    ('d3110001-b002-4000-8000-000000000031'::uuid, 'Cherry Street Cuts', 'salon_barber', 'Downtown', '820 Cherry St', 'svc-salon', 'logo-scissors', 'shop', 'cherry-street-cuts',
     'Barbering and fades, walk ins before noon, booked after.', null, true, false),
    ('d3110001-b002-4000-8000-000000000032'::uuid, 'Bloom Hair Studio', 'salon_barber', 'Sylvania', '5820 Monroe St', 'in-salon', 'logo-scissors', 'shop', 'bloom-hair-studio',
     'Colour, cuts and consultations. Four chairs, appointment only.', null, true, false),
    ('d3110001-b002-4000-8000-000000000033'::uuid, 'Maumee Valley Yoga', 'gym_fitness', 'Maumee', '425 Illinois Ave', 'in-gym', 'logo-leaf', 'allweek', 'maumee-valley-yoga',
     'Drop in classes seven days a week. Mats provided, first class free.', null, true, false),
    ('d3110001-b002-4000-8000-000000000034'::uuid, 'Iron Bridge Strength', 'gym_fitness', 'East Toledo', '1220 Front St', 'in-gym', 'logo-weight', 'early', 'iron-bridge-strength',
     'Barbell gym with coached mornings and open lifting the rest of the day.', null, false, false),
    ('d3110001-b002-4000-8000-000000000035'::uuid, 'Northside Plumbing', 'contractor_service', 'West Toledo', '2916 Tremainsville Rd', 'bld-construction', 'logo-wrench', 'trade', 'northside-plumbing',
     'Repairs, water heaters and drain work. Same week appointments most weeks.', null, true, false),
    ('d3110001-b002-4000-8000-000000000036'::uuid, 'Grove Auto Repair', 'contractor_service', 'South Toledo', '1840 South Ave', 'svc-auto', 'logo-wrench', 'trade', 'grove-auto-repair',
     'General repair and state inspections. Two bays, no appointment needed for tyres.', null, true, false),
    ('d3110001-b002-4000-8000-000000000037'::uuid, 'Lucas County Roofing', 'contractor_service', 'Sylvania', '6510 Central Ave', 'bld-construction', 'logo-hammer', 'trade', 'lucas-county-roofing',
     'Roof repair and replacement for homes across the county. Free estimates.', null, false, false),
    ('d3110001-b002-4000-8000-000000000038'::uuid, 'Bright Path Learning Center', 'childcare', 'Perrysburg', '805 W South Boundary St', 'in-classroom', 'logo-bulb', 'early', 'bright-path-learning-center',
     'Preschool and before school care. Licensed for 48 children.', null, true, false),
    ('d3110001-b002-4000-8000-000000000039'::uuid, 'Little Acorns Preschool', 'childcare', 'Maumee', '1210 Conant St', 'svc-childcare', 'logo-leaf', 'early', 'little-acorns-preschool',
     'Play based preschool with an outdoor classroom in the back garden.', null, true, false),
    ('d3110001-b002-4000-8000-000000000040'::uuid, 'Warehouse District Glassworks', 'artist_maker', 'Downtown', '44 Water St', 'bld-factory', 'logo-spark', 'shop', 'warehouse-district-glassworks',
     'Hot shop with demonstrations on Saturdays and a small gallery in front.',
     'Toledo is the Glass City and this furnace has not been cold since 2009.', true, true),
    ('d3110001-b002-4000-8000-000000000041'::uuid, 'Riverbend Print Shop', 'artist_maker', 'East Toledo', '702 Main St', 'svc-print', 'logo-palette', 'shop', 'riverbend-print-shop',
     'Screen printing and risograph. Small runs for bands, teams and nonprofits.', null, true, false),
    ('d3110001-b002-4000-8000-000000000042'::uuid, 'Toledo Mural Collective', 'artist_maker', 'Old West End', '1908 Delaware Ave', 'svc-gallery', 'logo-palette', 'shop', 'toledo-mural-collective',
     'A studio of muralists taking commissions on walls across the city.', null, false, false),
    ('d3110001-b002-4000-8000-000000000043'::uuid, 'The Valentine Loft', 'event_venue', 'Downtown', '400 N Superior St', 'svc-venue', 'logo-spark', 'shop', 'the-valentine-loft',
     'Top floor event space for 120, with a lift and a river view.', null, true, true),
    ('d3110001-b002-4000-8000-000000000044'::uuid, 'Maumee River Boathouse', 'event_venue', 'Maumee', '1 Rivercrest Dr', 'out-marina', 'logo-pin', 'shop', 'maumee-river-boathouse',
     'Boathouse hall and lawn, hired for weddings and club dinners.', null, false, false),
    ('d3110001-b002-4000-8000-000000000045'::uuid, 'Glass City Legal', 'professional_service', 'Downtown', '316 N Michigan St', 'in-office', 'logo-book', 'trade', 'glass-city-legal',
     'Small firm doing housing, small business and estate work.', null, true, false),
    ('d3110001-b002-4000-8000-000000000046'::uuid, 'Northwest Ohio Web Studio', 'professional_service', 'Sylvania', '5679 Main St', 'in-office', 'logo-bulb', 'trade', 'northwest-ohio-web-studio',
     'Websites and booking systems for shops and trades in the region.', null, true, false),
    ('d3110001-b002-4000-8000-000000000047'::uuid, 'Harbor Financial Planning', 'professional_service', 'Perrysburg', '25700 N Dixie Hwy', 'svc-cpa', 'logo-book', 'trade', 'harbor-financial-planning',
     'Retirement and college planning. First meeting costs nothing.', null, false, false),
    ('d3110001-b002-4000-8000-000000000048'::uuid, 'Toledo Mobile Vet', 'professional_service', 'West Toledo', '3801 W Central Ave', 'bld-clinic', 'logo-leaf', 'trade', 'toledo-mobile-vet',
     'Vet visits at home for cats and dogs, across Lucas County.', null, true, false),
    ('d3110001-b002-4000-8000-000000000049'::uuid, 'Sunshine Laundry Co', 'retail', 'South Toledo', '1518 Airport Hwy', 'svc-laundry', 'logo-hanger', 'allweek', 'sunshine-laundry-co',
     'Coin laundry open early to late, with wash and fold by the pound.', null, false, false),
    ('d3110001-b002-4000-8000-000000000050'::uuid, 'Cornerstone Community Kitchen', 'community_org', 'South Toledo', '1934 Broadway St', 'in-cafe', 'logo-fork', 'allweek', 'cornerstone-community-kitchen',
     'Free hot meals four nights a week and a pantry open Saturday morning.',
     'Started in a church basement with one pot and now serves about 300 meals a week.', true, true)
  ) as t(id, name, category, hood_name, address, art, logo, hours_kind, slug, description, story, verified, featured)
)
insert into public.businesses (
  id, name, category, category_id, neighborhood_id, address, phone, website,
  description, story, hours, status, verified, featured, slug,
  cover_image_url, logo_url, profile_picture_url, is_nonprofit, created_at, updated_at
)
select i.id, i.name, i.category::public.business_category,
       (select c.id from public.categories c where c.slug = case
          when i.category in ('restaurant','food_truck') then 'food-drink'
          when i.category = 'retail' then 'shopping'
          when i.category = 'salon_barber' then 'beauty'
          when i.category = 'gym_fitness' then 'health-wellness'
          when i.category = 'contractor_service' then 'home-services'
          when i.category = 'childcare' then 'family-kids'
          when i.category = 'artist_maker' then 'arts-nightlife'
          when i.category = 'event_venue' then 'events'
          when i.category = 'community_org' then 'nonprofits-community'
          else 'local-services' end),
       h.id, i.address,
       -- 555 is the number range reserved for fiction, so no demo row can ring
       -- a real telephone.
       '(419) 555-' || lpad((1000 + (abs(hashtext(i.name)) % 9000))::text, 4, '0'),
       'https://example.com/' || i.slug,
       i.description, i.story, hp.hours, 'approved', i.verified, i.featured, i.slug,
       '/art/' || i.art || '.svg', '/art/' || i.logo || '.svg', '/art/' || i.logo || '.svg',
       i.category = 'community_org',
       now() - ((abs(hashtext(i.slug)) % 300) || ' days')::interval, now()
from incoming i
join hood h on h.name = i.hood_name
join hours_preset hp on hp.kind = i.hours_kind
where not exists (select 1 from public.businesses b where b.id = i.id);

-- ------------------------------------------------- pictures for the first 12
--
-- The twelve rows the earlier phases seeded have never had a picture, hours or
-- a slug, so they render as grey tiles beside the new ones.

update public.businesses b
set cover_image_url = '/art/' || v.art || '.svg',
    logo_url        = '/art/' || v.logo || '.svg',
    profile_picture_url = '/art/' || v.logo || '.svg',
    slug            = coalesce(b.slug, v.slug),
    hours           = coalesce(b.hours, hp.hours),
    featured        = v.featured,
    phone           = coalesce(b.phone, '(419) 555-' || lpad((1000 + (abs(hashtext(b.name)) % 9000))::text, 4, '0')),
    website         = coalesce(b.website, 'https://example.com/' || v.slug),
    updated_at      = now()
from (values
  ('0c105001-b001-4000-8000-000000000000'::uuid, 'cafe-coffee',       'logo-cup',      'glass-city-roasters',    'cafe',    true),
  ('0c105001-b001-4000-8000-000000000001'::uuid, 'cafe-bakery',       'logo-loaf',     'maumee-bend-bakery',     'cafe',    true),
  ('0c105001-b001-4000-8000-000000000002'::uuid, 'shop-bikes',        'logo-wheel',    'anthony-wayne-cycles',   'shop',    false),
  ('0c105001-b001-4000-8000-000000000003'::uuid, 'svc-barber',        'logo-scissors', 'old-west-end-barber-co', 'shop',    false),
  ('0c105001-b001-4000-8000-000000000004'::uuid, 'in-gym',            'logo-weight',   'riverside-strength',     'early',   false),
  ('0c105001-b001-4000-8000-000000000005'::uuid, 'bld-construction',  'logo-hammer',   'sylvania-timber-works',  'trade',   false),
  ('0c105001-b001-4000-8000-000000000006'::uuid, 'svc-childcare',     'logo-bulb',     'little-lantern-childcare','early',  false),
  ('0c105001-b001-4000-8000-000000000007'::uuid, 'svc-studio',        'logo-palette',  'kiln-and-key-pottery',   'shop',    true),
  ('0c105001-b001-4000-8000-000000000008'::uuid, 'bld-warehouse',     'logo-spark',    'the-warehouse-room',     'shop',    false),
  ('0c105001-b001-4000-8000-000000000009'::uuid, 'svc-cpa',           'logo-book',     'ledger-and-lantern-cpa', 'trade',   false),
  ('0c105001-b001-4000-8000-000000000010'::uuid, 'cafe-supper',       'logo-fork',     'south-end-supper-club',  'dinner',  true),
  ('0c105001-b001-4000-8000-000000000011'::uuid, 'cafe-grocery',      'logo-leaf',     'front-street-provisions','allweek', false)
) as v(id, art, logo, slug, hours_kind, featured)
join (values
  ('cafe', '{"monday":{"open":"07:00","close":"15:00"},"tuesday":{"open":"07:00","close":"15:00"},"wednesday":{"open":"07:00","close":"15:00"},"thursday":{"open":"07:00","close":"15:00"},"friday":{"open":"07:00","close":"17:00"},"saturday":{"open":"08:00","close":"17:00"},"sunday":{"open":"08:00","close":"14:00"}}'::jsonb),
  ('dinner', '{"monday":{"closed":true},"tuesday":{"open":"16:00","close":"22:00"},"wednesday":{"open":"16:00","close":"22:00"},"thursday":{"open":"16:00","close":"22:00"},"friday":{"open":"16:00","close":"23:00"},"saturday":{"open":"12:00","close":"23:00"},"sunday":{"open":"12:00","close":"20:00"}}'::jsonb),
  ('shop', '{"monday":{"open":"10:00","close":"18:00"},"tuesday":{"open":"10:00","close":"18:00"},"wednesday":{"open":"10:00","close":"18:00"},"thursday":{"open":"10:00","close":"19:00"},"friday":{"open":"10:00","close":"19:00"},"saturday":{"open":"10:00","close":"17:00"},"sunday":{"closed":true}}'::jsonb),
  ('trade', '{"monday":{"open":"08:00","close":"17:00"},"tuesday":{"open":"08:00","close":"17:00"},"wednesday":{"open":"08:00","close":"17:00"},"thursday":{"open":"08:00","close":"17:00"},"friday":{"open":"08:00","close":"16:00"},"saturday":{"closed":true},"sunday":{"closed":true}}'::jsonb),
  ('early', '{"monday":{"open":"06:00","close":"18:00"},"tuesday":{"open":"06:00","close":"18:00"},"wednesday":{"open":"06:00","close":"18:00"},"thursday":{"open":"06:00","close":"18:00"},"friday":{"open":"06:00","close":"18:00"},"saturday":{"closed":true},"sunday":{"closed":true}}'::jsonb),
  ('allweek', '{"monday":{"open":"07:00","close":"21:00"},"tuesday":{"open":"07:00","close":"21:00"},"wednesday":{"open":"07:00","close":"21:00"},"thursday":{"open":"07:00","close":"21:00"},"friday":{"open":"07:00","close":"21:00"},"saturday":{"open":"08:00","close":"20:00"},"sunday":{"open":"09:00","close":"18:00"}}'::jsonb)
) as hp(kind, hours) on hp.kind = v.hours_kind
where b.id = v.id;

-- ------------------------------------------------------- where they all are
--
-- One primary location per business, so the map and the "near me" distance
-- sorting have coordinates to work with. Coordinates are the rough centre of
-- the neighbourhood with a small offset from the id, not surveyed points.

insert into public.business_locations (business_id, label, street_address, city, state,
                                       zip_code, neighborhood, latitude, longitude, phone,
                                       hours, is_primary, is_active)
select b.id, 'Main', coalesce(nullif(b.address, 'Moves daily'), 'Location varies'), 'Toledo', 'OH',
       n.zip, n.name,
       n.lat + ((abs(hashtext(b.id::text)) % 100) - 50) * 0.0004,
       n.lng + ((abs(hashtext(b.name)) % 100) - 50) * 0.0005,
       b.phone, b.hours, true, true
from public.businesses b
join public.neighborhoods h on h.id = b.neighborhood_id
join (values
  ('Downtown',     41.6528, -83.5379, '43604'),
  ('East Toledo',  41.6470, -83.5150, '43605'),
  ('Old West End', 41.6700, -83.5600, '43620'),
  ('West Toledo',  41.6900, -83.6100, '43613'),
  ('South Toledo', 41.6180, -83.5680, '43609'),
  ('Sylvania',     41.7190, -83.7130, '43560'),
  ('Maumee',       41.5620, -83.6540, '43537'),
  ('Perrysburg',   41.5570, -83.6270, '43551')
) as n(name, lat, lng, zip) on n.name = h.name
where not exists (select 1 from public.business_locations l where l.business_id = b.id);

-- The first twelve rows were seeded before categories were wired up, so they
-- carry the business_category enum but no category_id, and the category filters
-- on Discover never match them.
update public.businesses b
set category_id = (select c.id from public.categories c where c.slug = case b.category::text
      when 'restaurant' then 'food-drink'
      when 'food_truck' then 'food-drink'
      when 'retail' then 'shopping'
      when 'salon_barber' then 'beauty'
      when 'gym_fitness' then 'health-wellness'
      when 'contractor_service' then 'home-services'
      when 'childcare' then 'family-kids'
      when 'artist_maker' then 'arts-nightlife'
      when 'event_venue' then 'events'
      when 'community_org' then 'nonprofits-community'
      when 'nonprofit' then 'nonprofits-community'
      else 'local-services' end)
where b.category_id is null and b.category is not null;

-- The join table the category filters read.
insert into public.business_categories (business_id, category_id, is_primary)
select b.id, b.category_id, true
from public.businesses b
where b.category_id is not null
  and not exists (
    select 1 from public.business_categories bc
    where bc.business_id = b.id and bc.category_id = b.category_id
  );
