# Phase 0: Sandbox sanity check

Run date: 2026-09-06. Nothing was migrated. No production resource was read or written.

## 1. Repo origin

```
origin  https://github.com/a9j/Toledo-Lokal-sandbox (fetch)
origin  https://github.com/a9j/Toledo-Lokal-sandbox (push)
```

Correct. This is the sandbox repo.

## 2. Supabase target

There was no `.env` in the clone, only `.env.example`, so nothing resolved at all on a fresh
checkout. A local `.env` was created (it is gitignored, so it is not in the PR) pointing at the
sandbox:

```
VITE_SUPABASE_PROJECT_ID=waezoxzkvhuqjzomafee
VITE_SUPABASE_URL=https://waezoxzkvhuqjzomafee.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   (sandbox publishable key)
VITE_SITE_URL=http://localhost:8080
```

`vite.config.ts` injects the URL and key as build time constants, so the check that matters is what
lands in the bundle. After `npm run build`:

| Check | Result |
|---|---|
| `waezoxzkvhuqjzomafee` in `dist/` | present, in `dist/assets/index-*.js` |
| `nnepslwwqjxfhlurwoyw` in `dist/` | **zero matches** |

The production ref appears nowhere in the built app.

Confirmed against the Supabase API: branch `sandbox`, ref `waezoxzkvhuqjzomafee`, parent
`nnepslwwqjxfhlurwoyw`, preview project `ACTIVE_HEALTHY`. This matches the plan.

## 3. App boots against the sandbox

`npx vite --host 127.0.0.1 --port 8080` (the default `--host ::` fails in this container because
IPv6 is not available, this is an environment limitation and not a code problem).

Headless load of `http://127.0.0.1:8080/`:

- Title: `ToledoLokal - Discover the Glass City`
- Supabase hosts contacted: `waezoxzkvhuqjzomafee.supabase.co` only
- Page errors: none
- Renders the onboarding carousel ("Discover Local Gems")

## 4. Branch

Work is on `claude/toledo-city-os-sandbox-ss3ztc`, branched from `main`. The plan names the branch
`city-os/phase-1-citygraph`, but this session is pinned to the `claude/...` branch, so that is the
one being used. Rename on merge if the `city-os/` prefix matters.

---

## What the check turned up that changes the Phase 1 plan

### PostGIS is not installed

`postgis` 3.3.7 is **available but not installed** on the sandbox. Every `geography(point,4326)`
column in the plan needs the extension created first. The Phase 1 migration adds:

```sql
create extension if not exists postgis with schema extensions;
```

### The sandbox is almost empty

Row counts on the tables Phase 1 backfills from:

| Table | Rows |
|---|---|
| neighborhoods | 9 |
| cities | 1 |
| businesses | 0 |
| events | 0 |
| nonprofits | 0 |
| jobs | 0 |

The other seeded tables are reference data: categories 16, plans 4, loop_tiers 7,
pulse_post_templates 25, neighborhood_activity 8, billing_plans 3, app_settings 1.

So the backfill alone produces 10 entities and nothing else. The graph has nothing in it to follow
and the inbox has nothing to show. Phase 1 therefore has to seed demo businesses, events, nonprofits
and jobs before the 20 `city_events_log` rows are worth anything. Budgeted in the plan below.

### Schema gaps against what the plan assumed

| Assumption | Reality |
|---|---|
| `neighborhoods` links to a city | `neighborhoods` is `id, name, created_at` only. No `city_id`, no geometry. |
| Entities carry coordinates | Only `business_locations` has `latitude` / `longitude`. `businesses`, `events`, `jobs`, `nonprofits` have text addresses at best. |
| `events` sit in a neighborhood | `events` has `business_id` and `location_text`, no `neighborhood_id`. Same for `jobs`. |
| `profiles.id` is the user id | `profiles` has both `id` (pk) and `user_id`. Foreign keys must target `auth.users(id)`, not `profiles.id`. |

Consequences carried into the migration plan:

- `city_entities.city_id` is filled from the single `cities` row rather than walked from
  `neighborhoods`.
- `city_entities.location` is nullable and populated only where a coordinate exists
  (primary `business_locations` row today). Everything else backfills with a null location, and the
  distance features in Phase 2 and 3 depend on Phase 2 parcels landing first. This is expected, not
  a defect.
- `events` and `jobs` inherit `neighborhood_id` from their parent business.

### Existing helpers to reuse

`public.is_platform_admin(_user_id uuid)` and `public.has_role(_user_id uuid, _role app_role)`
already exist. RLS in Phase 1 uses `is_platform_admin(auth.uid())` rather than defining a new admin
predicate.
