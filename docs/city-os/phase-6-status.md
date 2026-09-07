# Phase 6: Economy

Applied to the sandbox (`waezoxzkvhuqjzomafee`). Production untouched.

Covers plan features 6 (Lokal Wallet), 7 (Local Economic Loop), 31 (Procurement),
27 (Skill Exchange), 28 (Empty Space), 26 (Lokal Jobs), 29 (Start a Business) and
30 (Business Command Center).

## What was built

**Four new tables, three extensions of shipped ones.** The plan's rule held
throughout: extend, do not fork.

| New | What it holds |
|---|---|
| `wallet_items` | Gift cards, tickets, coupons, transit passes, volunteer credits, memberships |
| `spaces` | Empty storefronts, kitchens, offices, yards. Registered as place entities |
| `business_suppliers` | Who buys from whom. Public |
| `business_supplier_spend` | What it costs. Private to the buying business |
| `business_insights` | Generated recommendations, visible only to the business |

| Extended | How |
|---|---|
| `requests` | Four nullable columns (`poster_entity_id`, `is_b2b`, `is_barter`, `need_category`) so one table carries a resident asking for a plumber and a bakery asking for a flour miller |
| `jobs` | Ten boolean filters, plus travel estimates from home |
| `app_settings` | The Start a Business checklist as editable JSON |

**Reads.** `my_wallet_items`, `jobs_near_home`, `b2b_requests` and
`local_economic_loop` are `security invoker` and open to everyone; RLS decides
what comes back. `my_suppliers`, `my_local_spend_share`, `business_command_center`,
`refresh_business_insights`, `set_supplier_spend` and `post_b2b_request` are
definer and check `user_owns_business` before doing anything.

**UI.** `/spaces` (Empty Space), `/economy` (the chain, the procurement and swap
boards, links onward), `/start-a-business` (ten steps, ticks in localStorage), a
**Near me** view beside the shipped Jobs list with the ten filters and walk, bus
and drive estimates, an **Everything else** section on the wallet page, and the
Command Center on the business dashboard.

## Two defects found and fixed, both mine

**1. A private number on a world readable table. Again.**

`business_suppliers` is public on purpose: who supplies whom is the point of
drawing the chain. I put `monthly_spend` on that same row and thought this
protected it:

```sql
revoke select (monthly_spend) on public.business_suppliers from anon, authenticated;
```

It does nothing. Those roles hold a table wide SELECT grant, and a table level
grant already covers every column, so revoking one column while the table grant
stands changes nothing. Caught by checking rather than assuming:
`has_column_privilege('anon', 'public.business_suppliers', 'monthly_spend', 'select')`
returned true.

This is the Phase 2 home address leak wearing different clothes, and it has the
same fix: RLS is row level, so the number had to move to a row the public cannot
select at all. `business_supplier_spend` is that row, self only, no admin read.
Had it shipped, it would have exposed what every business in Toledo pays each of
its suppliers each month, to anyone, signed in or not.

**2. A trigger body left on the API surface.** `business_suppliers_sync_edge` is
SECURITY DEFINER; I revoked its two siblings and not this one, so it sat at
`/rest/v1/rpc/` reachable by anon. Calling a trigger function directly raises
"trigger functions can only be called as triggers", so nothing could be done with
it, but Phase 1 shipped fifteen of these and the rule since has been that no
trigger body is callable. Revoked.

**And one carried forward.** `citygraph_search` had no `spaces` bucket, which is
exactly the gap named as defect 9 in Phase 5 for developments. Having called that
out one phase earlier, leaving it open for spaces would have been a choice rather
than an oversight. Bucket added, `ask-toledo` redeployed (v6) with the prompts and
card allowlist updated.

## Three deliberate deviations from the plan

**`requests` was reused, not forked.** The plan offered a new `requests_b2b`
table or reuse of the existing one. The shipped shape already carries title,
description, budget range, category, neighborhood, status and an author, which is
what a procurement post needs. Four nullable columns carry the difference, and
the shipped RLS applies unchanged because the author is still a user either way.

**No `loop_transactions` were seeded.** Points move when a real person scans a
real code. Faking a few months of spend would have put a chart of invented money
on a page whose whole claim is where real money goes. `local_economic_loop`
returns `has_spend_data: false` and the page says so, while the chain below it is
real: it comes from what businesses say about their suppliers, which does not
depend on points moving.

