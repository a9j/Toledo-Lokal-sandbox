# Toledo Lokal City OS: Sandbox Build Plan

**Where this runs**
- Repo: `a9j/Toledo-Lokal-sandbox`
- Supabase branch: `sandbox` (ref `waezoxzkvhuqjzomafee`, parent `nnepslwwqjxfhlurwoyw`)
- Deploy: Vercel preview pointed at the sandbox env
- Workflow: feature branch per phase, draft PR, migration plan reviewed before applying, you merge

**What already exists in the sandbox and gets reused (do not rebuild)**
- businesses, business_locations, events, jobs, nonprofits, programs, neighborhoods, cities
- business_follows, hire_follows, saved_items
- loop_wallets, loop_transactions, loop_missions, loop_badges, passport_stamps, passport_checkins, challenges
- pulse_posts, city_signals, neighborhood_activity, daily_drops
- ai_chat_usage, analytics_events, announcements

**The rule for every phase**
Extend the existing tables. Add a thin registry layer on top. Never fork the data model.

---

## The 40 features mapped to 7 build phases

| Phase | Builds | Features covered |
|---|---|---|
| 1 | CityGraph foundation | 2 CityGraph, 34 Follow This, 24 Civic Inbox |
| 2 | My City | 1 My City, 23 Lokal ID, 32 City Receipt |
| 3 | Ask Toledo | 3 Ask Toledo, 36 Neighborhood AI, 25 City Calendar ("Build my Saturday") |
| 4 | Issues and Opportunities | 14 Fix Toledo, 15 Toledo Needs You, 5 Opportunity Engine, 4 Life Events |
| 5 | Places and Change | 10 What Is Being Built, 11 Development Radar, 12 City Memory, 35 City Change Log, 9 Around Me, 8 City Pulse upgrade |
| 6 | Economy | 6 Lokal Wallet, 7 Local Economic Loop, 31 Procurement, 27 Skill Exchange, 28 Empty Space, 26 Lokal Jobs, 29 Start a Business, 30 Business Command Center |
| 7 | Platform | 40 City Autopilot, 37 Toledo API, 38 Plugins, 39 Agent Marketplace, 16 to 22 (Missions, Passport 2.0, Toledo Year, City Challenges, Health Dashboard, Digital Twins, What If), 33 Decision Translator, 13 AR |

Phases 1 through 4 are the secret sauce. Get those working end to end before touching 5 through 7.

---

## Phase 0: Sandbox sanity check

Verify isolation from production before anything is built:

1. `git remote -v` must show `a9j/Toledo-Lokal-sandbox`.
2. The Supabase URL the build resolves must point at `waezoxzkvhuqjzomafee`, not `nnepslwwqjxfhlurwoyw`.
3. The app must boot locally against the sandbox database.
4. Branch off main for the phase.

Result of the Phase 0 run is recorded in `docs/city-os/phase-0-sandbox-check.md`.

---

## Phase 1: CityGraph foundation

This is the layer everything else attaches to. Three pieces: an entity registry, edges between
entities, and universal follows that feed a notification inbox.

The reviewable migration and rollback live in `docs/city-os/phase-1-migration-plan.md`. Nothing
is applied until that plan is approved.

Tables: `city_entities`, `city_edges`, `entity_follows`, `city_events_log`, `inbox_items`.

RLS: `city_entities` and `city_edges` readable by everyone, writable by admin. `entity_follows`
and `inbox_items` scoped to `auth.uid()`. `city_events_log` readable by everyone, insert by admin
or service role.

Backfill: a one time script that inserts a `city_entities` row for every existing business, event,
neighborhood, nonprofit, and job, plus `located_in` edges to neighborhoods. Then a trigger on each
source table that keeps the registry in sync on insert and update.

Fan out: a trigger on `city_events_log` that inserts an `inbox_items` row for every user following
that entity.

UI:
- A reusable `<FollowButton entityId />` component. Replace the existing business follow button
  with it, mapping `business_follows` into `entity_follows` so nothing breaks.
- An `/inbox` route. Group items by day. Unread count badge in the tab bar.
- Every business, event, neighborhood, and nonprofit detail page gets the FollowButton and a
  "Recent changes" list from `city_events_log`.
- Seed 20 realistic `city_events_log` rows so the inbox has something to show.

---

## Phase 2: My City

Home address becomes the personal key to the city.

**Data reality check.** Trash day, snow route, council district, precinct, and school district are
lookups by address. Toledo does not expose all of these through one API. Build the lookup layer so
it works from seeded tables now and swaps to live sources later.

Sources to wire when ready:
- City of Toledo open data portal (refuse routes, council districts, street closures)
- Lucas County AREIS (parcel and owner data, tax history)
- Lucas County Board of Elections (precinct lookup)
- Ohio Secretary of State (school district by address)

Tables: `parcels` (parcel_number, address, location, neighborhood_id, council_district, precinct,
school_district, refuse_day, recycling_week, snow_route, assessed_value, tax_year_amount, raw).
Plus `profiles.home_parcel_id` and `profiles.home_verified_at`.

Every parcel is also a `place` entity in `city_entities`, so it can be followed.

Build:
1. Migrate `parcels` and the two `profiles` columns. Register every parcel as a `place` entity.
2. Seed 200 parcels across the 9 existing neighborhoods with realistic values, source `seed` in `raw`.
3. Address picker in onboarding and settings. Auto follow the home parcel and its neighborhood.
4. Rebuild the Home tab as My City: My Home, My Neighborhood, My Representatives, Near Me,
   Deals Near Me, New Businesses Near Me.
5. City Receipt: `tax_year_amount` split by published city budget percentages stored in `app_settings`.
6. Lokal ID: "Verify my address" sets `home_verified_at` after an emailed code. No document upload.

