# Phase 1 status: CityGraph foundation

Everything is written and builds. **The database side is not applied**, because the
migration call was refused by the permission classifier in this session. One command
finishes it; see below.

## What is done

| Piece | State |
|---|---|
| Schema migration (5 tables, enum, RLS) | written, `supabase/migrations/20260906000100_*` |
| Sync triggers, fan out, follow bridges, helper functions | written, `supabase/migrations/20260906000200_*` |
| Backfill | written, `supabase/migrations/20260906000300_*` |
| Demo seed + change log seed + undo | written, `supabase/seeds/` |
| `<FollowButton />` over `entity_follows` | built |
| `/inbox` grouped by day, unread badge in the tab bar | built |
| "Recent changes" on business, event, nonprofit, neighborhood pages | built |
| Typecheck, lint, production build | clean for every file this phase touched |
| Applied to `waezoxzkvhuqjzomafee` | **no** |
| Screenshots with real data | **no**, see Blockers |

## Blockers

**1. The migration was refused.** `apply_migration` against the sandbox came back
"Blocked by classifier". Read only queries went through, so the sandbox itself is
reachable; it is the write path that is gated. Nothing was routed around it.

To finish, run in order against `waezoxzkvhuqjzomafee` and nothing else:

```
supabase/migrations/20260906000100_city_os_phase1_citygraph.sql
supabase/migrations/20260906000200_city_os_phase1_sync_and_fanout.sql
supabase/migrations/20260906000300_city_os_phase1_backfill.sql
supabase/seeds/city_os_phase1_demo.sql
supabase/seeds/city_os_phase1_change_log.sql
```

Then regenerate types (`supabase gen types typescript`) and delete the
`cityOs` escape hatch described below.

Expected after the backfill, before the seed: **9 `place`, 0 everything else.**
After the seed: 9 `place`, 18 `organization` (12 businesses + 6 nonprofits),
10 `event`, 8 `resource`, and 20 change log rows.

**2. Browser access to the sandbox Supabase host is now denied** by the environment's
network policy (`403 to CONNECT` for `waezoxzkvhuqjzomafee.supabase.co`). It worked
during Phase 0 and does not now. So the screenshots below are of empty and error
states only. The data-backed screenshots the plan asks for have to come from a
session that can reach the host, or from the Vercel preview.

## Decisions worth reviewing

**Businesses and nonprofits are `organization`, not `place`.** A business is an
organization that *has* a location. The coordinate rides on the entity row and the
`located_in` edge still points at the neighborhood, so map and near-me queries work
either way. Change it now if you disagree; changing it after Phase 5 means a data
migration.

**A neighborhood detail page had to be created.** There was none. `/neighborhood/:id`
is deliberately thin: name, follow, recent changes, businesses here. Phase 2 turns it
into My Neighborhood and Phase 3 hangs "Ask [Neighborhood]" off it.

**Follows are bridged both ways.** The plan only asked to map `business_follows` into
`entity_follows`. But the admin followers panel and the business dashboard still count
`business_follows`, so a one way bridge would have frozen those numbers the day the
new button shipped. There are two triggers, and they do not loop: each writes with
`on conflict do nothing` or deletes rows that are already gone, and a statement that
changes no row fires no row level trigger.

**`FollowTruckButton` is now a deprecated wrapper** around `FollowButton` rather than
a second follow system.

**`src/integrations/supabase/city-os.ts` is a temporary escape hatch.** `types.ts` is
generated and does not know the Phase 1 tables. Rather than hand edit a generated
file, the Phase 1 shapes are declared there and every query goes through one loosened
client. Delete it once types are regenerated.

**The inbox marks itself read on open.** Simplest thing that matches how people expect
an inbox to behave. If you want per item read state instead, say so before Phase 7
Autopilot starts scoring on `read_at`.

## Seed data is fictional

Every business, nonprofit, job and change notice in `supabase/seeds/` is invented.
None of it describes a real Toledo business, road closure, permit or meeting. It is
labelled that way in the files. It must not reach a build residents can see.
