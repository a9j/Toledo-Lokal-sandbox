# Phase 7: Platform

Applied to the sandbox (`waezoxzkvhuqjzomafee`). Production untouched.

Covers plan features 40 (City Autopilot), 37 (Toledo API), 38 and 39 (Plugins and
Agent Marketplace), 16 to 18 (entity targets on Missions, Passport and
Challenges), 19 (My Toledo Year), 20 and 21 (Health Dashboard and Digital Twins).

Features 33 (Decision Translator), 22 (What If) and 13 (AR) are **not built**.
See the last section.

## What was built

**City Autopilot.** `autopilot_preferences` (topics, radius, quiet hours, a daily
cap, an on switch) and `autopilot_digest`, which scores the change log against
your follows, your neighborhood, your radius and your topics, and returns the
top items with the reason each one made the cut. `/autopilot` shows the
preferences and the digest side by side, because a digest you cannot inspect is
one nobody trusts.

**The Toledo API.** Six read only views (`api_businesses`, `api_events`,
`api_developments`, `api_spaces`, `api_neighborhoods`, `api_changes`), an
`api_keys` table storing SHA-256 hashes, `api_requests` for per key hourly
limits, and `api_authenticate` which resolves, limits and records in one call.
A `toledo-api` edge function serves it. `/developers` issues keys, shows usage
and documents the endpoints.

**Plugins.** `plugins` with a validated jsonb manifest declaring screens and
actions, the two the plan names (TARTA plan a ride, City report a problem), and
`/plugins`.

**Entity targets.** `loop_missions`, `passport_stamps` and `challenges` each gain
a nullable `target_entity_id`, so anything in the graph can be a mission step or
a stamp.

**Health Dashboard.** `neighborhood_stats` returns thirteen live counts per
neighborhood, rendered on each neighborhood page.

**My Toledo Year.** `my_toledo_year` returns the caller's own figures. `/my-year`.

## One defect found and fixed, mine

**The plugin manifest validator allowed an open redirect.**

The `internal_route` check was `'^/[A-Za-z0-9/_:.-]*$'`. Because `/` is in the
character class for the whole string, `//evil.example.com` matched. A browser
follows a protocol relative URL straight off the site, so a third party manifest
could have turned an in app action into an open redirect.

It was caught by an adversarial test written against my own validator rather
than by re-reading it. The `javascript:`, `data:`, unknown kind and missing key
cases all came back refused; the protocol relative one came back **ACCEPTED**.

The first path segment must now start with a letter, digit or underscore, which
rejects `//host` and `/\host` while leaving `/fix` and `/built/:id` valid. The
same check now also applies to screen routes, which had none at all. Re-tested:
six cases, all correct.

The UI re-checks the same shapes before rendering a link. Two checks for one
rule is deliberate: a manifest is third party content, and the validator is one
careless migration away from being loosened.

## Four deliberate deviations from the plan

**Autopilot does not push anything.** The plan asks for a nightly edge function
that pushes the top three. There is no scheduler and no notification channel in
this environment, so building a sender would be building something that cannot
run. Preferences, scoring, quiet hours and the digest are all here and tested;
`/autopilot` says plainly that nothing is pushed yet.

**The API has no separate Postgres role.** The plan asks for one. PostgREST
authenticates a single anon role and cannot be handed a different one per key,
so a new role here would look like isolation without being it. Every request goes
through `api_authenticate` instead, which is revoked from `anon` and
`authenticated` so the edge function is its only caller.

**Ask Toledo does not read plugin actions as tools.** The two model calls have
never run in this environment across Phases 3 to 7. Handing an unexercised model
a set of callable actions would stack a second untested thing on a first. The
registry, the validation and the surfacing are done; the tool binding waits for
one real answered question.

**My Toledo Year has no shareable card image.** Rendering one is a separate job
with its own decisions about what a card gives away. The numbers are here.

## Verified in the sandbox

Manifest validation, seven cases: `javascript:` refused, `data:` refused,
unknown kind refused, missing key refused, screens-not-an-array refused, a well
formed manifest accepted, and `//evil.example.com` **accepted before the fix and
refused after**. Then six more after the fix: `//host`, `/\host`, `///evil` and a
screen route `//host` all refused; `/fix` and `/built/:id` accepted.

Autopilot, as a probe user with a home and one followed project:

| Check | Result |
|---|---|
| Digest with no preferences saved | 10 items |
| Top item's reason | "You follow this" |
| Top item's score | 7.90 |
| Preferences saved and read back | topics = development |
| Digest with the switch off | 0 |

