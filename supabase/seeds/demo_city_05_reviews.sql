-- Demo city, part 5: reviews.
--
-- SANDBOX ONLY. Do not run against production.
--
-- INVENTED. Every review below was written for this seed, attributed to one of
-- the ten demo accounts from part 1, about a business that does not exist. None
-- of it is a real customer opinion.
--
-- The text is chosen from a pool per kind of business rather than one pool for
-- everything, because a hardware shop praised for its espresso is the tell that
-- gives a demo away. Which review lands on which business is decided by a hash
-- of the business id, so it is the same every time this runs.

with pool as (
  select * from (values
    -- group, slot, rating, title, body
    ('food', 0, 5, 'Worth the wait',            'Busy at lunch and it is obvious why. Everything came out hot and the person at the counter knew the menu backwards.'),
    ('food', 1, 4, 'Solid every time',          'Been in maybe a dozen times now. Never had a bad one, and they remember what you ordered last.'),
    ('food', 2, 5, 'Better than it needs to be','Prices are what you would expect for the neighbourhood and the food is a step above that.'),
    ('food', 3, 3, 'Good food, slow at peak',   'The food is genuinely good. Go before noon or after two, because the queue at one is long.'),
    ('food', 4, 5, 'Took the whole family',     'Loud enough that nobody minded the kids and quick enough that we were out in forty minutes.'),
    ('food', 5, 4, 'The regulars are right',    'Somebody at work told me to come here for a year before I did. They were right and I was slow.'),
    ('shop', 0, 5, 'They actually help you',    'Walked in not knowing what I needed and walked out with the right thing and no upsell.'),
    ('shop', 1, 4, 'Good stock, small space',   'Packed in tight but they seem to have everything. Ask rather than hunt for it yourself.'),
    ('shop', 2, 5, 'My default now',            'I stopped ordering this kind of thing online. Same price, and I get it the same day.'),
    ('shop', 3, 4, 'Nice people',               'Friendly without hovering. Happy to let you browse and there when you have a question.'),
    ('shop', 4, 3, 'Hours could be longer',     'No complaints about the shop itself. I just keep turning up ten minutes after they close.'),
    ('shop', 5, 5, 'Found something I had given up on', 'Been looking for this for two years. They had it on the shelf and did not charge a premium for it.'),
    ('service', 0, 5, 'Straight answer, fair price', 'Told me what was wrong, what it would cost and what could wait. Nothing was added on at the end.'),
    ('service', 1, 4, 'Booked me in quickly',   'Called on a Tuesday and was seen that week, which is not what I expected.'),
    ('service', 2, 5, 'Did what they said',     'Turned up in the window they gave, cleaned up after and the work has held.'),
    ('service', 3, 4, 'Would use again',        'Not the cheapest quote I got but the one that explained the most, and I am glad I went with it.'),
    ('service', 4, 3, 'Good work, quiet on updates', 'The job itself was fine. I did have to chase for the date twice.'),
    ('service', 5, 5, 'Saved me a bigger bill', 'Could have sold me a replacement and told me a repair would do. It did.'),
    ('care', 0, 5, 'My kid asks to go',         'That is the whole review really. Staff are steady and the room is calm.'),
    ('care', 1, 4, 'Good communication',        'I get a note about the day, not just a wave at pickup.'),
    ('care', 2, 5, 'Felt right on the tour',    'Went round three places. This was the one where the children looked busy and happy.'),
    ('care', 3, 4, 'Waitlist is long',          'Worth getting on it early. Once you are in, it is everything we hoped.'),
    ('care', 4, 5, 'The staff stay',            'Same faces two years running, which tells you more than any brochure.'),
    ('care', 5, 3, 'Great care, tight parking', 'No issue with the care at all. Pickup at five is a scrum on that street.'),
    ('venue', 0, 5, 'Everyone asked about it',  'Held a party here and half the guests wanted to know how to book it.'),
    ('venue', 1, 4, 'Easy to work with',        'Flexible on setup and clear about what was and was not included.'),
    ('venue', 2, 5, 'The room does the work',   'Barely had to decorate. Good light and a view that carried the evening.'),
    ('venue', 3, 4, 'Sound is good',            'Brought a band in and it held up. Load in through the back is straightforward.'),
    ('venue', 4, 3, 'Lovely space, book early', 'Only mark against it is that the dates go fast.'),
    ('venue', 5, 5, 'Staff made it painless',   'Two people on the night who quietly handled everything.'),
    ('maker', 0, 5, 'Real craft',               'You can watch the work happening. Bought a piece and it is the nicest thing in the house.'),
    ('maker', 1, 4, 'Good for a gift',          'Range of prices, so you can spend a little or a lot and still take home something good.'),
    ('maker', 2, 5, 'Class was excellent',      'Small group, patient teaching, and I came out with something I actually kept.'),
    ('maker', 3, 4, 'Took a commission',        'Talked through what I wanted and came back with better than I described.'),
    ('maker', 4, 3, 'Limited opening',          'Wonderful work. Just check the hours before you drive over.'),
    ('maker', 5, 5, 'Toledo should be proud',   'This is the kind of place people should be told about when they visit.')
  ) as t(grp, slot, rating, title, body)
), targets as (
  select b.id as business_id,
         b.name,
         case b.category::text
           when 'restaurant' then 'food'
           when 'food_truck' then 'food'
           when 'retail' then 'shop'
           when 'salon_barber' then 'service'
           when 'gym_fitness' then 'service'
           when 'contractor_service' then 'service'
           when 'professional_service' then 'service'
           when 'childcare' then 'care'
           when 'event_venue' then 'venue'
           when 'artist_maker' then 'maker'
           else 'shop'
         end as grp,
         -- Two to five reviews each, so the directory has both quiet listings
         -- and busy ones rather than a uniform three everywhere.
         2 + (abs(hashtext(b.id::text)) % 4) as want
  from public.businesses b
), authors as (
  select row_number() over (order by u.created_at) - 1 as idx, u.id
  from auth.users u
  where u.email like '%@demo.toledolokal.invalid'
), numbered as (
  select t.business_id, t.grp, g.n,
         (abs(hashtext(t.business_id::text)) + g.n * 7) % 6 as slot,
         -- reviews is unique on (business_id, user_id), so the authors for one
         -- business have to be distinct: five consecutive slots mod ten never
         -- repeat.
         (abs(hashtext(t.business_id::text)) + g.n) % 10 as author_slot
  from targets t
  cross join generate_series(1, 5) as g(n)
  where g.n <= t.want
)
insert into public.reviews (id, business_id, user_id, rating, title, content,
                            helpful_count, created_at, updated_at)
select
  -- Deterministic id from the business and the slot, so a second run inserts
  -- nothing rather than doubling every review.
  md5(nu.business_id::text || ':review:' || nu.n::text)::uuid,
  nu.business_id, a.id, p.rating, p.title, p.body,
  (abs(hashtext(nu.business_id::text || nu.n::text)) % 9),
  now() - ((abs(hashtext(nu.business_id::text || nu.n::text)) % 200 + 3) || ' days')::interval,
  now() - ((abs(hashtext(nu.business_id::text || nu.n::text)) % 200 + 3) || ' days')::interval
from numbered nu
join pool p on p.grp = nu.grp and p.slot = nu.slot
join authors a on a.idx = nu.author_slot
where not exists (
  select 1 from public.reviews r
  where r.id = md5(nu.business_id::text || ':review:' || nu.n::text)::uuid
);

-- The card and the header read these two columns rather than counting rows, so
-- they have to be recomputed after any change to reviews.
update public.businesses b
set average_rating = round(s.avg_rating, 1),
    review_count   = s.n
from (
  select business_id, avg(rating)::numeric avg_rating, count(*) n
  from public.reviews group by business_id
) s
where s.business_id = b.id;
