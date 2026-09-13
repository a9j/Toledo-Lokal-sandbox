-- Demo city, part 10: the Charter 100 circle.
--
-- SANDBOX ONLY. Do not run against production.
--
-- The Circles surface was not empty, it was absent: the six cohort migrations
-- from June 2026 were never applied to this sandbox, so /circles resolved to
-- /charter-100 and the page threw on a missing table. Those migrations are now
-- applied. This puts something in them.
--
-- All INVENTED. The ten members are the demo residents from part 1, the posts
-- were written for this seed, and no real person said any of it.
--
-- What is visible to whom, which is the point of the RLS on these tables:
--   cohort_pinned_posts  world readable, so the cohort page has content for a
--                        signed out visitor
--   cohort_seat_count()  a definer function, so the seat count shows without
--                        exposing a single member row
--   cohort_posts         circle members and managers only
--   beta_ideas           circle members and managers only
-- The chat and the ideas board are therefore deliberately invisible when
-- signed out. That is the feature working, not a gap in the seed.

-- ------------------------------------------------ the founding ten members

insert into public.cohort_members (id, cohort_id, profile_id, position, joined_at)
select
  md5('demo-charter-member:' || v.n::text)::uuid,
  c.id, p.id, v.n,
  now() - ((220 - v.n * 12) || ' days')::interval
from (values
  (1,  'rosa.delgado@demo.toledolokal.invalid'),
  (2,  'marcus.bell@demo.toledolokal.invalid'),
  (3,  'hannah.pham@demo.toledolokal.invalid'),
  (4,  'dwayne.oketch@demo.toledolokal.invalid'),
  (5,  'sofia.kowalski@demo.toledolokal.invalid'),
  (6,  'terrence.hobbs@demo.toledolokal.invalid'),
  (7,  'amira.saleh@demo.toledolokal.invalid'),
  (8,  'grant.mueller@demo.toledolokal.invalid'),
  (9,  'kayla.brightwater@demo.toledolokal.invalid'),
  (10, 'ellis.vance@demo.toledolokal.invalid')
) as v(n, email)
join auth.users u on u.email = v.email
join public.profiles p on p.user_id = u.id
cross join (select id from public.cohorts where slug = 'charter-100') c
where not exists (
  select 1 from public.cohort_members m
  where m.cohort_id = c.id and m.profile_id = p.id
);

-- The badge is what the charter100-beta circle gates on, so membership without
-- it would leave the ten members locked out of their own circle.
insert into public.profile_badges (id, profile_id, badge_key, awarded_at)
select md5('demo-charter-badge:' || p.id::text)::uuid, p.id, 'charter100', m.joined_at
from public.cohort_members m
join public.profiles p on p.id = m.profile_id
join public.cohorts c on c.id = m.cohort_id and c.slug = 'charter-100'
where not exists (
  select 1 from public.profile_badges b
  where b.profile_id = p.id and b.badge_key = 'charter100'
);

-- --------------------------------------------------------- pinned notices
--
-- World readable, so this is what a signed out visitor actually sees on the
-- cohort page.

insert into public.cohort_pinned_posts (id, cohort_id, title, body, updated_at)
select
  md5('demo-pinned:' || v.n::text)::uuid, c.id, v.title, v.body,
  now() - (v.days_ago || ' days')::interval
from (values
  (1, 'What is coming next',
   'Three things are being built off the back of what this cohort asked for. A civic inbox that tells you when something changes on your street. Address level answers, so trash day and council district come from your address rather than a search. And a jobs board with the filters that actually decide whether someone can take a job.',
   2),
  (2, 'How the charter works',
   'One hundred seats, filled in order, and the number never goes up. Your position is permanent. If you leave, the seat reopens at the lowest free number rather than at the end, so the count always means the same thing.',
   16),
  (3, 'What we changed because you said so',
   'The address verification step no longer asks for a document. Deals now show the terms on the card rather than behind a tap. And the map remembers the last neighbourhood you looked at. All three came from this room.',
   9),
  (4, 'The rule about what is real',
   'Everything in this build is invented: the businesses, the events, the reviews and this notice. Nothing here should be repeated to anyone as a fact about Toledo.',
   30)
) as v(n, title, body, days_ago)
cross join (select id from public.cohorts where slug = 'charter-100') c
where not exists (
  select 1 from public.cohort_pinned_posts pp
  where pp.id = md5('demo-pinned:' || v.n::text)::uuid
);

