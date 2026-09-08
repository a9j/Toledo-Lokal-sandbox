-- Phase 2 parcel seed. SANDBOX ONLY. Do not run against production.
--
-- 200 invented parcels, 25 in each of the 8 real neighborhoods (Virtual is
-- skipped: nobody lives there). Street names are real Toledo streets so the
-- address picker feels right to type against, but the house numbers,
-- coordinates, council districts, precincts, school districts, refuse days,
-- recycling weeks, snow routes and dollar figures are ALL FABRICATED.
--
-- Nothing here is a real property record. None of it may be shown to a resident
-- as their actual trash day, polling place, school district or tax bill.
--
-- Every row carries raw = {"source":"seed"} so the UI can label it as
-- placeholder and a later import from the City of Toledo open data portal,
-- Lucas County AREIS and the Board of Elections can replace exactly these rows:
--   delete from public.parcels where raw ->> 'source' = 'seed';
--
-- The Phase 2 trigger registers each parcel as a 'place' entity as a side
-- effect, so the CityGraph picks them up with no extra step.

with hood(name, lat, lon, zip, district, school, streets) as (values
  ('Downtown',     41.6528, -83.5379, '43604', '1', 'Toledo City',
     array['Jefferson Ave','Madison Ave','Adams St','Huron St','Superior St']),
  ('Old West End', 41.6690, -83.5560, '43620', '4', 'Toledo City',
     array['Collingwood Blvd','Parkwood Ave','Robinwood Ave','Virginia St','Winthrop St']),
  ('East Toledo',  41.6480, -83.5150, '43605', '3', 'Toledo City',
     array['Main St','Front St','Starr Ave','Navarre Ave','Consaul St']),
  ('West Toledo',  41.6900, -83.6100, '43613', '5', 'Washington Local',
     array['W Sylvania Ave','Douglas Rd','Jackman Rd','Laskey Rd','Talmadge Rd']),
  ('South Toledo', 41.6120, -83.5700, '43609', '2', 'Toledo City',
     array['Broadway St','Glendale Ave','Byrne Rd','Airport Hwy','South Ave']),
  ('Sylvania',     41.7190, -83.7130, '43560', '6', 'Sylvania',
     array['Monroe St','Main St','Erie St','Convent Blvd','Whiteford Rd']),
  ('Maumee',       41.5620, -83.6540, '43537', '6', 'Maumee City',
     array['Conant St','Anthony Wayne Trail','Detroit Ave','Illinois Ave','Key St']),
  ('Perrysburg',   41.5570, -83.6270, '43551', '6', 'Perrysburg Exempted Village',
     array['Louisiana Ave','Front St','Indiana Ave','Third St','Fort Meigs Rd'])
),
seeded as (
  select h.*, i,
         -- Deterministic pseudo scatter, so re-running produces the same rows.
         ((i * 7919) % 4801) + 100                    as house_no,
         h.streets[(i % 5) + 1]                       as street,
         (array['Monday','Tuesday','Wednesday','Thursday','Friday'])[(i % 5) + 1] as refuse_day,
         case when ((i / 5) % 2) = 0 then 'A' else 'B' end                        as recycling_week,
         (array['Primary','Secondary','Residential'])[(i % 3) + 1]                as snow_route,
         45000 + ((i * 7919) % 165000)                as assessed
  from hood h, generate_series(0, 24) as i
)
insert into public.parcels
  (parcel_number, address, location, neighborhood_id,
   council_district, precinct, school_district, refuse_day, recycling_week,
   snow_route, assessed_value, tax_year_amount, raw)
select
  s.district || '0-' || lpad((row_number() over (order by s.name, s.i) + 10000)::text, 5, '0'),
  s.house_no || ' ' || s.street || ', '
    || case when s.name in ('Sylvania','Maumee','Perrysburg') then s.name else 'Toledo' end
    || ', OH ' || s.zip,
  extensions.st_setsrid(extensions.st_makepoint(
      s.lon + (((s.i * 37) % 100) - 50) * 0.00026,
      s.lat + (((s.i * 53) % 100) - 50) * 0.00020), 4326)::extensions.geography,
  (select id from public.neighborhoods n where n.name = s.name),
  s.district,
  s.district || '-' || chr(65 + (s.i % 8)),
  s.school,
  s.refuse_day,
  s.recycling_week,
  s.snow_route,
  s.assessed,
  -- Rough Lucas County shape: ~35 percent assessed ratio, ~62 mills effective.
  round(s.assessed * 0.35 * 0.062, 2),
  '{"source":"seed"}'::jsonb
from seeded s
on conflict (parcel_number) do nothing;
