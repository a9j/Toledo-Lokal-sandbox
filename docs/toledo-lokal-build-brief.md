# Toledo Lokal — Build Brief

This document is the standing reference for all Claude Code work on Toledo Lokal.
Every prompt references it at the top. It defines what the product is, how the
codebase is built, and the rules that do not bend. Read it before proposing any
change.

---

## 1. What Toledo Lokal is

Toledo Lokal is civic infrastructure for the Toledo, Ohio metro area (including
Perrysburg, Maumee, and Sylvania). It is a "city operating system" — not a social
app, not a coupon platform, not a directory. It connects residents, local
businesses, food trucks, nonprofits, and schools.

Operated under MyMomentous LLC. Toledo is the proof-of-concept. The long-term
vision is to prove the model here and license or expand it to additional cities
(the multi-city concept is called Loop Lokal). Every product decision should
generate real outcome data usable as a case study for selling to other cities —
not vanity metrics.

**Positioning is load-bearing.** Every pitch, copy decision, and feature must
reinforce the civic-OS framing. If a change makes the product feel like a social
network or a deals app, it is wrong regardless of how well it works.

---

## 2. The stack

- **Frontend:** Vite + React
- **Backend:** Supabase (project ID `nnepslwwqjxfhlurwoyw`) — database, auth,
  storage, edge functions
- **Hosting:** Vercel
- **Native wrapper:** Capacitor (iOS + Android). Same React codebase runs on PWA
  and both native apps against the same Supabase backend.
- **Source of truth:** GitHub repo `toledo-lokal-fresh`
- **iOS app ID:** `com.looplokal.toledo` (future-proofed for multi-city)

### Working directory and build sequence
Working directory is `toledo-lokal-fresh`. Always pull latest before building;
treat the local folder as disposable.

iOS: `git pull` → `npm install` → `npm run build` → `npx cap sync ios` → open in
Xcode → bump build number → archive → distribute via App Store Connect. Before
archiving, confirm the camera permission flow and the account deletion flow are
intact (both have caused prior rejections).

### Key environment variables
- `VITE_BETA_WINDOW_ENABLED` — beta lockdown gate. Build-time constant injected
  by Vite. Flipping it requires an env change + Vercel redeploy. Off (or unset)
  must reopen public access with no code or DB change.
- `NEXT_PUBLIC_LP_ENABLED` — Loop Points. Off. Requires legal review before any
  launch.
- `NEXT_PUBLIC_HOME_VARIANT` — soft-launch homepage variant
- `VITE_GOOGLE_MAPS_API_KEY` — frontend, HTTP-referrer restricted
- `GOOGLE_MAPS_API_KEY` — server-side Supabase secret, IP-restricted or
  unrestricted, NEVER HTTP-referrer restricted

---

## 3. Non-negotiable engineering rules

These are hard constraints. A prompt that violates one is wrong even if it
otherwise works.

1. **Server-side enforcement.** Access gating, admin controls, and RLS policies
   are enforced at the database/server layer (Supabase RLS + Edge Functions),
   not in React alone. A client-only gate is UX, not a lock. Any change that
   extends access control must audit whether enforcement is server-side first.
   The one scoped exception in effect: during the closed beta window, general
   public-interest data (business listings, events) may rely on the client gate,
   but anything tied to an individual user (profiles, saved items, messages) and
   all Circle/cohort content must be RLS-gated.

2. **Multi-city schema hygiene.** `city_id` is a first-class concept on every
   relevant table from the start. No hard-coded city names anywhere in the
   codebase, ever.

3. **Loop Points stay separate and silent.** No LP language in any
   partner-facing or resident-facing copy — teased only vaguely as a coming
   civic rewards layer. All LP logic stays server-side and behind the flag.

4. **Reversibility of the beta gate.** Setting `VITE_BETA_WINDOW_ENABLED=false`
   and redeploying must reopen full public access with no further code or DB
   surgery. The flag governs the gate; the gate does not hard-exclude
   independent of the flag.

---

## 4. Workflow rules

