-- Undo the Phase 1 demo seed. SANDBOX ONLY.
--
-- Removes exactly the rows the two seed files create, matched by their fixed
-- ids, and nothing else. city_entities rows cascade from nothing, so they are
-- deleted explicitly by source id; inbox_items and city_edges cascade from
-- city_events_log and city_entities.

delete from public.city_events_log where id::text like '0c105001-c001-%';

delete from public.city_entities
 where (source_table = 'businesses' and source_id::text like '0c105001-b001-%')
    or (source_table = 'nonprofits' and source_id::text like '0c105001-a001-%')
    or (source_table = 'events'     and source_id::text like '0c105001-e001-%')
    or (source_table = 'jobs'       and source_id::text like '0c105001-f001-%');

delete from public.jobs               where id::text like '0c105001-f001-%';
delete from public.events             where id::text like '0c105001-e001-%';
delete from public.nonprofits         where id::text like '0c105001-a001-%';
delete from public.business_locations where id::text like '0c105001-1001-%';
delete from public.businesses         where id::text like '0c105001-b001-%';
