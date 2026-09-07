-- City OS Phase 0, Step 2 fix: resolve_address answered street and zip
-- queries with somebody's street address.
--
-- Found by testing the function against the sandbox right after applying it.
--
-- The parcel branch matched on ILIKE anywhere in the address, so:
--
--   resolve_address('Jefferson Ave') -> "100 Jefferson Ave, Toledo, OH 43604"
--                                       match parcel_fuzzy, confidence 0.41
--   resolve_address('43605')         -> "100 Front St, Toledo, OH 43605"
--                                       match parcel_fuzzy, confidence 0.21
--
-- Both are wrong in a way that matters. Someone who types their zip is told
-- their address is 100 Front St. The low confidence does not undo that: the
-- caller still gets a parcel_id and a specific address it will happily save
-- as a home. It also made the street and zip branches dead code, because the
-- parcel branch always answered first.
--
-- The parcel branch now needs the query to look like a street address: an
-- exact match, a prefix of one, a house number followed by a word, or a real
-- trigram similarity. A bare street name or a bare zip falls through to the
-- branches written for them, which return a neighborhood and no address.
--
-- Confidence is also graded now. An exact match is 0.95, a prefix ("100
-- Jefferson") is 0.85, and a fuzzy match carries its own similarity score
-- instead of a number that looks like a guess.

create or replace function public.resolve_address(p_query text)
returns table (
  parcel_id         uuid,
  address           text,
  neighborhood_id   uuid,
  neighborhood_name text,
  latitude          double precision,
  longitude         double precision,
  match             text,
  confidence        numeric
)
language plpgsql stable security invoker set search_path = public, extensions as $$
declare
  v_q       text := btrim(coalesce(p_query, ''));
  v_esc     text;
  v_lat     double precision;
  v_lng     double precision;
  v_point   extensions.geography(point, 4326);
  v_street  text;
  v_zip     text;
  v_hood    uuid;
  v_numbered boolean;
begin
  if length(v_q) < 2 then return; end if;

  -- "41.65, -83.54"
  if v_q ~ '^-?\d{1,2}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?$' then
    v_lat := split_part(v_q, ',', 1)::double precision;
    v_lng := split_part(v_q, ',', 2)::double precision;
    v_point := extensions.st_setsrid(extensions.st_makepoint(v_lng, v_lat), 4326)::extensions.geography;

    -- a parcel within 50 m is that parcel
    return query
      select p.id, p.address, p.neighborhood_id, n.name,
             extensions.st_y(p.location::extensions.geometry),
             extensions.st_x(p.location::extensions.geometry),
             'parcel', 0.90::numeric
        from public.parcels p
        left join public.neighborhoods n on n.id = p.neighborhood_id
       where p.location is not null
         and extensions.st_dwithin(p.location, v_point, 50)
       order by extensions.st_distance(p.location, v_point)
       limit 1;
    if found then return; end if;

    v_hood := public.neighborhood_for_point(v_point);
    if v_hood is not null then
      return query
        select null::uuid, null::text, n.id, n.name, v_lat, v_lng,
               case when n.geometry is not null
                     and extensions.st_contains(n.geometry, v_point::extensions.geometry)
                    then 'polygon' else 'nearest' end,
               case when n.geometry is not null
                     and extensions.st_contains(n.geometry, v_point::extensions.geometry)
                    then 0.60 else 0.40 end::numeric
          from public.neighborhoods n where n.id = v_hood;
    end if;
    return;
  end if;

  -- A house number and then a word. "100 Jefferson" yes, "Jefferson Ave" no,
  -- "43605" no, because a bare zip has no word after it.
  v_numbered := v_q ~ '^\s*\d+[A-Za-z]?\s+\S';
  v_esc := replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_');

  return query
    select p.id, p.address, p.neighborhood_id, n.name,
           extensions.st_y(p.location::extensions.geometry),
           extensions.st_x(p.location::extensions.geometry),
           case when lower(p.address) = lower(v_q)
                  or p.address ilike v_esc || ',%' then 'parcel'
                when p.address ilike v_esc || '%' escape '\' then 'parcel'
                else 'parcel_fuzzy' end,
           case when lower(p.address) = lower(v_q)
                  or p.address ilike v_esc || ',%' then 0.95
                when p.address ilike v_esc || '%' escape '\' then 0.85
                else round(least(extensions.similarity(p.address, v_q), 0.80)::numeric, 2)
           end
      from public.parcels p
      left join public.neighborhoods n on n.id = p.neighborhood_id
     where (v_numbered and p.address ilike '%' || v_esc || '%' escape '\')
        or extensions.similarity(p.address, v_q) >= 0.45
     order by (lower(p.address) = lower(v_q)) desc,
              (p.address ilike v_esc || '%' escape '\') desc,
              extensions.similarity(p.address, v_q) desc
     limit 1;
  if found then return; end if;

  -- A bare zip, before the street branch, so five digits are read as a zip
  -- rather than as a street called 43605.
  if v_q ~ '^\d{5}(-\d{4})?$' then
    return query
      select null::uuid, null::text, s.neighborhood_id, n.name,
             null::double precision, null::double precision, 'zip', 0.30::numeric
        from (select p.neighborhood_id, count(*) as c
                from public.parcels p
               where p.neighborhood_id is not null and p.zip = left(v_q, 5)
               group by p.neighborhood_id
               order by c desc limit 1) s
        join public.neighborhoods n on n.id = s.neighborhood_id;
    return;
  end if;

  -- The street, with the house number stripped. Needs a letter in it, so a
  -- number can never reach here.
  v_street := btrim(regexp_replace(split_part(v_q, ',', 1), '^\s*\d+[A-Za-z]?\s+', ''));
  if length(v_street) >= 3 and v_street ~ '[A-Za-z]' then
    return query
      select null::uuid, null::text, s.neighborhood_id, n.name,
             null::double precision, null::double precision, 'street', 0.50::numeric
        from (select p.neighborhood_id, count(*) as c
                from public.parcels p
               where p.neighborhood_id is not null
                 and p.address ilike '%' || replace(replace(replace(v_street, '\', '\\'), '%', '\%'), '_', '\_') || '%' escape '\'
               group by p.neighborhood_id
               order by c desc limit 1) s
        join public.neighborhoods n on n.id = s.neighborhood_id;
    if found then return; end if;
  end if;

  -- A zip on the end of a longer string that matched nothing else.
  v_zip := substring(v_q from '(\d{5})(?:-\d{4})?\s*$');
  if v_zip is not null then
    return query
      select null::uuid, null::text, s.neighborhood_id, n.name,
             null::double precision, null::double precision, 'zip', 0.30::numeric
        from (select p.neighborhood_id, count(*) as c
                from public.parcels p
               where p.neighborhood_id is not null and p.zip = v_zip
               group by p.neighborhood_id
               order by c desc limit 1) s
        join public.neighborhoods n on n.id = s.neighborhood_id;
  end if;
  return;
end $$;

grant execute on function public.resolve_address(text) to anon, authenticated;