- **Audit-first.** Before any code change, audit the current state and report
  findings. Do not edit, create, or delete until the plan is approved.
- **Show commands before running.** Propose exact branch names and git commands.
  Run nothing without explicit approval. No git command executes without showing
  the exact command first.
- **Change path:** GitHub → Vercel preview branch → approval → production. Every
  change is verified on a Vercel preview before it touches production.
- **Reference this brief** at the top of every prompt.

---

## 5. Product principles

- **Density-gating.** Network-effect-dependent features (leaderboards,
  neighborhood battles, social comparison, friends' activity feeds) backfire at
  low user counts. Hold them until active-user density supports them. Deploy only
  density-proof features early.
- **Empty states never name their emptiness.** Content surfaces show the most
  recent real content as fallback, never an apology message. (User-specific
  states — a user's own empty Saved list or Messages — may state the obvious;
  the rule targets content surfaces that should feel alive.)
- **Scarcity discipline.** "Founding" brand equity is intentional and finite. Do
  not dilute it with ambassador programs or open-ended founding designations.
- **Never name features before they are ready.**
- **Sponsorship over advertising.** Sponsorship (civic association, not trackable
  ads) is the highest-margin line and the fastest path to cash. Anthropic
  products are ad-free; Toledo Lokal does not run trackable ads.

---

## 6. Tier and badge structure

- **Founding 5 ("Anchor Partners")** — 5 business seats, free forever, gold
  badge, top sort priority, advisory seat, permanent origin-wall credit.
- **Founding 5 Nonprofit** — separate nonprofit anchor tier. Distinct badge from
  the business Founding 5 (visually different, e.g. different color/treatment),
  so a nonprofit anchor is never confused with a business anchor.
- **Founding 25 ("First Wave")** — replaces the former Founding 50. Permanent
  recognition, silver badge, free core access, 50% lifetime discount on add-ons,
  origin-wall credit, advisory voice. NOTE: any tier-status check in the codebase
  must use the current tier names. Legacy `founding_50` references are stale and
  should map to / be replaced by `founding_25`.
- **Civic Partner** — uncapped renewable tier for civic orgs, BIDs, neighborhood
  associations. Events-calendar rights, map presence, no Loop Points, no advisory
  seat by default.
- **Charter 100** — founding resident cohort, capped at 100. Permanent
  platform-wide badge (`charter100`). Beta-window access. Signup at `/beta` and
  `/join/charter-100`. The badge is permanent and needs no cleanup when beta ends.

---

## 7. Copy and document rules

- **No em dashes in any user-facing copy.** Enforced across all deliverables.
- **Two distinct variants** on any copy request — never a single draft, never
  templates.
- Short, punchy, mobile-friendly. Lead with relationship over platform mechanics.
- **Origin story** (Anthony's uncle Clifford / Murphy's) is reserved for
  in-person closes and selective written use. Never leads a cold email.
- **Brand system:** navy `#0F1D35`, gold `#D4A853`, blue `#3B82F6`, slate
  `#475569`, paper-grain `#FBF9F4` background. Fraunces for display headings,
  Geist Sans for body, Geist Mono for labels. Fallbacks when Google Fonts
  unavailable: DejaVu Serif / DejaVu Sans / DejaVu Sans Mono.
- **PDF production:** HTML-to-PDF via Playwright/Chromium.

---

## 8. Current state (update as it changes)

- Closed beta lockdown being wired: `VITE_BETA_WINDOW_ENABLED` + `is_beta_eligible(user)`
  gate the app for ~1 month while native apps are finished.
- Founding 5 business seats: 4 of 5 filled (Balance Grille, Jamii Cafe, Plant
  House, Toledo Hair Company). 1 remaining.
- Founding 5 Nonprofit: separate anchor tier (`founding_5_nonprofit`), teal badge.
- Founding 25 recruitment ongoing (in-person closes).
- Circles feature: platform-curated topic/neighborhood groups. End-state nav:
  Discover · Pulse · Jobs · Deals · Events · Circles.
- iOS build has an open metadata rejection; Android build in progress.
