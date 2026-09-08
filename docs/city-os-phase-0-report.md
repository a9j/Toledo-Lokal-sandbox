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

## Step 2: address intelligence and the neighborhood engine

Applied as `city_os_p0_step2_addresses`, then three corrective migrations to
`resolve_address` described below. Files `20260908000300` through
`20260908000600`, rollbacks beside them.

**New column on `parcels`:** `zip`, filled from the address for all 200 rows.
Eight zips across the nine neighborhoods.

**New columns on `neighborhoods`:** `geometry` (MultiPolygon, 4326) and
`boundary_source`. Eight polygons, each the bounding box of that
neighborhood's seeded parcels padded by about 500 m, all flagged `seed`.
Virtual has none. Every one of the 200 parcels falls inside its own
neighborhood's polygon. Three pairs overlap (Maumee with Perrysburg, Downtown
with Old West End, Downtown with East Toledo); a point in an overlap goes to
the nearer centroid.

**These polygons are not real boundaries.** They are boxes drawn around
invented parcels. They must be replaced with a real GIS source before anyone
is told which district they live in.

**New functions:** `neighborhood_for_point(geography)`, `resolve_address(text)`,
`nearby(entity_id, radius_miles, kinds[], limit)`.

**New triggers on `city_entities`:** one fills a missing `neighborhood_id`
from the polygons before insert or update, the other adds the `located_in`
edge after. Zero entities were left with a location and no neighborhood.

**The home address stays in `resident_homes`.** The roadmap asks for
`home_parcel_id` and `home_verified_at` on `profiles`. `profiles` carries a
policy that lets any signed in user read every row, so a home parcel there is
joinable to public `parcels` and leaks every user's address. `resident_homes`
is keyed to `auth.uid()`, readable only by its owner, and already has
`verified_at`. Moving the home onto `profiles` would reintroduce a leak that
was found and fixed once already. Flagged for a ruling rather than done
quietly.

### resolve_address took three passes, and all three were the same mistake

Each was found by testing the function against the sandbox, not by reading it.

1. **A street or a zip was answered with somebody's house.**
   `resolve_address('43605')` returned "100 Front St, Toledo, OH 43605". The
   parcel branch matched on a substring anywhere in the address, so it always
   answered first and the street and zip branches were dead code. A caller
   saving the result as a home address would have saved a house nobody named.
2. **A street with a city on it still did.** `'Broadway St, Toledo'` returned
   "100 Broadway St" at confidence 0.59, through the trigram arm the first fix
   left open. Similarity between a street and a full address on that street is
   high, so a threshold was never the right control.
3. **A house number not on file was answered with a different house.**
   `'742 Broadway St'` returned "100 Broadway St" at 0.78. A misspelt street is
   a typo worth forgiving. A different number is a different building.

The rule now: a query naming a house number matches loosely on the street but
must match the number exactly; a query naming no house number matches only an
exact address or a prefix of one, and otherwise gets a neighborhood with no
address. Confidence is graded 0.95 exact, 0.85 prefix, 0.90 a point on a
parcel, 0.60 inside a polygon, 0.50 a street, 0.40 nearest centroid, 0.30 a
zip.

**Verified, 21 cases:** exact, lowercase and padded exact all 0.95; prefix
0.85; a typo in the street still finds the right house; a wrong house number,
a bare street, a street with a city, a bare zip and a zip plus four all return
a neighborhood and no address; an unknown street in a known zip returns that
zip's neighborhood; a point on a parcel returns the parcel, a point 195 m away
returns the polygon, a point 100 miles away returns nothing; garbage, `%%`,
`__`, a lone backslash, one character, an empty string and a SQL injection
attempt all return nothing.

## Step 3: connectors and source confidence

Applied as `city_os_p0_step3_connectors`, then one corrective migration
described below. Files `20260908000700` and `20260908000800`, rollbacks beside
them. Edge function `connectors-run` deployed at v2.

**New tables:** `data_sources` (six kinds, schedule, last run, last status,
last error, record count), `data_source_config` (urls and anything secret,
admin and service role only), `source_records` (`unique(source_id,
external_id)`, a 0 to 1 confidence with a range check, `fetched_at`,
`verified_at`, `verified_by`).

