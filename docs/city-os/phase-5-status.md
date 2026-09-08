# Phase 5: Places and Change

Applied to the sandbox (`waezoxzkvhuqjzomafee`). Production untouched.

Covers plan features 10 (What Is Being Built), 11 (Development Radar), 12 (City
Memory), 35 (City Change Log), 9 (Around Me) and 8 (City Pulse upgrade).

## What was built

**Two tables.**

`developments` — name, summary, developer, planning case, kind, status, parcel,
neighborhood, address, point, expected completion, investment amount, documents.
Registered as a `place` entity by the Phase 1 upsert, so it is followable,
searchable and answerable with no new plumbing. A row on a parcel inherits that
parcel's point, neighborhood and address unless it was given its own, and gets an
`occupies` edge to the parcel entity.

`memory_items` — entity, year, kind (photo, story, clipping), title, body, media
url, contributor, approved. Attached to any entity, so a neighborhood, a business
and a building project all take the same timeline.

**Five reads, all `security invoker`.** `development_radar`, `city_feed`,
`city_changed_recently`, `entity_memory`, and the `city_change_log` view.

**Six UI surfaces.**

- `/built` — Development Radar. Status and kind filters, list or map. The map
  and the list read the same function, so they cannot disagree.
- `/built/:id` — one project: status track, developer, planning case, documents,
  follow button, recent changes, and its City Memory timeline.
- `/around` — Around Me. The radar sorted by distance from home at half a mile,
  one mile or three, with everything else happening nearby underneath.
- Home tab — a "Toledo changed today" strip, plus an entry card for the radar.
- `/pulse` — a second view, **Everything**, next to the shipped Pulse feed. Four
  sources merged with a scope toggle: City, My area, One mile, Following.
- Neighborhood pages — the City Memory timeline, with a submission form.

## Three deliberate deviations from the plan

**The City Change Log is a plain view, not a materialized view.** A matview
carries no RLS of its own, is exposed at `/rest/v1/` as a table, and is stale
until something refreshes it. Nothing in this sandbox runs cron, so a matview
here would have been a permanently stale copy of public data with weaker access
rules than the table it copies. `city_change_log` is a plain view with
`security_invoker = true`: always current, caller's permissions still apply. If
the day counts ever get slow enough to matter it becomes a matview plus a
refresh job in one commit.

**Pulse gained a second view rather than being replaced.** The plan says merge
four sources into one feed. The shipped Pulse page has a composer, a signals
strip and its own tabbed feed that people already use. Replacing it wholesale to
satisfy a plan line would have thrown away working product, so **Everything** is
a sibling view and **Pulse** is untouched.

**The reads are invoker, not definer.** Every source table involved is already
world readable except `entity_follows` and `resident_homes`, which are self only
and under invoker return exactly the caller's own rows. A definer function would
have had to re-derive all of that by hand, which is precisely how the Phase 1
privilege escalation happened.

## One defect found and fixed inside the phase

**Ask Toledo could not answer the question Phase 5 exists for.** A development
registers as a `place` entity, so it landed in `citygraph_search`'s scoped set
and its filing showed up in the `changes` bucket. But there was no `developments`
bucket, so "what is being built in East Toledo" came back as a line of change log
text with no status, no developer and no date. Under the Phase 3 rule (every fact
must come from the search results) the model would then correctly say it does not
know about projects the database is holding.

Fixed by adding the bucket, ordered so under construction comes first, plus a
`development_statuses` filter the model can set. `ask-toledo` was redeployed
(v5) with the spec schema, the two prompts and the card allowlist all updated.

## Verified in the sandbox

Every check run against the sandbox and cleaned up after. As `anon`: the radar
returns 16 projects, 5 under construction, 3 parks; the feed merges all four
sources (36 change, 10 event, 4 pulse, 3 signal); scoping to Downtown cuts 53
rows to 11; the `following` and `mile` scopes correctly return nothing without an
account.

As a signed in probe user with a home address and one followed project:

| Check | Result |
|---|---|
| Feed, one mile | 9 rows |
| Feed, five miles | 39 rows |
| Feed, following | 1 row (only the followed project) |
| Feed, own neighborhood, derived from home | 11 rows |
| Radar, distances computed | 16 of 16 |
| Radar within two miles | 5 |
| Approved memories visible | 6 |
| **Unapproved memory by someone else** | **0** |
| **Resident moving a project's status** | **refused, 0 rows** |
| **Resident self approving a memory** | **refused, 42501** |
| Status change logged, reached follower inbox | yes, 1 log row, 2 inbox items |

Ask Toledo retrieval: "being built construction apartments" returns 10
developments with Jefferson Block Lofts (under construction) first; scoped to
East Toledo, "grocery park" returns 2 developments and 1 business.

The probe user, their home, their follows, their inbox and the probe memory were
all deleted afterwards. The database is back to 0 users.

## Security

`get_advisors` reports 155 lints, **none of them from Phase 5**. Checked
directly rather than by counting: the three definer trigger functions
(`developments_fill_from_parcel`, `citygraph_sync_development`,
`memory_items_announce`) are `execute` denied to both `anon` and `authenticated`;
the five read functions are invoker and open by design. `city_change_log` is not
flagged as a security definer view, which confirms `security_invoker` took.

The 155 is up from the 149 recorded in Phase 4, and the difference is not Phase
5: five of the six are Phase 4's own granted definer functions (`report_issue`,
`pledge_to_issue`, `match_opportunities`, `save_resident_profile`,
`my_reported_issues`), meaning the 149 reading was taken before those grants
landed.

## Registry

288 entities, up from 272. The 16 new ones are the 16 developments, each with an
`occupies` edge to its parcel and a `development_filed` row in the change log.

## Seed data

`supabase/seeds/city_os_phase5_developments.sql`: 16 developments, 6 memories,
4 pulse posts, 3 city signals. **All invented**, like every seed in this repo
except the Phase 4 opportunities. Developments carry
`documents->>'source' = 'city-os-demo-seed'` so they can be removed in one
statement, and both the radar and the project page say on screen that this is
sandbox data. That line is there because "what is being built near me" is a claim
people act on.

## Checks

Typecheck back at its 70 error baseline, all in the same 12 pre-existing files
Phase 5 never touched. Lint clean for every Phase 5 file (6 pre-existing errors
elsewhere). Production build succeeds; the production Supabase ref appears
nowhere in `dist/`.

## Not tested

**The Ask Toledo model calls still have never run.** Egress is blocked in this
environment, so the two `anthropic.messages.create` calls remain unexercised
across Phases 3, 4 and 5. What is proven is the retrieval half: `citygraph_search`
returns the right developments for the right questions. What is not proven is
that the model turns "what is being built downtown" into the right spec.

**No data backed UI screenshots**, for the same reason.

## Still open

- Photo upload for City Memory is a url field, not an uploader. The same gap as
  Fix Toledo's stubbed photo button.
- No admin queue for approving memories. They can only be approved by an admin
  writing to the table, which is fine for a sandbox and not fine for launch.
- `pulse_posts` and `city_signals` record a neighborhood by **name**, not by id,
  so the feed matches them back by name. A post whose neighborhood text does not
  match a row in `neighborhoods` appears only in the city scope. Fixing it
  properly means adding `neighborhood_id` to both shipped tables.
- The organization vs place entity kind question from Phase 4 is now more
  expensive, as predicted: developments and parcels are both `place`, so
  businesses joining them would need a data migration.