-- --------------------------------------------------------------- the chat
--
-- On charter100-beta, the badge gated circle the Circles tab opens. Members and
-- managers only.

insert into public.cohort_posts (id, cohort_id, profile_id, body, created_at)
select
  md5('demo-circle-post:' || v.n::text)::uuid, c.id, p.id, v.body,
  now() - (v.hours_ago || ' hours')::interval
from (values
  (1,  'rosa.delgado@demo.toledolokal.invalid',   'First one in the door. Still not over the fact that the seat number is permanent.', 340),
  (2,  'marcus.bell@demo.toledolokal.invalid',    'Has anyone tried the address lookup on an East Toledo address? Mine came back with the wrong council district.', 300),
  (3,  'hannah.pham@demo.toledolokal.invalid',    'Same on Fassett. I assumed it was me.', 296),
  (4,  'ellis.vance@demo.toledolokal.invalid',    'Logged it. It is the boundary file, not you two. Being replaced this month.', 290),
  (5,  'sofia.kowalski@demo.toledolokal.invalid', 'The thing I would use every week is a single list of what is on this weekend that is actually free.', 240),
  (6,  'amira.saleh@demo.toledolokal.invalid',    'Seconded, with a filter for things you can take a six year old to.', 236),
  (7,  'terrence.hobbs@demo.toledolokal.invalid', 'Small thing: the deal cards should say the terms without a tap. I keep getting caught by the before ten one.', 180),
  (8,  'dwayne.oketch@demo.toledolokal.invalid',  'That one is already in. Look at the coffee deal now.', 174),
  (9,  'terrence.hobbs@demo.toledolokal.invalid', 'So it is. That was fast.', 172),
  (10, 'grant.mueller@demo.toledolokal.invalid',  'Anyone else use this mostly on the bus? The map is the one screen that is hard one handed.', 120),
  (11, 'kayla.brightwater@demo.toledolokal.invalid', 'Yes, and the filter sheet closes if you scroll wrong.', 116),
  (12, 'rosa.delgado@demo.toledolokal.invalid',   'Adding both to the list for this week.', 96),
  (13, 'marcus.bell@demo.toledolokal.invalid',    'The glass demo on Saturday is worth going to if anyone has not been. Bring somebody who thinks the city is finished.', 40),
  (14, 'hannah.pham@demo.toledolokal.invalid',    'Taking my dad. He worked a furnace on the east side for thirty years.', 34),
  (15, 'sofia.kowalski@demo.toledolokal.invalid', 'Report a pothole took me eleven seconds this morning, photo and all. That is the whole review.', 8)
) as v(n, email, body, hours_ago)
join auth.users u on u.email = v.email
join public.profiles p on p.user_id = u.id
cross join (select id from public.cohorts where slug = 'charter100-beta') c
where not exists (
  select 1 from public.cohort_posts cp
  where cp.id = md5('demo-circle-post:' || v.n::text)::uuid
);

-- --------------------------------------------------------------- the ideas

insert into public.beta_ideas (id, cohort_id, profile_id, title, description, created_at)
select
  md5('demo-idea:' || v.n::text)::uuid, c.id, p.id, v.title, v.description,
  now() - (v.days_ago || ' days')::interval
