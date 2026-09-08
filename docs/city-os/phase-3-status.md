# Phase 3 status: Ask Toledo

Retrieval is **built, applied and tested**. The two model calls are **deployed but
not exercised from this session** — see Untested below. That distinction matters,
so it is stated plainly rather than buried.

Target: `waezoxzkvhuqjzomafee`. Production untouched.

## Applied

| Migration | What |
|---|---|
| `20260907000700_city_os_phase3_citygraph_search` | `citygraph_search(spec jsonb)`, the retrieval layer |
| `20260907000800_city_os_phase3_searchable_entities` | `search_blurb` on entities, weighted `search_text`, sync functions and backfill |
| `20260907000900_city_os_phase3_ask_toledo_rate_limit` | `check_ask_toledo_rate_limit`, 30 a day |

The OR term matching and the nonprofit and job buckets were a second revision of
`citygraph_search`; the migration file carries the final running definition, and the
defects that forced the revision are recorded below rather than left as two files.

Edge function `ask-toledo` redeployed (v3), `verify_jwt` on.

## How it works

1. Claude turns the question into a JSON query spec (structured output, low effort).
2. `citygraph_search` runs that spec against the CityGraph as the asking user.
3. Claude writes the answer **from those rows only**, citing `entity_id`s.
4. The function drops any cited id the database did not return, so a made up
   citation can never become a card on screen.

The model is told it has no other knowledge of Toledo and that an honest "I do not
have that" beats a confident invention. Distance comes from the caller's home parcel,
so `citygraph_search` is SECURITY DEFINER on `auth.uid()` and takes no user id.

## Three defects found while building, all fixed

**1. The CityGraph was only searchable by name.** `search_text` was generated from
`name` alone, so "where can I get coffee" returned nothing against a business whose
description reads "Small batch coffee roaster and cafe" — the word was simply not
indexed. Any question phrased by what a place *does* rather than what it is *called*
came back empty, which for Ask Toledo is most of them. Entities now carry a
`search_blurb` (category, description, address, mission, requirements) maintained by
the same sync triggers, and `search_text` covers name and blurb with the name
weighted higher.

**2. Every search term had to match.** `plainto_tsquery` ANDs its terms, so "barber
haircut" found nothing against a barbershop because "haircut" appears nowhere in its
listing. Terms are now ORed and results ranked by `ts_rank`, which is what makes a
search feel like it understood the question.

**3. Nonprofits were invisible.** They register as `organization` entities, but the
only organization query joined `public.businesses`, so every nonprofit was silently
dropped. "Where can I get help with food" could never have found the food share.
Nonprofits and jobs now have their own buckets.

Also: deals are filtered to their validity window, so an expired or not yet started
deal is never surfaced; and the daily limit is checked **after** the question is
validated, so an empty or oversized question no longer burns one of the 30.

## Retrieval, measured

Run against the sandbox as a resident with a Downtown home, then cleaned up.

| Question | Result |
|---|---|
| "coffee" | Glass City Roasters, 0.68 mi |
| "bike repair" | Anthony Wayne Cycles, 7.08 mi |
| "help with food" | 2 nonprofits, top hit Glass City Food Share |
| "hiring job" | 8 jobs |
| "pottery class" | 2 businesses + 1 event, top hit Kiln and Key Pottery |
| "this weekend" (events) | 10 events |
| categories `["salon_barber"]` | Old West End Barber Co, 1.93 mi |

That last row is the point of the two call design: "where can I get a haircut" is a
vocabulary gap no full text index closes, and the model's job is to turn it into a
category filter. Full text alone returns nothing for it; the category filter returns
the barbershop.

245 entities all carry a search blurb.

## Untested

**The two model calls have not run.** This session cannot invoke the edge function:
the environment's network policy blocks `waezoxzkvhuqjzomafee.supabase.co` from both
curl and the browser, and there is no way to mint a user JWT from here. So the
following are written and deployed but unproven:

- that `npm:@anthropic-ai/sdk` and its `helpers/zod` subpath import resolve in the
  Supabase Deno runtime,
- that `output_config.format` with `zodOutputFormat` returns schema valid JSON on
  `messages.create`,
- whether `ANTHROPIC_API_KEY` is even set in this project's secrets.

`readJson` is defensive about the response shape (it reads `parsed_output` if the SDK
provides it, else parses the text block), and a missing key returns a clear 503 rather
than a silent failure. But none of that is a substitute for one real call. **The first
thing to do on an environment that can reach the host is ask one question and read the
answer.**

## Decisions worth reviewing

**The old ask-toledo behaviour is gone.** It was a streaming concierge that dumped 20
businesses into a system prompt and was explicitly told "if you don't have specific
data, give general Toledo advice" — that is, answer from the model's own memory, which
is what the Phase 3 plan forbids. The new contract is a JSON request and a JSON
response, so any existing caller expecting an SSE stream would break. Nothing in the
repo called it.

**30 a day is its own counter**, in the same `ai_chat_usage` table the older 50 a day
chat uses, so the two share a row and both count against a resident's day.

**"Build my Saturday" is a suggested prompt, not a separate code path.** It sets
`intent: "plan"`, and the answer prompt lays the day out in order with times from the
event rows and refuses to invent a cost when the rows carry no prices.

## Still outstanding

No data-backed UI screenshots, for the same network reason as Phases 1 and 2.
