# ToledoLokal

Discover the Glass City — local businesses, events, and community.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend:** Supabase (Postgres, Auth, Edge Functions, Storage)
- **Deployment:** Vercel
- **PWA:** Offline-capable with service workers

## Getting Started

```sh
# Install dependencies
npm install

# Copy environment variables and fill in your Supabase credentials
cp .env.example .env

# Start the dev server (http://localhost:8080)
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_URL` | Supabase project URL |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Deployment

This project deploys to **Vercel**. Connect your GitHub repo in the Vercel dashboard — it will auto-detect Vite and configure the build.

**Build settings** (auto-detected by Vercel):
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set the environment variables from `.env.example` in your Vercel project settings.

## Supabase

Edge functions live in `supabase/functions/`. Database migrations are in `supabase/migrations/`.

To work with Supabase locally, install the [Supabase CLI](https://supabase.com/docs/guides/cli) and run:

```sh
supabase start
supabase functions serve
```

## Hire Local — the verification engine

Hire Local is civic hiring infrastructure. The point is to let a local person
feel known and vouched-for before a resume is ever judged. It rests on one rule,
and the rule is load-bearing. Do not relax it.

### The one rule

**A person can CLAIM. Only a verified organization can CONFIRM.** Nothing a
person types about themselves counts as verified until a real, verified
organization stands behind it. Every verified item names the organization that
confirmed it and when.

### Two states, never blurred

Any record item is in exactly one of these states, shown distinctly in the UI:

- **pending** — self-reported. Shown in gray. Hidden from employers.
- **verified** — organization-confirmed. Shown in amber. Visible to employers.
  Always names the confirming org.

`denied` is a third, terminal state: the row is kept (never deleted), stays
hidden from employers, and the person can see it and re-file once with a note. A
**resume** is a separate thing again: a self-reported attachment, always labeled
self-reported, never the headline.

A row in `record_items` is `verified` only when `confirmed_org_id` is set **and**
that organization's `businesses.verified` is true. This is enforced by the
`enforce_record_item_verification` trigger and the `confirm_record_item` RPC, not
just the UI. The same `record_items` ledger is the shared engine: both Hire Local
and a future Civic Resume read verified facts from it. Do not fork it.

### Guardrails (built in — do not quietly remove them)

1. **No hiring score.** Verified facts render as a flat list. Never aggregate
   them into a number, badge tier, or ranking. A score creates
   employment-discrimination exposure. Resist every future request to "just add a
   number." `quality_tags` show a confirmed count only; the count is never
   weighted into a score.
2. **No video intros.** No video upload or playback in the profile. Video leaks
   age, race, disability, accent, and pregnancy into the first thing an employer
   sees. The verified record and references carry the weight without a face.
3. **Privacy defaults to private.** Open to Work, Dream Companies, and
   who-follows-whom default to private and are controlled by the person.
   `open_to_work.enabled` defaults false and is only readable by employers when
   the person turned it on, so an employer can never tell that an employed person
   is quietly job-hunting. The follow graph (`hire_follows`) is never public.
4. **Confirm authority is restricted.** Only members who can act for a verified
   org may confirm or deny, enforced in RLS via `can_confirm_for_business()`
   (owner / admin / manager / hiring roles on a verified business), never in the
   UI alone.
5. **Denial has a path.** A denied claim is not deleted. It stays `denied` and
   hidden from employers; the person can re-file once with a note. Orgs only see
   claims that named them.

### How it maps onto the existing schema

We did **not** duplicate the org layer. An "organization" is a row in
`businesses` (which already has `verified` and `account_type`), and confirm
authority sits on top of the existing `business_staff` role hierarchy. New tables
added by `supabase/migrations/*_hire_local_verification.sql`: `record_items`,
`qr_checkins`, `hire_references`, `quality_tags`, `resumes`, `open_to_work`,
`hire_follows`, `org_hire_settings`.

### QR check-in is the strongest signal

Neither side hand-enters time. `hire_qr_checkin` opens a visit; `hire_qr_checkout`
stamps the end, computes hours server-side, and produces a `volunteer_hours`
record item. It lands `pending` until an org confirmer approves it — unless that
org turned on `org_hire_settings.auto_trust_qr`, in which case a verified org's
check-out auto-verifies. The `hire-qr-checkout` edge function wraps these RPCs.

### Screens

- `/hire-local/p/:userId` — applicant profile (what an employer sees; pending and
  denied items show only in the person's own view via the `viewerIsOwner` flag).
- `/hire-local/confirm` and `/hire-local/confirm/:orgId` — org confirm queue
  (only for members who can confirm for the org).
- `/hire-local/claim` — file a claim into an org's queue.
