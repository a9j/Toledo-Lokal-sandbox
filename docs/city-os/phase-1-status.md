# Phase 1 status: CityGraph foundation

**Applied to the sandbox and verified.** One thing is still outstanding, and it is
environmental: see Screenshots.

Target: Supabase branch `sandbox`, ref `waezoxzkvhuqjzomafee`. Production
(`nnepslwwqjxfhlurwoyw`) was never touched.

## Applied

| Migration | What |
|---|---|
| `20260906000100_city_os_phase1_citygraph` | PostGIS, `entity_kind`, the 5 tables, RLS |
| `20260906000200_city_os_phase1_sync_and_fanout` | sync triggers, fan out, follow bridges, helper functions |
| `20260906000300_city_os_phase1_backfill` | register existing rows |
| `20260906000400_city_os_phase1_follow_backfill` | a new follow arrives with its recent history |
| `20260906000500_city_os_phase1_lock_down_functions` | revoke the REST-exposed internals |

Seeds run: `city_os_phase1_demo.sql`, `city_os_phase1_change_log.sql`.
Undo: `city_os_phase1_demo_undo.sql`.

## Counts, measured

Backfill alone, before the seed, was **9 `place` and nothing else**, exactly as
predicted: the sandbox had no businesses, events, nonprofits or jobs.

After the seed:

| kind | rows |
|---|---|
| place | 9 |
| organization | 18 |
| event | 10 |
| resource | 8 |
| **total** | **45** |

| relation | rows |
|---|---|
| located_in | 36 |
| hosts | 10 |
| employs | 8 |

`city_events_log`: 20 rows.

Geometry, which only `business_locations` can supply: 12/12 businesses, 10/10
events, 8/8 jobs. Neighborhoods and nonprofits have none, as expected until the
Phase 2 parcels land.

## Verified end to end

Each of these was run against the sandbox and cleaned up afterwards. The database
is back to 0 users, 0 follows, 0 inbox rows.

- **Fan out.** A temporary user followed a business and a neighborhood, then a new
  change was logged against the business: exactly 1 inbox row appeared.
- **Follow bridge, both directions.** Following via `entity_follows` produced the
  matching `business_follows` row, and did not loop.
- **Backfill on follow.** A fresh follow of two entities produced 2 unread inbox
  rows from the existing log, with no new change logged.
- **Triggers survive the revokes.** Inserting a business still created its entity
  and its `located_in` edge after EXECUTE was revoked.
- **RLS.** As `anon`: 45 entities, 20 changes and 54 edges readable; 0 follows and
  0 inbox rows visible; insert into `city_entities` refused.
- **RPC surface.** As `anon`: `citygraph_entity_id` and `entity_follower_count`
  work, `citygraph_upsert_entity` is refused.

## Two things found and fixed during the apply

**1. A security hole I introduced.** Postgres grants EXECUTE on a new function to
PUBLIC, so all 15 Phase 1 SECURITY DEFINER functions were exposed at
`/rest/v1/rpc/` to anon and authenticated. `citygraph_upsert_entity` was the
serious one: anyone could have called it to write `city_entities` and `city_edges`
rows, bypassing the admin-only RLS write policy. Migration `...000500` revokes all
twelve internals and grants back only the three intended entry points. Caught by
`get_advisors`, which is worth running after every phase.

**2. The seeded change log would never have reached anyone.** Fan out fires on
insert into `city_events_log`, so it only reaches people who already follow. That
meant the 20 seeded rows, which predate every follow, could never appear in any
inbox, and anyone following something new would stare at an empty inbox until that
thing next changed. Migration `...000400` gives a new follow its recent history:
up to 10 items from the last 30 days, left unread.

Also fixed: `jobs.job_type` is constrained to hyphenated values
(`full-time`, `part-time`, `seasonal`, `entry-level`, `skilled-trades`,
`internship`, `gig`) with no `contract`. The seed used underscores and was
rejected; it now matches the constraint.

## Screenshots: still blocked

The environment's network policy denies the browser access to
`waezoxzkvhuqjzomafee.supabase.co` (`ERR_TUNNEL_CONNECTION_FAILED`, gateway 403 to
CONNECT). Server side access through the Supabase API works fine, which is how
everything above was verified, but a browser in this session cannot load app data.
So there are no screenshots of the inbox with rows in it. They need a session that
can reach the host, or the Vercel preview.

The empty and error states were captured and are correct.

## Types

`src/integrations/supabase/types.ts` has been regenerated against the migrated
database and carries all five tables, the `entity_kind` enum and the three RPCs.
The temporary escape hatch in `src/integrations/supabase/city-os.ts` is gone;
`cityOs` is now the ordinary typed client and the row types are aliases off the
generated `Database`. Dropping the hatch immediately surfaced a real type error in
`useEntityFollow`, which is fixed.

Typecheck, lint and production build are clean for every file this phase touches.
The repo has pre-existing type and lint errors elsewhere (`AdminBusinessStaffDialog`,
`ImageCropUpload`, `useCommunitySponsors`, `useMenuItems`, `LoopContext`, `Today`,
`Dashboard`); none are touched here and none block the build.

## Decisions worth reviewing

**Businesses and nonprofits are `organization`, not `place`.** A business is an
organization that *has* a location: the coordinate rides on the entity row and the
`located_in` edge still points at the neighborhood, so map and near-me queries work
either way. Changing this after Phase 5 means a data migration.

**A neighborhood detail page had to be created.** There was none. `/neighborhood/:id`
is deliberately thin. Phase 2 turns it into My Neighborhood, Phase 3 hangs
"Ask [Neighborhood]" off it.

**Follows bridge both ways.** The plan asked only for `business_follows` into
`entity_follows`, but the admin followers panel and the business dashboard still
count `business_follows`, so a one way bridge would have frozen those numbers.

**The inbox marks itself read on open**, not per item. Say so before Phase 7
Autopilot starts scoring on `read_at` if you want it finer grained.

## Seed data is fictional

Every business, nonprofit, job and change notice in `supabase/seeds/` is invented.
None of it describes a real Toledo business, road closure, permit or meeting. It is
labelled that way in the files, and it must not reach a build residents can see.
Remove it with `city_os_phase1_demo_undo.sql`.

## Pre-existing advisor findings

`get_advisors` reports 168 security lints on the sandbox. 30 were Phase 1's and are
now fixed. The remaining 138 predate this work (SECURITY DEFINER views, other
functions exposed the same way). Worth a pass of its own before production.