**The nightly job is a function, not a schedule.** The plan asks for a nightly
job writing recommendations. Nothing in this sandbox runs cron, so
`refresh_business_insights` is idempotent and called from the dashboard instead:
the same inputs replace the same rows rather than piling up. Pointing a scheduler
at it later is a one line change.

## Verified in the sandbox

As `anon`: the chain is public (14 links, 10 local), the loop reports
`has_spend_data: false` honestly, spaces list (8), the ten job filters bite
(4 no experience, 3 records considered, 1 transit and teen friendly together),
and `business_supplier_spend` returns **zero rows**.

As a probe user owning one demo business:

| Check | Result |
|---|---|
| Wallet items | 1, the transit pass |
| Command Center followers / suppliers | 0 / 3 |
| Insights generated | 3, top one "You have no deal running" |
| `my_suppliers` with spend | 3 of 3 visible |
| Local spend share | 0.635 |
| B2B request posted and listed | yes |

As a second, unrelated signed in user:

| Check | Result |
|---|---|
| Public chain visible | 14 |
| Open B2B request visible | 1 |
| **Other business's insights** | **0** |
| **Other user's wallet items** | **0** |
| **Supplier spend rows** | **0** |
| `my_suppliers` on a business they do not own | refused, 42501 |
| `business_command_center` likewise | refused, 42501 |
| `refresh_business_insights` likewise | refused, 42501 |
| `post_b2b_request` likewise | refused, 42501 |

Both probe users, the wallet, the wallet item, the insights, the posted request
and the borrowed business ownership were all removed afterwards. The database is
back to 0 users and 0 owned businesses.

Ask Toledo retrieval: "empty storefront to rent shop space" returns 8 spaces with
rent and size, plus 2 developments.

## Security

`get_advisors` reported 163 lints before the trigger revoke and 161 after. The
remaining six additions over Phase 5 are the six owner checked definer functions,
which are meant to be callable by signed in users and refuse anyone who does not
own the business. Verified directly rather than by counting:

- Three trigger bodies (`spaces_fill_from_parcel`, `citygraph_sync_space`,
  `business_suppliers_sync_edge`): execute denied to both `anon` and `authenticated`.
- Six owner checked functions: `authenticated` yes, `anon` no.
- Four invoker reads: open to both, with RLS deciding.

## Registry

296 entities, up from 288. The eight new ones are the eight spaces, each with an
`occupies` edge to its parcel and a `space_listed` row in the change log. Ten
`supplies` edges now join `employs`, `hosts`, `located_in` and `occupies`.

## Seed data

`supabase/seeds/city_os_phase6_economy.sql`: 8 spaces, 14 supplier links (10
local, 4 deliberately out of town so the local share is not trivially 100
percent), their spend, and filter flags across the 8 seeded jobs. **All
invented**, and the contact addresses are unusable on purpose. The Empty Space
page says so on screen.

## Checks

Typecheck at its 70 error baseline, in the same 12 pre-existing files. Lint clean
for every Phase 6 file. Production build succeeds; the production Supabase ref
appears nowhere in `dist/`.

One note on the baseline: `Dashboard.tsx` types its `business` object as a
`SelectQueryError` because an unrelated select in that file names a column that
no longer exists. The Command Center line had to cast through `unknown` to read
`business.id`. That is working around someone else's broken query rather than
fixing it, which is out of scope here but worth someone's time.

## Not tested

**The two Ask Toledo model calls have still never run.** Egress is blocked, so
this is now unproven across Phases 3 to 6. The retrieval half is proven at every
step; the model half is not.

**No data backed UI screenshots**, for the same reason.

## Still open

- No UI for tagging suppliers. `business_suppliers` is written by seed and by
  API; the dashboard shows the counts and links to the loop, but a business
  cannot yet add a supplier from a screen. The write path and its permissions
  are done, so this is a form.
- No UI for posting a B2B request either, for the same reason.
- No UI for adding a wallet item. They arrive by seed or API today.
- Travel times are straight line estimates from speed constants (3 mph walking,
  22 driving, 11 on the bus plus ten minutes waiting), not routed times. The
  page says so. A routing service replaces one function and nothing above it
  changes.
- `analytics_events`, `passport_checkins` and `deal_redemptions` are all empty in
  this sandbox, so the Command Center's first four numbers are honestly zero
  rather than demonstrated.
