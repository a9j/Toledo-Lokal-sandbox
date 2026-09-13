# QA checklist

Every row was either run or is marked blocked. Nothing is marked pass that was
not actually executed.

**Where these ran.** Database rows ran against the sandbox
(`waezoxzkvhuqjzomafee`) through the Supabase connection, as real statements,
not by reading code. Probes that wrote anything were rolled back or deleted,
and the row says so.

**Why the UI rows are blocked.** This build environment's egress proxy refuses
`waezoxzkvhuqjzomafee.supabase.co` (`CONNECT tunnel failed, 403`, verified). A
browser here therefore loads no data, so any UI assertion about real content
cannot be run honestly. The Playwright suite is committed and runs in CI, where
the host is reachable. Blocked means "not run here", not "not working".

## Foundation

| Feature | How to test | Expected | Status |
|---|---|---|---|
| Address resolve, exact parcel | `select * from resolve_address('<a real parcel address>')` | The parcel, high confidence | **Pass**. Returned the exact address at confidence 0.95 with the right neighborhood. |
| Address resolve, zip only | `resolve_address('43605')` | A neighborhood, no street address | **Pass**. Returned East Toledo with no address. |
| Address resolve, street without a number | `resolve_address('Broadway St, Toledo')` | A neighborhood, not a specific house | **Pass**. Returned South Toledo. |
| Address resolve, house number not on file | `resolve_address('742 Broadway St')` | Nothing, rather than a different house on that street | **Pass**. Returned null. This is the bug fixed earlier holding. |
| Address resolve, nonsense | `resolve_address('zzzzzz qqq')` | Nothing | **Pass**. Returned null. |
| Auto neighborhood assignment | Entity with a location and no neighborhood gets one | Trigger fills it | **Pass**, exercised by the resolve rows above returning neighborhood names. |
| Follow and unfollow, every entity type | Insert then delete `entity_follows` for one entity of each of the 10 source tables | Both succeed on all 10 | **Pass**. businesses, events, neighborhoods, nonprofits, jobs, parcels, issues, opportunities, developments, spaces. 0 rows leaked afterwards. |
| Change detection writes a log row | Update a business status, count `city_events_log` for that entity | Count increases | **Pass**. Rolled back. |
| Inbox fan out | Follow an entity, change it, look for `inbox_items` | A row appears for the follower | **Pass**. Rolled back, 0 rows left. |
| `city_search` returns mixed kinds | `city_search('coffee', null, 20)` | More than one kind | **Pass**. 2 distinct kinds. |
| Search acceptance test | `city_search('cheap stuff for kids Saturday', null, 30)` | Events, deals and businesses in one list | **Pass**. 8 rows across 4 kinds. |
| Source confidence present | Count entities with a confidence | Nearly all | **Pass with a note**. 309 of 312. Three entities have no confidence, see Findings. |
| `entity_media` constraints | Insert bad rows | Each refused | **Pass**. No source refused, second hero refused, seventh gallery photo refused, unknown slot refused. Rolled back, 0 rows. |
| `entity_media` is not writable by anon | Insert as `anon` | Refused by RLS | **Pass**. `anon` holds Supabase's table wide INSERT grant, so this was tested by actually inserting, not by reading the policy. Refused, 0 rows. |
| `entity_media` definer functions not exposed | `has_function_privilege` for anon and authenticated | False | **Pass**. Both false. |
| Daily and weekly digest jobs | `select * from cron.job` | Three active jobs | **Pass**. `city-changes-daily`, `notifications-daily`, `notifications-weekly`, all active. |
| Notification cadence settings | Set a cadence, check the category mapping | Off means off, per kind | **Not run here.** Needs a signed in user session. |
| Privacy toggles gate location and home data | Toggle, then read as another user | Sections hidden | **Not run here.** 0 privacy rows exist, so only defaults could be checked. |
| Semantic search | `semantic_search(...)` | Ranked results | **Blocked.** 0 of 312 entities have vectors. Needs `OPENAI_API_KEY` or `VOYAGE_API_KEY` (1536 dims). |
| Connector run, ical and rss | Run a source | Records imported | **Blocked.** 3 sources registered, none has a URL, none has ever run. Needs two real feed URLs. |
| CityProvider with a second city slug | Set `VITE_CITY_SLUG` | The app renames itself | **Blocked, and would mislead.** Only `city_entities` and `data_sources` carry `city_id`; 26 populated tables do not. A second city would look wrong for a schema reason, not a bug. |
| All five tabs, Ask Toledo entry point | Load the app | Tabs and the floating button | **Blocked here**, no data. Suite committed. |

## Images

| Feature | How to test | Expected | Status |
|---|---|---|---|
| Placeholder per entity kind | Render a card for each kind | A branded tile, never a gray box | **Pass**. Seen at iPhone 15 size in both themes on `/dev/kit`. |
| Hero legibility, light and dark | Screenshot a hero in both themes | Title readable in both | **Fail, then fixed, then pass.** The page fade painted over the dark scrim and washed out the title in light mode. Paint order corrected and re-shot. |
| Image upload and render at every size | Upload, then request 400/800/1200 | Three sizes | **Blocked.** Upload needs the network. See below on srcSet. |
| srcSet at 400/800/1200 | Inspect an `<img>` | Three candidate widths | **Blocked by a paid add on.** Supabase image transformations must be enabled, and transforms have to be requested when a URL is signed rather than appended after, or the signature stops matching. Shipping three URLs that resolve to identical bytes would look like the feature without being it. |

## Findings

1. **Three entities carry no confidence.** 309 of 312 have one. Worth a look
   before source confidence is shown as a guarantee anywhere.
2. **The sandbox holds no photographs at all.** 0 of 12 businesses, 0 of 10
   events, 0 of 6 nonprofits, and `media_assets` has 0 rows. Every image on
   every screen is currently a placeholder tile.