API keys, same user:

| Check | Result |
|---|---|
| Key returned once at creation | yes |
| **Plaintext stored anywhere** | **no, hash only** |
| `api_authenticate` callable by a signed in user | refused, 42501 |
| First call, limit of 2 | ok, 1 remaining |
| Third call | 429, "Rate limit reached" |
| Wrong key / empty key | 401 / 401 |
| After revoke | 403, "This key has been revoked" |

As a second, unrelated signed in user: **zero** of the first user's keys, request
log rows, preferences, digest items or year figures; revoking someone else's key
refused with 42501. The public reads still work for them: 12 API businesses, 2
plugins, 9 neighborhoods of stats.

Both probe users and everything they created were removed. The database is back
to 0 users.

## Security

`get_advisors` is at 164, up 3 from Phase 6. All three are the definer functions
deliberately granted to `authenticated` (`create_api_key`, `revoke_api_key`,
`save_autopilot_preferences`), each of which checks `auth.uid()` before doing
anything. Verified directly rather than by counting:

- **Zero** Phase 7 definer functions are reachable by `anon`.
- `api_authenticate` and `plugins_validate_manifest` are reachable by neither
  role.
- All seven City OS views, including the six new API ones, report
  `security_invoker = true`.

## Registry

296 entities, unchanged: Phase 7 adds capabilities, not entities.

## Not tested, and one thing that will not work as deployed

**The `toledo-api` function was first deployed with `verify_jwt: true`**, which
meant a caller needed a platform token as well as their API key. The review pass
after Phase 7 redeployed it (v2) with JWT verification off, which is correct for
a function that does its own key check. See `review-status.md`.

**The two Ask Toledo model calls still have never run**, now across five phases.

**No data backed UI screenshots**, for the same reason.

## Deliberately not built

**Decision Translator (33), What If (22), AR (13).** The plan puts these last and
says of the latter two: "Both need the graph to be dense before they are worth
anything." The graph holds 296 entities, almost all of them seeded and invented.
A What If simulator over invented parcels would produce confident nonsense about
a real city, and an AR layer over invented developments would put made up
buildings on real streets. These are the two features where the gap between demo
data and real data does the most harm, so they wait for real data rather than
shipping against seeds.

## Still open

- Autopilot needs a scheduler and a push channel before it is what the plan
  describes. The scoring is done; the sending is not.
- `toledo-api` has not been called over HTTP from this environment. The proxy
  here blocks the host. The key check underneath it is tested at the database
  level.
- No admin screen for reviewing submitted plugins; `status` moves by SQL.
- The entity targets on missions, stamps and challenges are columns with no UI
  yet: nothing sets or reads them.
- `neighborhood_stats` is computed live on every call. That is correct at this
  size and will want caching well before it is slow.

---

## Follow up: the missing screens

There is no Phase 8. The plan has seven phases and they are all applied. What
follows is not a new phase, it is the largest hole left by the previous ones:
Phases 4, 6 and 7 each shipped a write path that was tested at the database
level with no screen behind it, so nobody could actually use it.

Built and verified:

- **`/admin/city-os`** — one console with three queues. Reports (move an issue
  through reported, assigned, scheduled, completed or declined), Memories
  (publish or reject what is waiting), Plugins (read a manifest and move it
  between draft, review, published and suspended).
- **Supplier tagging on the business dashboard** — search Toledo businesses or
  name a supplier outside the city, record what you spend, and remove a link.
  The screen says which half is public and which is not, because both are on
  it: the link appears on the local loop, the amount is readable by nobody but
  the business.
- **Posting a business to business request** — from the same panel, straight
  onto the board at `/economy`.

One thing changed in the database to support this: `set_supplier_spend` now
defaults `p_monthly_spend` to null, so clearing a figure is a first class
operation. Without the default the generated client types map the parameter to
a non-nullable number and the only way to clear one was to cast past the type.

**Verified with two probe users, an admin and a plain resident.** The admin
moved an issue, published a memory (which fired the Phase 5 announce trigger)
and moved a plugin. The resident is not an admin, saw zero unapproved memories,
and their updates to the same issue and plugin **hit zero rows** — the refusal
comes from RLS, not from the page hiding a button. Both probes and everything
they touched were removed; the database is back to 0 users and 0 roles.

Still with no screen: the entity targets on missions, stamps and challenges, and
photo upload on Fix Toledo and City Memory.
