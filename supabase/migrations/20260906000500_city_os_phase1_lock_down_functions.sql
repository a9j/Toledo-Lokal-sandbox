-- Phase 1 security fix: stop the internals being callable over the REST API.
--
-- Postgres grants EXECUTE on a new function to PUBLIC by default. Every Phase 1
-- helper is SECURITY DEFINER, so PostgREST was exposing all of them at
-- /rest/v1/rpc/ to both anon and authenticated. citygraph_upsert_entity is the
-- serious one: anyone could call it and write rows into city_entities and
-- city_edges, which the RLS write policy restricts to platform admins. The
-- trigger functions were exposed too and had no business being reachable.
--
-- Triggers execute their function regardless of EXECUTE grants, so revoking
-- costs the sync and fan out nothing.
--
-- Exactly three functions are meant to be called from the client:
--   citygraph_entity_id     resolve a source row to its entity id
--   entity_follower_count   public follower count
--   inbox_unread_count      the caller's own unread badge

revoke execute on function public.citygraph_upsert_entity(
  public.entity_kind, text, uuid, text, uuid, extensions.geography) from public, anon, authenticated;
revoke execute on function public.citygraph_business_point(uuid)        from public, anon, authenticated;
revoke execute on function public.citygraph_sync_business()             from public, anon, authenticated;
revoke execute on function public.citygraph_sync_neighborhood()         from public, anon, authenticated;
revoke execute on function public.citygraph_sync_nonprofit()            from public, anon, authenticated;
revoke execute on function public.citygraph_sync_event()                from public, anon, authenticated;
revoke execute on function public.citygraph_sync_job()                  from public, anon, authenticated;
revoke execute on function public.citygraph_sync_business_location()    from public, anon, authenticated;
revoke execute on function public.citygraph_fanout_to_inbox()           from public, anon, authenticated;
revoke execute on function public.citygraph_bridge_business_follow()    from public, anon, authenticated;
revoke execute on function public.citygraph_bridge_entity_follow()      from public, anon, authenticated;
revoke execute on function public.citygraph_backfill_follow_inbox()     from public, anon, authenticated;

-- The three intended entry points: revoke the blanket PUBLIC grant, then grant
-- back deliberately.
revoke execute on function public.citygraph_entity_id(text, uuid)   from public;
revoke execute on function public.entity_follower_count(uuid)       from public;
revoke execute on function public.inbox_unread_count()              from public, anon;

grant execute on function public.citygraph_entity_id(text, uuid) to anon, authenticated;
grant execute on function public.entity_follower_count(uuid)     to anon, authenticated;
grant execute on function public.inbox_unread_count()            to authenticated;
