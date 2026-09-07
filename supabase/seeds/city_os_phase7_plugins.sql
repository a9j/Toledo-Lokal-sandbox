-- Phase 7 demo seed: the two plugins the plan names.
--
-- The TARTA link is a real public URL and the Fix Toledo route is a real app
-- route, so unlike the other Phase 5 and 6 seeds these two are not invented.
-- Neither has been fetched from here, for the same reason the Phase 4
-- opportunity URLs have not: this environment blocks outbound requests.
--
-- Both manifests go through plugins_validate_manifest, which refuses a
-- javascript: or data: deep link, a protocol relative route, an unknown action
-- kind, and an action missing a key or a title.

insert into public.plugins (slug, name, summary, status, manifest)
values
 ('tarta-ride', 'TARTA: plan a ride',
  'Opens the transit planner with your destination filled in.',
  'published',
  jsonb_build_object(
    'screens', jsonb_build_array(
      jsonb_build_object('key','plan','title','Plan a ride','route','/plugins/tarta-ride')),
    'actions', jsonb_build_array(
      jsonb_build_object('key','plan_ride','title','Plan a ride there',
        'kind','deep_link','target','https://www.tarta.com/trip-planner',
        'params', jsonb_build_array('destination_address'),
        'description','Opens the TARTA trip planner in a new tab.')))),
 ('city-report', 'City: report a problem',
  'Files a pothole, a streetlight or dumping through Fix Toledo.',
  'published',
  jsonb_build_object(
    'screens', jsonb_build_array(
      jsonb_build_object('key','report','title','Report a problem','route','/fix')),
    'actions', jsonb_build_array(
      jsonb_build_object('key','report_pothole','title','Report a pothole',
        'kind','internal_route','target','/fix',
        'params', jsonb_build_array('kind','location'),
        'description','Opens Fix Toledo with the pothole kind chosen.'))))
on conflict (slug) do update set
  name = excluded.name, summary = excluded.summary,
  manifest = excluded.manifest, status = excluded.status;
