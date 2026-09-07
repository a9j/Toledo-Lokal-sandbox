-- City OS Phase 0, Step 1a: the full entity_kind list.
--
-- The sandbox already has entity_kind with seven values (person, place,
-- organization, event, resource, transaction, issue). This adds the nine the
-- roadmap names and nothing else. Postgres cannot use a new enum value in the
-- same transaction that adds it, so the remap of existing rows is Step 1b.
--
-- Additive only. No table is dropped or renamed.

alter type public.entity_kind add value if not exists 'business';
alter type public.entity_kind add value if not exists 'property';
alter type public.entity_kind add value if not exists 'neighborhood';
alter type public.entity_kind add value if not exists 'job';
alter type public.entity_kind add value if not exists 'deal';
alter type public.entity_kind add value if not exists 'project';
alter type public.entity_kind add value if not exists 'government_action';
alter type public.entity_kind add value if not exists 'opportunity';
alter type public.entity_kind add value if not exists 'content';