**New columns:** `data_source_id` and `confidence` on both `city_entities` and
`parcels`.

**New functions:** `entity_provenance(entity_id)` for the badge, and
`record_source_run(...)` for the edge function, revoked from everyone so only
the service role reaches it.

**A "Sandbox seed" source** now owns all 309 entities and all 200 parcels at
confidence 0.20. That is the point of the step. A blank space reads as fact, so
every invented row now says on screen that it was made up for testing.

**New UI:** `/admin/sources` lists every source with its kind, last run,
status in plain words, records held and a Run Now button on the two kinds that
have handlers. `ConfidenceBadge` renders provenance under any entity.

### The bug: source_id already meant something else

`city_entities.source_id` has held the primary key of the row in
`source_table` since PR #1. An entity for a business carries that business's
id. Step 3 added a `source_id` meaning "which data source", which is a
different thing under the same name.

`add column if not exists` found the column already there and skipped the
whole clause, foreign key included, so the registry was never corrupted. Then
the backfill, `... where source_id is null`, matched zero rows, because every
entity already has one. Confidence stayed null on all 309 entities and
`entity_provenance` returned nulls, which is how this was found.

Had that column not already existed under that name, the backfill would have
overwritten every entity's link to its source row with one `data_sources` id,
and the CityGraph would have lost the pointer that makes it a registry. It
survived on a technicality, not on design. The provenance column is
`data_source_id` on both tables now, and `parcels.source_id`, added by Step 3
an hour earlier and read by nothing, was dropped rather than left as a second
trap.

### Two deviations from the roadmap

**Config is its own table.** The roadmap puts `config jsonb` on
`data_sources`. A connector config is where an API key ends up, and `revoke
select (config)` does nothing against a table wide grant. That exact mistake
was found in the supplier spend column in PR #1.

**Neither handler has a URL.** The roadmap says to register both with a sample
public Toledo URL and run them once. This environment has no outbound network,
so no URL could be checked here, and one that looks official but was never
fetched is worse than none. Both are registered with status `needs url`.

### Verified

Registry intact: 12 businesses still join to their entities, 309 entities and
341 edges unchanged, search and `resolve_address` unaffected.

Provenance: all 309 entities and 200 parcels attributed at 0.20;
`entity_provenance` returns "Sandbox seed, manual, 0.20, seed=true" for both a
business entity and a parcel entity.

Permissions: anon reads sources and records, sees **zero** rows of
`data_source_config`, and is refused 42501 on inserting a source or calling
`record_source_run`. A confidence above 1 is refused by the check constraint.
`record_source_run` on an unknown id is refused.

Parsers, tested on sample feeds with no network: ical unfolds continuation
lines, unescapes `\,` `\n` and `\;`, skips a VEVENT with no UID, and reads
both a timestamp and a date only DTSTART; rss strips CDATA and HTML, decodes
entities, reads Atom entries through `<id>` and `href`, and **drops a
`javascript:` link** while keeping the item. The feed URL guard blocks
`javascript:`, `file:`, localhost, `127.*`, `10.*`, `192.168.*`, `172.16-31.*`,
`169.254.169.254` and `metadata.google.internal`, which is the shape of an
SSRF against a function holding the service role.

**Not verified: the function has never been invoked.** The proxy here refuses
the Supabase host, so Run Now has not been pressed against a live feed. The
parsers are proven; the round trip is not.

## Steps 4 to 10

Not started.

## Seeds

Every seed is marked in its source: `supabase/seeds/city_os_*.sql`. Parcels,
developments, spaces, issues, memories and pulse posts are invented. The 22
opportunities are real organisations whose links have not been opened.

## Real data sources still needed

Filled in as Step 3 registers connectors. Already known:

| What | Why it is needed | Where to look |
|---|---|---|
| Neighborhood boundaries (GIS) | Step 2 drew boxes around invented parcels and flagged them `seed`. Nobody should be told their council district from these. | Toledo and Lucas County open GIS portals |
| Parcels, owners, assessed values | All 200 parcels are invented. | Lucas County Auditor |
| Refuse, recycling and snow routes | Invented per parcel. | City of Toledo public services |
| City events calendar (ical) | Step 3 handler. | City and library public calendars |
| City announcements (rss) | Step 3 handler. | City of Toledo newsroom |
