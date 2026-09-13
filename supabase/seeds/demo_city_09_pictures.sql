-- Demo city, part 9: a picture for every entity.
--
-- SANDBOX ONLY. Do not run against production.
--
-- entity_media was added in 20260911000100 and has been empty since. This
-- fills it: one hero for every row in the registry, and a small gallery for the
-- things that get a detail page worth scrolling.
--
-- bundled_key holds the name of a drawing committed under public/art, not a
-- path and not a URL. The app resolves it, so moving the art or serving it from
-- somewhere else later does not mean rewriting these rows. Nothing here is a
-- photograph of a real place, which is why the alt text says drawing.
--
-- Idempotent: keyed on (entity_id, slot, sort_order) through a deterministic id.

-- --------------------------------------------------------------- the hero
--
-- Businesses, events, issues and nonprofits already carry an art path in their
-- own image column, so the key is taken from there and the two can never drift
-- apart. Everything else is mapped by kind.

with art_for as (
  select
    e.id as entity_id,
    e.kind::text as kind,
    e.name,
    coalesce(
      -- Strip '/art/' and '.svg' back off to recover the key.
      substring(b.cover_image_url from '/art/(.*)\.svg'),
      substring(ev.image_url from '/art/(.*)\.svg'),
      substring(i.photo_url from '/art/(.*)\.svg'),
      substring(np.cover_image_url from '/art/(.*)\.svg'),
      case e.kind::text
        when 'neighborhood' then case e.name
          when 'Downtown'     then 'out-skyline'
          when 'East Toledo'  then 'out-riverfront'
          when 'Old West End' then 'bld-victorian'
          when 'West Toledo'  then 'bld-bungalow'
          when 'South Toledo' then 'ev-block-party'
          when 'Sylvania'     then 'out-trail'
          when 'Maumee'       then 'out-marina'
          when 'Perrysburg'   then 'out-park'
          else 'out-park' end
        when 'property'   then (array['bld-bungalow','bld-victorian','bld-apartments','out-lot'])[1 + (abs(hashtext(e.id::text)) % 4)]
        when 'job'        then 'obj-job'
        when 'deal'       then 'obj-deal'
        when 'opportunity'then 'obj-notice'
        when 'project'    then 'bld-construction'
        when 'resource'   then 'bld-centre'
        when 'place'      then (array['out-skyline','bld-warehouse','out-lot','svc-venue'])[1 + (abs(hashtext(e.id::text)) % 4)]
        else 'out-skyline'
      end
    ) as key
  from public.city_entities e
  left join public.businesses  b  on e.source_table = 'businesses'  and b.id  = e.source_id
  left join public.events      ev on e.source_table = 'events'      and ev.id = e.source_id
  left join public.issues      i  on e.source_table = 'issues'      and i.id  = e.source_id
  left join public.nonprofits  np on e.source_table = 'nonprofits'  and np.id = e.source_id
)
insert into public.entity_media (id, entity_id, slot, bundled_key, alt, width, height, sort_order)
select md5('demo-media:hero:' || a.entity_id::text)::uuid,
       a.entity_id, 'hero', a.key,
       'A drawing standing in for a photograph of ' || a.name, 1200, 800, 0
from art_for a
where not exists (
  select 1 from public.entity_media m where m.entity_id = a.entity_id and m.slot = 'hero'
);

-- ---------------------------------------------------------------- the logo
--
-- Only the things that have a mark: businesses and nonprofits.

insert into public.entity_media (id, entity_id, slot, bundled_key, alt, width, height, sort_order)
select md5('demo-media:logo:' || e.id::text)::uuid,
       e.id, 'logo', substring(coalesce(b.logo_url, np.logo_url) from '/art/(.*)\.svg'),
       'The mark for ' || e.name, 512, 512, 0
from public.city_entities e
left join public.businesses b  on e.source_table = 'businesses' and b.id  = e.source_id
left join public.nonprofits np on e.source_table = 'nonprofits' and np.id = e.source_id
where coalesce(b.logo_url, np.logo_url) like '/art/%'
  and not exists (select 1 from public.entity_media m where m.entity_id = e.id and m.slot = 'logo');

-- -------------------------------------------------------------- galleries
--
-- Three more pictures on businesses, nonprofits and neighbourhoods, which are
-- the pages long enough to scroll. Which three is decided by the entity id, so
-- two shops next to each other in a list do not get the same set. The table
-- caps a gallery at six and this adds three, so a real upload still fits.

with pool as (
  select key, row_number() over (order by key) - 1 as idx
  from (values
    ('in-cafe'), ('in-shop'), ('in-salon'), ('in-office'), ('in-classroom'), ('in-gym'),
    ('out-skyline'), ('out-riverfront'), ('out-park'), ('ev-market'), ('ev-block-party'),
    ('bld-warehouse'), ('obj-glass'), ('out-bridge'), ('ev-stage'), ('out-garden')
  ) as t(key)
), targets as (
  select e.id as entity_id, e.name, e.kind::text as kind
  from public.city_entities e
  where e.kind::text in ('business', 'organization', 'neighborhood')
)
insert into public.entity_media (id, entity_id, slot, bundled_key, alt, width, height, sort_order)
select
  md5('demo-media:gallery:' || t.entity_id::text || ':' || g.n::text)::uuid,
  t.entity_id, 'gallery', p.key,
  'A drawing standing in for a photograph at ' || t.name, 1200, 800, g.n
from targets t
cross join generate_series(1, 3) as g(n)
join pool p on p.idx = (abs(hashtext(t.entity_id::text)) + g.n * 5) % 16
where not exists (
  select 1 from public.entity_media m
  where m.id = md5('demo-media:gallery:' || t.entity_id::text || ':' || g.n::text)::uuid
);