from (values
  (1, 'sofia.kowalski@demo.toledolokal.invalid', 'A free this weekend filter',
   'One toggle that leaves only the things that cost nothing. Most weekends that is still twenty items and nobody can find them.', 22),
  (2, 'amira.saleh@demo.toledolokal.invalid', 'Show which events suit small children',
   'Not an age rating, just a flag the organiser sets. Buggy access, somewhere to sit, and whether it runs past seven.', 19),
  (3, 'dwayne.oketch@demo.toledolokal.invalid', 'Bus time instead of drive time on jobs',
   'A job twelve minutes away by car can be an hour by bus with a change. The drive time is the number that misleads people.', 16),
  (4, 'grant.mueller@demo.toledolokal.invalid', 'One handed map',
   'Move the filter button and the neighbourhood pills to the bottom third. Most of us are using this standing up.', 11),
  (5, 'terrence.hobbs@demo.toledolokal.invalid', 'Follow a street, not just a neighbourhood',
   'I care about four blocks, not the whole Old West End. Let me follow the street and get the closures for it.', 8),
  (6, 'kayla.brightwater@demo.toledolokal.invalid', 'Let a shop post that it is closing early',
   'A one line notice with an expiry. It would stop half the wasted trips.', 5),
  (7, 'hannah.pham@demo.toledolokal.invalid', 'A printable version of the weekend list',
   'For the people on my street who do not use the app. I would put it through their doors.', 3)
) as v(n, email, title, description, days_ago)
join auth.users u on u.email = v.email
join public.profiles p on p.user_id = u.id
cross join (select id from public.cohorts where slug = 'charter100-beta') c
where not exists (
  select 1 from public.beta_ideas i
  where i.id = md5('demo-idea:' || v.n::text)::uuid
);

-- Votes, so the board has an order rather than being a flat list. Which member
-- voted for what is decided by a hash, so it is the same on every run.
insert into public.beta_idea_votes (id, idea_id, profile_id, created_at)
select
  md5('demo-vote:' || i.id::text || ':' || p.id::text)::uuid, i.id, p.id,
  i.created_at + interval '2 hours'
from public.beta_ideas i
join public.cohorts c on c.id = i.cohort_id and c.slug = 'charter100-beta'
join public.profiles p on p.user_id in (
  select u.id from auth.users u where u.email like '%@demo.toledolokal.invalid'
)
where (abs(hashtext(i.id::text || p.id::text)) % 10) < 6
  and not exists (
    select 1 from public.beta_idea_votes v
    where v.idea_id = i.id and v.profile_id = p.id
  );

insert into public.beta_idea_comments (id, idea_id, profile_id, body, created_at)
select
  md5('demo-idea-comment:' || v.n::text)::uuid, i.id, p.id, v.body,
  i.created_at + (v.hours_after || ' hours')::interval
from (values
  (1, 1, 'marcus.bell@demo.toledolokal.invalid',    'Would want it to include the library and the parks, not only the ticketed things marked free.', 6),
  (2, 1, 'ellis.vance@demo.toledolokal.invalid',    'It reads the price field, so anything with no price is in. Parks included.', 20),
  (3, 3, 'rosa.delgado@demo.toledolokal.invalid',   'This is the one. Half the jobs board is unreachable without a car and the listing never says so.', 9),
  (4, 3, 'ellis.vance@demo.toledolokal.invalid',    'Straight line distance and a speed constant gets us most of the way before any transit feed.', 30),
  (5, 5, 'hannah.pham@demo.toledolokal.invalid',    'Following a street would also fix the block watch notices going to the whole neighbourhood.', 12),
  (6, 6, 'terrence.hobbs@demo.toledolokal.invalid', 'As long as it expires on its own. Nothing worse than a closing early notice from last March.', 7)
) as v(n, idea_n, email, body, hours_after)
join public.beta_ideas i on i.id = md5('demo-idea:' || v.idea_n::text)::uuid
join auth.users u on u.email = v.email
join public.profiles p on p.user_id = u.id
where not exists (
  select 1 from public.beta_idea_comments bc
  where bc.id = md5('demo-idea-comment:' || v.n::text)::uuid
);
