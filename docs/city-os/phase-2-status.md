# Phase 2 status: My City

**Applied to the sandbox and verified.** Home address becomes the personal key to
the city: trash day, snow route, council district, precinct, school district, what
is changing nearby, and where the tax money goes.

Target: `waezoxzkvhuqjzomafee`. Production was never touched.

## Applied

| Migration | What |
|---|---|
| `20260907000100_city_os_phase2_parcels` | `parcels`, pg_trgm address index, parcel to `place` entity trigger, RLS |
| `20260907000200_city_os_phase2_my_city_functions` | `search_parcels`, `set_home_parcel`, `my_home`, `my_city_near_me`, `my_city_nearby_businesses` |
| `20260907000300_city_os_phase2_lokal_id_and_receipt` | `address_verifications`, `confirm_address_verification`, `city_budget_split` setting |
| `20260907000400_city_os_phase2_near_me_neighborhood` | neighborhood centroids, Near Me includes your own neighborhood |
| `20260907000500_city_os_phase2_private_home` | **security fix**: home moves off `profiles` into `resident_homes` |
| `city_os_phase2_hash_verification_code` | bcrypt helper, service role only |

Seed: `supabase/seeds/city_os_phase2_parcels.sql`, 200 parcels.
Edge function: `send-address-code`, deployed, `verify_jwt` on.

## Counts, measured

200 parcels, all with a location, 25 in each of the 8 real neighborhoods (Virtual is
skipped: nobody lives there). All 200 registered as `place` entities with a
`located_in` edge. 8 neighborhoods now carry a centroid computed from their parcels.
5 refuse days and 6 council districts represented.

## Two defects found while building, both fixed

**1. A home address leak, which I created by following the plan literally.**

The plan said to add `home_parcel_id` and `home_verified_at` to `profiles`. But
`profiles` already carries:

```
policy "Public can read basic profile info"  select  using (true)                  permissive
policy "Require authentication for profiles" all     using (auth.uid() is not null) restrictive
```

The restrictive policy only requires *being signed in*. So once those columns
existed, any signed in account could select every column of every profile row, and
`parcels` is publicly readable, so anyone could have joined the two and read every
other resident's home address.

Postgres RLS is row level, not column level, so no policy on `profiles` fixes it.
A column level `REVOKE` would, but it breaks every existing `select *` on profiles
across the app. So the home moved to `resident_homes`, whose RLS is simply "yours and
only yours", with no admin read policy either: there is no product reason for staff to
browse residents' home addresses. `profiles` is back to what it was.

Proven with two users: Alice sets a home, Bob then sees 0 rows in `resident_homes`,
0 from `my_home()`, 0 from `my_city_near_me()`, and 0 pending codes, while still
seeing the 2 public profile rows as before.

**2. Near Me was silently dropping the changes it exists for.** It matched entities by
distance, which needs a location, but neighborhood entities had none, and
neighborhood level rows are exactly what Near Me is for: closures, permits, meetings.
Every one was being filtered out. Fixed two ways: neighborhoods now carry a centroid
computed from their parcels (kept fresh by a trigger), and Near Me always includes
changes on your own neighborhood whatever the radius, because a closure on your street
is yours regardless of where the centroid falls.

## Verified end to end

Run against the sandbox, cleaned up after. The database is back to 0 users, 0 homes,
0 follows.

- **Address picker** as `anon`: `search_parcels('Jefferson')` returns Downtown matches.
- **Set home**: `my_home()` returns the address, district `1`, precinct `1-A`, school
  district Toledo City, trash day Monday, recycling week A, snow route Primary, tax
  `$976.50`, `source = seed`.
- **Auto follow**: setting a home created 2 follows (the parcel and its neighborhood)
  and backfilled 1 unread inbox row from existing history.
- **Near Me**: 0.5 miles returns the Downtown closure, scoped `neighborhood`, with the
  centroid distance shown as 0.89 mi.
- **Nearby businesses**: 2 within a mile.
- **Lokal ID**: a wrong code returns `wrong_code` with `attempts_left: 4`; the right
  code sets `verified_at` and consumes the row, leaving 0 pending.
- **Isolation**: Bob cannot reach any part of Alice's home, as above.

## Security posture

`get_advisors` is down from 168 lints to 149. Of the 8 that touch City OS objects,
exactly **one is reachable by `anon`**: `citygraph_entity_id`, which maps a public
source row to a public entity id and carries nothing private. The six
`authenticated` ones are the intended My City entry points, each scoped to
`auth.uid()` and taking no user id argument. The `rls_enabled_no_policy` on
`address_verifications` is deliberate: that table is service role and definer
function only, so nobody reads even their own pending code hash.

The remaining 141 lints predate this work and still deserve a pass of their own.

## Decisions worth reviewing

**The Home tab leads with My City rather than replacing the Daily Drop.** The plan
said "rebuild the Home tab as My City". For a resident with an address it now does
lead with My City; the Daily Drop follows underneath, and signed out visitors see the
landing page exactly as before. Deleting the Daily Drop outright seemed like more
destruction than the plan intended. Say the word and it goes.

**The address picker is in onboarding step 3 rather than a new step.** ProfileSetup is
a four step wizard with hardcoded step numbers; inserting a step would have meant
renumbering every transition. It sits on the final screen as an optional, skippable
ask, and also lives in Profile settings.

**Representative contact details are not in yet.** The card shows district, precinct
and school district and says contact info is coming. Wiring real council member
contacts needs a source decision.

## Data is fictional

All 200 parcels are invented. Street names are real Toledo streets so the picker feels
right to type against, but house numbers, coordinates, districts, precincts, school
districts, refuse days, snow routes and dollar figures are fabricated. Every row carries
`raw = {"source":"seed"}`, the My Home and My Representatives cards render a
"placeholder values, not your real city records" notice off it, and the City Receipt
carries an explicit "this is an estimate, not a bill" warning. Remove with:

```sql
delete from public.parcels where raw ->> 'source' = 'seed';
```

The `city_budget_split` percentages in `app_settings` are placeholders too, marked
`source: placeholder`, and the receipt says so. Replace them with the published City of
Toledo general fund breakdown before any resident sees this.

## Still outstanding

Same as Phase 1: the environment's network policy denies the browser access to
`waezoxzkvhuqjzomafee.supabase.co`, so there are no data-backed UI screenshots.
Everything above was verified server side through the Supabase API.

`send-address-code` needs `RESEND_API_KEY` in Supabase secrets to actually deliver.
Without it the function returns a clear 503 rather than pretending it sent.