---

## Phase 3: Ask Toledo

One conversational interface that queries the CityGraph instead of the open web.

- Edge function `ask-toledo` (Deno). Input: question, user_id, optional neighborhood scope.
- Step 1: classify intent and extract filters with Claude (distance, budget, time, category, neighborhood).
- Step 2: run structured queries against `city_entities`, `city_edges`, events, deals, businesses,
  `city_events_log`. PostGIS for distance from `home_parcel`.
- Step 3: Claude writes the answer from the retrieved rows only. Cite entity ids so the UI can render
  tappable cards.
- Log every question to `ai_chat_usage`. Rate limit 30 questions a day per user.

Neighborhood AI is the same function with `neighborhood_id` pinned. "Build my Saturday" is the same
function with a `plan` intent that returns an ordered list of events and places with times and a cost
estimate.

Retrieval lives in a Postgres function `citygraph_search(spec jsonb, user_id uuid)`.

---

## Phase 4: Issues and Opportunities

Tables: `issues`, `opportunities`, `resident_profiles`. Every issue and opportunity is registered in
`city_entities` so it can be followed and shows up in the inbox when status changes.

- Fix Toledo: camera first flow. Photo, auto location, pick a kind, submit. Status tracker
  (reported > assigned > scheduled > completed). Admin issues queue.
- Toledo Needs You: same table with `is_government` false. Needs and progress render as bars.
  Pledges are rows in `loop_transactions` with type `pledge`.
- Opportunity Engine: `match_opportunities(user_id)` compares `eligibility` jsonb against
  `resident_profiles`. Tab shows "You may qualify for N things".
- Life Events: a picker of 18 events. Choosing one filters opportunities and shows a checklist
  stored in `app_settings` as editable JSON.
- Seed 40 real Toledo and Lucas County opportunities with real URLs, each verified to resolve.

---

## Phase 5: Places and Change

- `developments` (name, parcel_id, developer, planning_case, status, est_completion, documents jsonb).
  Registered as place entities. Status change writes to `city_events_log`.
- Development Radar: map with status filter. Around Me: the same map reduced to a list sorted by
  distance, with live events and deals mixed in.
- City Memory: `memory_items` (entity_id, year, kind photo/story/clipping, media_id, contributor_id,
  approved). Timeline on every place page.
- City Change Log: a materialized view over `city_events_log` grouped by day and event_type. Home tab
  gets a "Toledo changed today" strip.
- City Pulse upgrade: merge `pulse_posts`, `city_signals`, `city_events_log`, `events` into one feed
  with a geo scope toggle (City, Neighborhood, One mile, Following).

## Phase 6: Economy

- Lokal Wallet: extend `loop_wallets` with `wallet_items` (kind: points, gift_card, ticket, coupon,
  transit, volunteer_credit, membership). One screen.
- Local Economic Loop: sum `loop_transactions` by month, then walk `supplies` edges in `city_edges`
  to draw the chain. Businesses tag suppliers, which creates the edges.
- Procurement and Skill Exchange: one table `requests_b2b` (poster_entity, need_category, description,
  budget, is_barter, status). Reuse the existing `requests` table if the shape fits.
- Empty Space: `spaces` (parcel_id, kind, sqft, rent, available_from, contact). Registered as place entities.
- Lokal Jobs: extend `jobs` with travel time from home parcel (walk, drive, bus estimates via straight
  line distance and speed constants for now). Add the 10 filters as boolean columns.
- Start a Business: a guided checklist stored as editable JSON in `app_settings`, each step linking to
  a local business category via `citygraph_search`.
- Business Command Center: extend the business dashboard with counts from `analytics_events`,
  `passport_checkins`, `deal_redemptions`, plus a nightly job writing recommendations into
  `business_insights`.

## Phase 7: Platform

- City Autopilot: preferences screen (topics, radius, quiet hours) plus a nightly edge function that
  scores `city_events_log` rows against each user's follows, profile, and preferences and pushes the
  top 3. This is Phase 1 plus Phase 4 plus a scoring function. Build it as soon as those are stable.
- Toledo API: read only views (`api_businesses`, `api_events`, ...) with a separate anon role and per
  key rate limits in an `api_keys` table.
- Plugins and Agent Marketplace: `plugins` (org_entity, name, manifest jsonb). Manifest declares screens
  and actions. Ask Toledo reads actions as tools. Start with two: TARTA plan ride (deep link) and City
  report pothole (calls Fix Toledo).
- Missions, Passport 2.0, City Challenges: extend `loop_missions`, `passport_stamps`, `challenges` with
  an `entity_id` target so any entity can be a stamp or a mission step.
- My Toledo Year: a December job that aggregates a user's checkins, follows, events, and pledges into a
  shareable card image.
- Health Dashboard and Digital Twins: `neighborhood_stats` populated nightly from counts in
  `city_entities` and `city_events_log`. Render as cards on each neighborhood page.
- What If and AR: last. Both need the graph to be dense before they are worth anything.

---

## Order of operations

1. Phase 0 first.
2. Phase 1 next. Nothing else works without it.
3. Phase 2 and 3. My City plus Ask Toledo is the demo.
4. Phase 4. This is what makes it feel like a City OS and not a directory.
5. Phases 5 through 7 in whatever order the data sources allow.

Each phase is one branch, one draft PR, one migration reviewed before it runs. When a phase is solid in
the sandbox, cherry pick the PR into `a9j/Toledo-Lokal` and apply the migration to production.

## Copy and design constraints

Apple minimal. DM Sans body, Space Grotesk headings. Electric blue accent. Eighth grade reading level.
No em dashes in user facing copy.
