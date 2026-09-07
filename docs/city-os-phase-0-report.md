# City OS Phase 0 report

Sandbox `waezoxzkvhuqjzomafee` only. Production untouched. Branch
`city-os/phase-0-foundation` off `main`. Grows one step at a time; each step
was approved before it was applied.

## Step 0: isolation check

- `origin` is `a9j/Toledo-Lokal-sandbox` for fetch and push.
- `VITE_SUPABASE_URL` points at the sandbox ref. No secret was printed.
- The app boots. `npm run dev` binds to `::`, which the build container
  rejects, so Vite was started with `--host 127.0.0.1`.
- `docs/lokal-city-os-roadmap.md` does not exist on any branch. Phase 0 is
  built from the numbered feature list in the brief.
- The sandbox database already carried the registry from PR #1. Every step
  extends it. Nothing is dropped or renamed.

## Step 1: CityGraph registry

Applied as `city_os_p0_step1a_entity_kinds` and `city_os_p0_step1b_registry`.
Files: `supabase/migrations/20260908000100_...` and `20260908000200_...`,
rollbacks beside them in `supabase/rollbacks/`.

**New enum values:** business, property, neighborhood, job, deal, project,
government_action, opportunity, content. The seven that existed stay.

**New columns on `city_entities`:** `lokal_place_id` (kinds place and
business) and `lokal_org_id` (kind organization). Both are stored generated
columns equal to `id`. `id` is the canonical ID. There is no second ID system.

**New functions:** `citygraph_kind_matches(entity_kind, text[])`,
`citygraph_sync_city()`, `citygraph_sync_business_location_entity()`,
`citygraph_sync_program()`, `citygraph_sync_deal()`.

**Changed functions:** the business, neighborhood, parcel, job, opportunity
and development syncs now write the finer kind. `citygraph_search` matches
kinds through `citygraph_kind_matches`, so the coarse names it used to take
still work.

**New triggers:** sync and delete triggers on `cities`, `business_locations`,
`programs` and `deals`.

**New edges:** `part_of` from a business location to its business, `offers`
from a business to its deal.

**Registry after apply, 309 entities:**

| Kind | Rows | From |
|---|---|---|
| property | 200 | parcels (seed) |
| opportunity | 22 | opportunities (real providers, links unverified) |
| place | 21 | 12 business locations, 8 spaces (seed), 1 city |
| project | 16 | developments (seed) |
| business | 12 | businesses |
| event | 10 | events |
| neighborhood | 9 | neighborhoods |
| job | 8 | jobs |
| organization | 6 | nonprofits |
| issue | 5 | issues (seed) |
| resource, deal | 0 | programs and deals are empty tables |

Edges: located_in 277, occupies 24, part_of 12, hosts 10, supplies 10,
employs 8.

**Verified:** a new deal registers as kind deal with an offers edge and a
located_in edge, and leaves the registry when deleted; a new business
location registers with its neighborhood matched by name, a point, and a
part_of edge; a neighborhood update succeeds and writes kind neighborhood;
search returns the same 12 businesses whether asked for "organization" or
"business"; anon can read every entity and cannot insert one; no sync
function is executable by anon. All probes ran inside a rolled back
transaction.

## Steps 2 to 10

Not started.

## Seeds

Every seed is marked in its source: `supabase/seeds/city_os_*.sql`. Parcels,
developments, spaces, issues, memories and pulse posts are invented. The 22
opportunities are real organisations whose links have not been opened.

## Real data sources still needed

Filled in as Step 3 registers connectors.
