-- Phase 1 backfill: register every existing row in the CityGraph.
-- Order matters. Neighborhoods first, because they are the target of every
-- located_in edge the other backfills create.
--
-- Idempotent: citygraph_upsert_entity upserts on (source_table, source_id) and
-- every edge insert is on conflict do nothing, so re-running is a no op.

insert into public.city_entities (kind, source_table, source_id, city_id, neighborhood_id, name)
select 'place', 'neighborhoods', n.id,
       (select id from public.cities where is_active order by created_at limit 1),
       n.id, n.name
from public.neighborhoods n
on conflict (source_table, source_id) do nothing;

select public.citygraph_upsert_entity(
         'organization', 'businesses', b.id, b.name, b.neighborhood_id,
         public.citygraph_business_point(b.id))
from public.businesses b;

select public.citygraph_upsert_entity(
         'organization', 'nonprofits', p.id, p.name, p.neighborhood_id, null)
from public.nonprofits p;

select public.citygraph_upsert_entity(
         'event', 'events', e.id, e.title, b.neighborhood_id,
         public.citygraph_business_point(e.business_id))
from public.events e
left join public.businesses b on b.id = e.business_id;

select public.citygraph_upsert_entity(
         'resource', 'jobs', j.id, j.title, b.neighborhood_id,
         public.citygraph_business_point(j.business_id))
from public.jobs j
left join public.businesses b on b.id = j.business_id;

-- Hosts and employs edges for rows that predate the triggers.
insert into public.city_edges (from_entity, to_entity, relation)
select be.id, ee.id, 'hosts'
from public.events e
join public.city_entities be on be.source_table = 'businesses' and be.source_id = e.business_id
join public.city_entities ee on ee.source_table = 'events'     and ee.source_id = e.id
where be.id <> ee.id
on conflict (from_entity, to_entity, relation) do nothing;

insert into public.city_edges (from_entity, to_entity, relation)
select be.id, je.id, 'employs'
from public.jobs j
join public.city_entities be on be.source_table = 'businesses' and be.source_id = j.business_id
join public.city_entities je on je.source_table = 'jobs'       and je.source_id = j.id
where be.id <> je.id
on conflict (from_entity, to_entity, relation) do nothing;

-- Existing business follows carried over so nothing breaks for people who
-- already follow a business.
insert into public.entity_follows (user_id, entity_id)
select bf.user_id, e.id
from public.business_follows bf
join public.city_entities e on e.source_table = 'businesses' and e.source_id = bf.business_id
on conflict do nothing;
