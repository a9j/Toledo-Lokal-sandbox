# Phase 4 status: Issues and Opportunities

Applied to the sandbox and verified. Fix Toledo, Toledo Needs You, the
Opportunity Engine and Life Events.

Target: `waezoxzkvhuqjzomafee`. Production untouched.

## Applied

| Migration | What |
|---|---|
| `20260907001000_city_os_phase4_issues_opportunities` | `issues`, `issue_reporters`, `opportunities`, `resident_profiles`, RLS, CityGraph sync |
| `city_os_phase4_matching_and_reporting` | `report_issue`, `my_reported_issues`, `match_opportunities`, `save_resident_profile` |
| `city_os_phase4_issue_pledges` | `issue_pledges` + `pledge_to_issue` |
| `city_os_phase4_life_events` | the 18 life events and their checklists in `app_settings` |
| `city_os_phase4_deregister_deleted_entities` | **bug fix**: deleting a source row left an orphan in the CityGraph |

Seed: `supabase/seeds/city_os_phase4_opportunities.sql`, 22 real opportunities.

## The opportunity seed is different from every other seed here

Everything else in `supabase/seeds/` is invented. **These are not.** Provider
names, programme names and URLs came from live web search on 2026-09-07 and refer
to real organisations offering real help: the City of Toledo, Lucas County
Veterans Service Commission, Pathway Inc., Great Lakes Community Action
Partnership, Maumee Valley Habitat for Humanity, Lutheran Social Services of
Northwestern Ohio, The Salvation Army, Ohio Housing Finance Agency.

Two limits, both important:

**No URL has been fetched.** This environment blocks outbound web requests, so
every link is unconfirmed. Every row carries `provenance.url_verified = false`,
and the Opportunities page prints "We have not confirmed this listing. Check with
the provider before you rely on it." on each card plus a banner above the list.
Someone must open all 22 before a resident in trouble is sent to one.

**Eligibility is deliberately sparse.** Only rules a source actually stated are
recorded. An invented income cut off could stop someone applying for help they
qualify for, so absent facts are left absent and the matcher treats them as "do
not exclude".

**22, not the 40 the plan asks for.** These are the ones the searches surfaced
with a named provider and a link. Padding to 40 would have meant inventing
assistance programmes, which for this category of content is the one thing worth
refusing to do. Getting to 40 needs a session with web access.

## Two design decisions worth reviewing

**An issue is public; who reported it is not.** `reporter_id` lives in a separate
`issue_reporters` table rather than on the public row, because "pothole outside
123 Elm, reported by Jane" is a different thing from "pothole outside 123 Elm".
Same reasoning as the Phase 2 home address fix.

**Pledges are not `loop_transactions`.** The plan said to write them there with
type `pledge`. That does not fit: `loop_transactions` is a points ledger keyed by
`wallet_id`, with a constrained `loop_transaction_type` enum (earn, redeem,
donate, bonus, refund, expire) and running lifetime balances on `loop_wallets`. A
pledge of 500 dollars, 20 hours or a pallet of mulch is not points, and writing
`points = 0` rows into a balance ledger to carry unrelated amounts would leave
the Loop economy holding entries that mean nothing to it. Pledges got their own
table. Phase 6's Local Economic Loop can read both.

## A Phase 1 bug this phase exposed

**Deleting a source row left an orphan entity.** `city_entities` points at
`(source_table, source_id)` rather than holding a foreign key, which is what lets
one registry span many tables. Nothing removed the entity when its source row
went away, so a deleted issue stayed searchable, stayed answerable by Ask Toledo,
and stayed followable with a card pointing at a page that no longer exists.
Followers would have kept receiving it. One generic delete trigger now covers all
eight registered tables, and the sweep removed the orphans already there.

The registry is now exact: 272 entities, every one matching a live source row
(12 businesses, 10 events, 5 issues, 8 jobs, 9 neighborhoods, 6 nonprofits,
22 opportunities, 200 parcels).

## Verified end to end

Run against the sandbox and cleaned up. The database is back to 0 users.

- **Blank profile** returns all 22 opportunities with `missing_info: true`. Not
  knowing anything about someone never hides help from them.
- **A veteran renter on a low income** returns 15: the 7 homeowner and business
  only programmes drop out, 3 match on veteran status, 10 on a life event,
  `missing_info: false`.
- **Reporting** creates the issue, registers it in the graph, and auto follows
  it so status changes reach the reporter's inbox.
- **A status change** wrote a `city_events_log` row and fanned out to exactly 1
  inbox item.
- **Pledging** to a community project rolled into the public running total;
  pledging to a government issue was refused, as intended.
- **Privacy**, as an unrelated signed in user: sees the 2 public issues and the
  22 public opportunities, and **0** reporters, **0** pledges, **0** resident
  profiles, **0** of anyone else's reports.

## Still outstanding

- **Photo upload** is stubbed. The camera button is disabled with a tooltip
  rather than pretending to work; the report flow does not block on it, because
  a report without a photo still helps.
- **No admin issues queue yet.** Admins can move status directly in the
  database; the UI for it is not built.
- No data backed UI screenshots, same network reason as Phases 1 to 3.
