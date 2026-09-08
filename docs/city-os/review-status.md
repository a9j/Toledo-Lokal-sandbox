# Review pass: mistakes and usability

A full pass over everything Phases 1 to 7 built, asked for as "make sure there
are no mistakes and everything is user friendly". Sandbox `waezoxzkvhuqjzomafee`
only. Production untouched.

Method: a link audit of every route and internal link, a copy audit against
the plan's rules (8th grade reading level, no em dashes), a code review of the
whole branch against `main`, and then live verification of every finding that
mattered, as probe users, before and after each fix.

## What was wrong, in order of how much it mattered

**1. The neighborhoods trigger had been broken since Phase 3.** Phase 3 added a
seven argument `citygraph_upsert_entity` beside the six argument one and did
not redefine the neighborhood sync. A six argument call with a trailing null
matched both, so every insert or update on `neighborhoods` failed with
"function is not unique" and rolled back. Confirmed live before the fix:
`update neighborhoods set name = name` errored. Nothing had touched a
neighborhood row in four phases, which is why it went unnoticed. Fixed by
giving the neighborhood sync a blurb and dropping the old overload. Verified:
the same update now succeeds and one overload remains.

**2. Four Phase 4 migrations were applied to the sandbox but never committed.**
`report_issue`, `my_reported_issues`, `match_opportunities`,
`save_resident_profile`, `pledge_to_issue`, the `issue_pledges` table, the
deregister triggers and the 18 life events existed only in the database. A
fresh apply of the repository would have shipped Fix Toledo with no way to
report an issue. Reconstructed from the live definitions into
`20260907001050_city_os_phase4_functions_and_pledges.sql` and re-applied as a
no-op to prove it matches.

**3. The migration chain did not apply fresh.** `my_city_near_me` changed its
return shape across two migrations with `create or replace`, which Postgres
refuses. Both now drop the old signature first.

**4. A key owner could raise their own rate limit or un-revoke a key.** The
`api_keys` policy was FOR ALL and authenticated holds UPDATE. Owners now read
only. Verified: an owner's update hits zero rows, and they still see their key.

**5. Anyone could mint themselves a gift card.** The `wallet_items` policy was
FOR ALL with an ownership check, so a resident could insert a 500 dollar card
into their own wallet. Owners now read, and mark an item used through
`mark_wallet_item_used`, which changes nothing else. Verified: an owner's
insert is refused with 42501, their update hits zero rows, marking used works
once and refuses the second time.

**6. Moving house kept you following the old one.** `set_home_parcel` never
removed the previous follows, while the My City page promised it would.
Verified: after moving, the follows are exactly the new parcel and
neighborhood, and setting the same home again drops nothing.

**7. Autopilot was empty for anyone who had not set it up.** The score floor
applied to everyone, so a new user with no follows, no home and no topics got
nothing, while the page said the opposite. The floor now applies only once
topics are picked. Verified: a blank user gets 3 items.

**8. The procurement board was empty for anyone signed out.** Every policy on
`requests` was `to authenticated`. Open B2B requests are public by design and
now have an anon policy. Verified as anon: one open B2B request visible, a
personal request and a closed B2B request not.

**9. Typing `%` or `_` into the address search matched everything.** Escaped.
Verified: `%%` and `__` return zero rows, a real prefix still returns rows.

**10. Ask Toledo could 500 after counting the question.** The model was free to
return any string for the time window, and the database cast it. The schema
now describes the format and anything that does not parse as a date becomes
null. Deployed as `ask-toledo` v7.

**11. The Toledo API accepted `limit=abc`.** `Number("abc")` is NaN and NaN
survives min and max, so PostgREST got a bad range after the call was already
counted. Non numbers fall back to the defaults. Deployed as `toledo-api` v2.

**12. The Toledo API required a platform token as well as a key.** It was
deployed with JWT verification on, which defeats an API key. Redeployed with
it off, which is correct for a function that does its own key check. The
`/developers` page no longer carries a warning about it.

**13. The address code used `Math.random`.** Now the CSPRNG with rejection
sampling. Deployed as `send-address-code` v2.

**14. The developer page hardcoded the sandbox host.** It now reads the
configured Supabase URL, so it is right wherever the build points.

**15. Ask Toledo cards for projects and spaces did not link anywhere.** They
now open the project page and the spaces list, and show status and rent.

**16. Three em dashes in user facing copy.** The plan forbids them. Replaced.

## Verified

Every fix above with a database side was tested as a probe user inside a
transaction that was rolled back, so nothing was left behind. One committed
probe user was created for an API key and removed afterwards. The sandbox is at
0 users, 0 API keys, 0 API requests, 0 profiles.

| Check | Result |
|---|---|
| Typecheck | 70 errors, all in 12 files this branch never touched, unchanged |
| Lint | 6 errors, all pre-existing, unchanged |
| Production build | passes; only the sandbox host appears in the bundle |
| Security advisors | 166, up 2: `mark_wallet_item_used` and `set_home_parcel`, both authenticated only, both check `auth.uid()` |
| Definer functions reachable by anon among the review changes | none |
| Registry | 296 entities, unchanged |

## Not verified, and why

**`toledo-api` has not been called over HTTP from this environment.** The
proxy here refuses connections to the Supabase host, and the database has no
`pg_net`. The deploy response confirms v2 is active with JWT verification off.
The key check, the rate limit and the revocation path underneath it were all
tested at the database level in Phase 7.

**The two Ask Toledo model calls have still never run.** Same as every phase.
One real question from a signed in user is the outstanding test.

**The 22 opportunity URLs are still unconfirmed.** See the Phase 4 status.

## Still open after this pass

- Wallet items can only be issued by an admin. A business facing issuing path
  is the next thing the wallet needs.
- 141 security advisors predate this work and belong to the existing schema.
- Photo upload on Fix Toledo and City Memory.
- A screen for the entity targets on missions, stamps and challenges.
