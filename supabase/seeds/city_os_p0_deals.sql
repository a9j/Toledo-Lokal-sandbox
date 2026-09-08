-- Phase 0 seed: three deals.
--
-- INVENTED. None of these offers exist and no business has agreed to them.
-- They are here so the roadmap's own search test can actually be run:
-- "cheap stuff for kids Saturday" is supposed to return events, deals and
-- businesses in one list, and with an empty deals table it could only ever
-- return two of the three.
--
-- Every row is attributed to the Sandbox seed source, so the app labels them
-- as made up.

insert into public.deals (id, business_id, title, description, status, deal_type,
                          start_date, end_date, terms)
select v.id, b.id, v.title, v.description, 'approved', v.deal_type,
       current_date - 7, current_date + 60, 'Sandbox data. This offer is not real.'
from (values
  ('d5ed0001-0000-4000-8000-000000000001'::uuid,
   'Kids eat free on Saturday',
   'One free kids meal with every adult meal, all day Saturday. Cheap way to feed the family.',
   'discount', 0),
  ('d5ed0002-0000-4000-8000-000000000002'::uuid,
   'Saturday morning haircut for kids',
   'Half price cuts for children before noon on Saturday.',
   'discount', 1),
  ('d5ed0003-0000-4000-8000-000000000003'::uuid,
   'Free coffee refill',
   'Bring your own cup and the second one costs nothing.',
   'discount', 2)
) as v(id, title, description, deal_type, pos)
join lateral (
  select id from public.businesses where status = 'approved'
   order by created_at offset v.pos limit 1
) b on true
where not exists (select 1 from public.deals d where d.id = v.id);
