# CLAUDE.md — ToledoLokal Reference Document

> Read this file before building anything. Every new component, page, or feature
> must match these patterns exactly. Do not deviate unless explicitly instructed.

---

## 1. Color Palette

All colors are defined as CSS custom properties (HSL) in `src/index.css` and
mapped to Tailwind tokens in `tailwind.config.ts`. Use Tailwind classes, not raw
hex values, in components.

### Brand Colors

| Token | Tailwind Class | Hex | Use |
|---|---|---|---|
| `--primary` | `text-primary` / `bg-primary` | `#203D6F` | Midnight blue — buttons, links, active nav, rings |
| `--lokal-amber` / `--accent` | `text-lokal-amber` / `bg-accent` | `#F9AB10` | Amber gold — featured badges, glow, highlights |
| `--lokal-terracotta` | `text-lokal-terracotta` | `#BE5F37` | Terracotta — rose/coral/clay (all aliases same hue) |
| `--lokal-forest` | `text-lokal-forest` | `#257F5E` | Forest green — verified, success, teal/sage (all aliases same hue) |
| `--toledo-purple` | `text-toledo-purple` | `#7B4EBC` | Purple — Loop rewards map markers |
| `--toledo-lavender` | `text-toledo-lavender` | `#A88DCE` | Lavender — soft purple tint |

### Surface & Neutral Colors

| Token | Tailwind Class | Hex | Use |
|---|---|---|---|
| `--background` | `bg-background` | `#FDFDFC` | Page background (warm white) |
| `--card` | `bg-card` | `#FFFFFF` | Card surfaces |
| `--secondary` | `bg-secondary` | `#F5F4EF` | Secondary backgrounds, chip backgrounds |
| `--muted` | `bg-muted` | `#F6F6F3` | Muted backgrounds, skeleton base |
| `--lokal-sand` | `bg-lokal-sand` | `#E9E3D8` | Sand — warm neutral surface |
| `--lokal-cream` | `bg-lokal-cream` | `#F9F8F5` | Cream — near-white warm |
| `--border` | `border-border` | `#E2E5E9` | Default borders |

### Text Colors

| Token | Tailwind Class | Hex | Use |
|---|---|---|---|
| `--foreground` | `text-foreground` | `#151C28` | Primary text (near-black navy) |
| `--muted-foreground` | `text-muted-foreground` | `#6C7689` | Secondary/placeholder/caption text |
| `--primary-foreground` | `text-primary-foreground` | `#FFFFFF` | Text on primary backgrounds |

### Semantic Colors

| Token | Tailwind Class | Hex | Use |
|---|---|---|---|
| `--destructive` | `text-destructive` / `bg-destructive` | `#D22D2D` | Errors, delete actions |
| `--success` | `text-success` / `bg-success` | `#2C966F` | Success states |
| `--warning` | `text-warning` | `#F9AB10` | Warnings (same as amber) |

### Dark Mode

Dark mode is fully supported. All tokens are redefined under `.dark` in
`src/index.css`. Key overrides:
- `--primary` → `#5E86CA` (lighter blue)
- `--background` → `#0D1017`
- `--card` → `#141A24`

### Color Rules

- **Never use raw hex values in components.** Always use Tailwind token classes.
- **Never use `opacity-*` to lighten a color** when a `/10`, `/15`, `/20` Tailwind
  opacity modifier exists (e.g. `bg-primary/10` not `bg-primary opacity-10`).
- **Alpha tints for icon containers:** `bg-primary/10`, `bg-primary/15`
- **Alpha tints for hover states:** `hover:bg-primary/5`, `hover:bg-muted/50`
- **Aliases:** `toledo-coral = toledo-rose = toledo-clay = lokal-terracotta` (same hex).
  `toledo-teal = toledo-sage = lokal-forest` (same hex). Use the `lokal-*` prefix
  for new code.

---

## 2. Typography

### Fonts

| Font | Weights | Role | How to Apply |
|---|---|---|---|
| **Plus Jakarta Sans** | 400, 500, 600, 700, 800 | Body — all default UI text | Applied to `body` in CSS. This is the default. |
| **Space Grotesk** | 500, 600, 700 | Display headings only | `font-display` Tailwind class or `.heading-display` CSS class |

> **Important:** `tailwind.config.ts` declares `font-sans: ['DM Sans']` but DM Sans
> is never loaded. The `body` CSS rule overrides it with Plus Jakarta Sans. Do not
> use `font-sans` class — it will fall back to system fonts. Just use the default
> (no class) for Plus Jakarta Sans, or `font-display` for Space Grotesk.

Loaded in `index.html` via Google Fonts (async, non-blocking).

Global body settings: `letter-spacing: -0.01em`

### Text Size Scale (standard Tailwind, no custom overrides)

| Class | Size | px | Line Height |
|---|---|---|---|
| `text-xs` | 0.75rem | 12px | 1rem |
| `text-sm` | 0.875rem | 14px | 1.25rem |
| `text-base` | 1rem | 16px | 1.5rem |
| `text-lg` | 1.125rem | 18px | 1.75rem |
| `text-xl` | 1.25rem | 20px | 1.75rem |
| `text-2xl` | 1.5rem | 24px | 2rem |
| `text-3xl` | 1.875rem | 30px | 2.25rem |
| `text-4xl` | 2.25rem | 36px | 2.5rem |

### Typography Usage Conventions

| Context | Size | Weight | Notes |
|---|---|---|---|
| Page titles | `text-2xl` | `font-bold` | |
| Brand name "ToledoLokal" | `text-xl` | `font-bold` | Primary-colored suffix |
| Card headings | `text-base`–`text-lg` | `font-semibold` | |
| Body / descriptions | `text-sm` | `font-normal` | |
| Secondary labels | `text-xs` | `font-medium` | |
| Section labels | `text-xs` | `font-semibold` | `uppercase tracking-[0.08em]` |
| Display headings | `text-3xl md:text-4xl` | `font-bold` | Space Grotesk, `letter-spacing: -0.02em` |
| Badge / chip text | `text-xs` | `font-semibold` | |
| Nav tab labels | `text-[10px]` | `font-medium` (inactive) / `font-semibold` (active) | |

---

## 3. Component Naming Conventions

### File & Component Naming

- **Pages:** PascalCase, single word or compound — `Today.tsx`, `BusinessDetail.tsx`,
  `DashboardLeads.tsx`
- **Components:** PascalCase, named export — `export function PulseFeed()`
- **Hooks:** camelCase with `use` prefix — `useAuth`, `useDailyDrop`, `usePulse`
- **Contexts:** PascalCase provider + hook — `AuthProvider` / `useAuth()`
- **Utilities/lib:** camelCase — `subscription-tiers.ts`, `pulse-config.ts`
- **UI primitives:** `src/components/ui/` — shadcn convention, always lowercase filename

### Import Path Convention

Always use the `@/` alias, never relative paths:
```ts
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
```

### Component Organization

```
src/
  pages/           # Route-level page components (one per route)
  components/
    layout/        # Header, BottomNav, PageContainer
    ui/            # shadcn primitives (button, card, dialog, etc.)
    business/      # Business-specific components
    pulse/         # Pulse feed components
    loop/          # Loop rewards components
    profile/       # Profile-related components
    today/         # Daily drop components
    onboarding/    # Onboarding flow components
    chat/          # AskToledo AI widget
    seo/           # SEO head component
  contexts/        # React contexts
  hooks/           # Custom hooks
  lib/             # Config, utilities, schemas
  integrations/
    supabase/      # client.ts + types.ts
  assets/          # Static assets (logo, images)
```

### Shadcn vs Custom Components

- **Use shadcn** for: Button, Input, Dialog, Sheet, Tabs, Badge, Select, Switch,
  Textarea, Label, Skeleton, Separator, Avatar, Tooltip, Popover, DropdownMenu
- **Never use shadcn `<Card>`** for app cards — use `.card-elevated` or
  `.card-elevated-lg` CSS classes instead
- **Custom components** extend or wrap shadcn with app-specific styling

---

## 4. Design Rules

### Border Radius

| Tailwind Class | Value | Use |
|---|---|---|
| `rounded-lg` | `0.875rem` (14px) | shadcn default |
| `rounded-xl` | `0.75rem` (12px) | Buttons, inputs, icon containers, small cards |
| `rounded-2xl` | `1rem` (16px) | Standard cards (`.card-elevated`) |
| `rounded-3xl` | `1.5rem` (24px) | Large cards (`.card-elevated-lg`) |
| `rounded-full` | 50% | Badges, pills, avatars, dots |

> **Rule:** Buttons in the actual app use `rounded-xl`, not the shadcn default
> `rounded-md`. Always override to `rounded-xl` on interactive elements.

### Shadow Styles

**Do not use Tailwind's built-in shadows (`shadow-sm`, `shadow-md`).** Use these:

```css
/* Standard card — use .card-elevated class */
box-shadow:
  0 1px 2px 0 rgba(0, 0, 0, 0.03),
  0 4px 12px -2px rgba(0, 0, 0, 0.04);

/* Large card — use .card-elevated-lg class */
box-shadow:
  0 2px 4px 0 rgba(0, 0, 0, 0.02),
  0 8px 24px -4px rgba(0, 0, 0, 0.06);

/* Hover lift — use .hover-lift class */
box-shadow:
  0 4px 8px 0 rgba(0, 0, 0, 0.03),
  0 16px 32px -8px rgba(0, 0, 0, 0.10);

/* Amber glow (Loop/featured) */
box-shadow: 0 0 20px -4px hsla(40, 95%, 52%, 0.35);

/* Custom Tailwind tokens */
shadow-soft       /* 0 2px 8px -2px rgba(0,0,0,0.08) */
shadow-soft-lg    /* 0 8px 24px -4px rgba(0,0,0,0.10) */
shadow-glow-amber /* 0 0 20px -5px hsla(38,90%,55%,0.4) */
```

### Spacing Patterns

- **Page horizontal padding:** `px-4`
- **Page top padding:** `pt-safe-top` (iOS safe area)
- **Page bottom padding:** `pb-24` (clears bottom nav) or `pb-20`
- **Card internal padding:** `p-4` (standard), `p-5` (large/prominent), `p-6` (modal)
- **Section gaps:** `space-y-4` (tight), `space-y-5` (standard), `space-y-6` (loose)
- **Between content sections:** `mb-6`
- **Max content width:** `max-w-lg mx-auto` — enforced by `<PageContainer>`

### Glass Effect (Headers & Nav)

```css
/* Both Header and BottomNav use this pattern */
background: rgba(255, 255, 255, 0.85);  /* bg-background/85 */
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid rgba(border, 0.50);   /* border-border/50 */
```

### Card Anatomy Pattern

The vast majority of action rows follow this exact structure:
```jsx
<div className="card-elevated flex items-center gap-3 p-4">
  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
    <Icon className="h-6 w-6 text-primary" />
  </div>
  <div className="flex-1 min-w-0">
    <h3 className="font-semibold text-foreground">Title</h3>
    <p className="text-sm text-muted-foreground">Subtitle</p>
  </div>
  <ChevronRight className="h-5 w-5 text-muted-foreground" />
</div>
```

### Icon Containers

| Size | Classes | When |
|---|---|---|
| Small | `w-10 h-10 rounded-xl` | Nav buttons, header icons |
| Medium | `w-12 h-12 rounded-xl` | Card leading icons |
| Large | `w-14 h-14 rounded-2xl` | Feature/hero icons |

All icons from **lucide-react** exclusively. Icon sizes: `h-4 w-4` (xs), `h-5 w-5` (sm), `h-6 w-6` (md).

### Animation Classes

| Class | Effect | Use |
|---|---|---|
| `animate-fade-in-up` | Fade + slide up 8px | Content entry, stagger with `style={{ animationDelay: '100ms' }}` |
| `animate-scale-in` | Fade + scale from 96% | Modal/card appear |
| `animate-pulse` | Opacity pulse | Skeleton loading |
| `animate-glow` | Amber box-shadow pulse | Loop/featured elements |
| `animate-float` | Gentle vertical float | Hero elements |
| `hover-lift` | translateY(-4px) on hover | Interactive cards |
| `hover-scale` | scale(1.02) on hover | Thumbnail images |

### Stagger Pattern for Lists

```jsx
{items.map((item, i) => (
  <div
    key={item.id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${i * 100}ms` }}
  >
    ...
  </div>
))}
```

### Button Size Overrides

The shadcn default sizes are overridden in actual usage. Use these:

| Context | Classes |
|---|---|
| Primary CTA (full width) | `w-full h-12 rounded-xl text-base font-medium` |
| Header icon button | `h-9 w-9 rounded-xl hover:bg-muted` |
| Header small button | `text-xs rounded-xl h-8 px-3` |
| Standard icon button | `size="icon"` (h-10 w-10) |

---

## 5. Supabase Table Structure

### Core Tables

**`profiles`** — One per auth user
- `user_id` (uuid, FK auth) · `name` · `avatar_url` · `neighborhood_id` · `favorite_categories` (text[]) · `role_selected` (bool) · `profile_completed` (bool)

**`user_roles`** — Role assignments (user can have multiple)
- `user_id` · `role` (enum: `resident|business|admin|organizer|nonprofit|partner|connector`)

**`user_preferences`** — Settings and onboarding state
- `user_id` · `pulse_visibility` · `user_pulse_enabled` · `interests` (text[]) · `is_newcomer` · `preferred_neighborhoods` (text[])

**`businesses`** — Primary business record
- `id` · `owner_user_id` · `name` · `slug` · `category_id` · `neighborhood_id`
- `description` · `story` · `address` · `phone` · `website` · `instagram` · `tiktok` · `facebook`
- `logo_url` · `cover_image_url` · `profile_picture_url` · `photos` (text[]) · `editor_pick_image`
- `hours` (Json: `{monday: {open, close, closed}, ...}`)
- `status` (`pending|approved|rejected`) · `featured` · `verified`
- `average_rating` · `review_count` (both denormalized)
- `tier_status` · `tier_badge_visible` · `onboarding_step` (1–5) · `onboarding_completed`

**`categories`** — `id` · `name` · `icon`

**`neighborhoods`** — `id` · `name`

### Loop System Tables

**`loop_wallets`** — One per user
- `user_id` · `points_balance` · `lifetime_earned` · `lifetime_redeemed` · `lifetime_donated` · `is_frozen`

**`loop_transactions`** — Every point movement
- `wallet_id` · `business_id` · `points` · `transaction_type` (enum: `earn|redeem|donate|bonus|refund|expire`) · `source_event` · `qr_code_id` · `mission_id`

**`loop_point_batches`** — Expiring batches (FIFO, 90-day expiry)
- `wallet_id` · `original_amount` · `remaining_amount` · `expires_at` · `status`

**`business_loop_settings`** — 1:1 with business
- `business_id` · `loop_tier_id` · `is_active` · `is_founding_member` · `is_founding_50` · `points_issued_this_month` · `wallet_frozen`

**`loop_tiers`** — `id` · `name` · `points_cap_monthly` · `price_monthly` · `stripe_price_id`

**`loop_qr_codes`** — Business QR codes
- `business_id` · `qr_type` (enum: `visit|job_complete|referral|event|campaign`) · `points_value` · `is_active` · `scan_cooldown_hours` · `requires_staff_confirm`

**`loop_qr_scans`** — `qr_code_id` · `user_id` · `status` · `staff_confirmed_at` · `transaction_id`

**`loop_rewards`** — `business_id` · `name` · `points_cost` · `category` (enum: `perk|experience|service_credit`) · `is_active` · `quantity_available`

**`loop_redemptions`** — `user_id` · `reward_id` · `transaction_id` · `redemption_code` · `status`

**`loop_missions`** — `title` · `mission_type` · `points_reward` · `required_count` · `target_businesses` (uuid[]) · `sponsor_business_id`

**`loop_mission_progress`** — `user_id` · `mission_id` · `progress_count` · `businesses_visited` (uuid[]) · `completed_at`

**`loop_causes`** — Nonprofits for LP donation: `name` · `category` · `points_donated`

**`loop_donations`** — `user_id` · `cause_id` · `points_amount` · `transaction_id`

**`loop_bursts`** — Time-limited bonus events: `business_id` · `burst_type` · `multiplier` · `starts_at` · `ends_at`

### Content Tables

**`pulse_posts`** — `user_id` · `business_id` · `category` (enum: `right_now|heads_up|energy_check|community_ask|good_stuff`) · `content` (≤140 chars) · `expires_at` · `status` · `helpful_count` · `is_pinned` · `location_text`

**`daily_drops`** — `drop_date` · `title` · `status` · `publish_time`

**`daily_drop_highlights`** → FK daily_drops: `highlight_type` · `title` · `subtitle` · `icon` · `link_url` · `sort_order`

**`daily_drop_spotlights`** → FK daily_drops + businesses: `spotlight_type` · `custom_headline` · `sort_order`

**`daily_drop_moments`** → FK daily_drops: `title` · `description` · `image_url` · `link_url`

**`deals`** → FK businesses: `title` · `description` · `start_date` · `end_date` · `status` · `featured` · `redemption_method`

**`events`** → FK businesses/connectors: `title` · `start_date_time` · `end_date_time` · `location_text` · `ticket_url` · `status` · `featured`

**`event_tickets`** → FK events: `name` · `price` · `quantity_available` · `stripe_price_id`

**`jobs`** → FK businesses: `title` · `job_type` · `pay_min` · `pay_max` · `apply_method` · `hiring_now` · `status`

**`food_truck_locations`** → FK businesses: `location_date` · `location_name` · `start_time` · `end_time` · `latitude` · `longitude`

**`reviews`** → FK businesses: `user_id` · `rating` (1–5) · `title` · `content` · `helpful_count`

**`saved_items`** — `user_id` · `item_id` · `item_type` (polymorphic) · `note` · `sort_order`

**`requests`** — `created_by_user_id` · `title` · `category_id` · `neighborhood_id` · `budget_min` · `budget_max` · `needed_by_date_time`

**`leads`** → FK businesses: `user_id` · `type` · `name` · `contact_info` · `message` · `status`

### Other Tables

**`nonprofits`** — `name` · `mission_statement` · `cause_category` · `slug` · `logo_url` · `claimed` · `status` · `neighborhood_id`

**`connectors`** — `user_id` · `referral_code` · `referral_slug` · `tier` · `revenue_share_rate` · `is_founding`

**`challenges`** — `title` · `required_visits` · `badge_icon` · `badge_color` · `start_date` · `end_date`

**`challenge_progress`** → FK challenges + businesses: `user_id` · `visited_at`

**`tours`** — `title` · `difficulty` · `distance_miles` · `duration_minutes` · `neighborhood_id`

**`tour_stops`** → FK tours + businesses: `title` · `stop_order` · `deal_text` · `tip`

**`admin_audit_logs`** — `admin_user_id` · `action` · `table_name` · `record_id` · `ip_address`

**`tier_change_log`** → FK businesses: `changed_by` · `previous_tier` · `new_tier` · `reason`

**`ai_chat_usage`** — `user_id` · `usage_date` · `message_count` (rate limiting)

### Views (always use these in frontend queries)

| View | Purpose |
|---|---|
| `businesses_public` | Masks `phone` for unauthenticated users. **Use this, not `businesses` directly.** |
| `nonprofits_public` | Strips email/phone from nonprofit records |
| `leads_safe` | Truncates message to preview, hides contact_info |
| `profiles_public` | Only `id`, `name`, `avatar_url` — safe for public display |

### Key RPC Functions

| Function | Purpose |
|---|---|
| `get_or_create_loop_wallet(p_user_id)` | Create wallet on first load |
| `issue_loop_points(...)` | Award LP to user |
| `redeem_loop_points(p_reward_id, p_user_id)` | Redeem LP for reward |
| `get_business_saved_count(business_id)` | Count saves/bookmarks |
| `get_neighborhood_popularity(neighborhood_id)` | Neighborhood engagement count |
| `generate_business_slug(business_name)` | Auto-generate URL slug |
| `has_role(_role, _user_id)` | Role check |
| `mask_phone(phone_number)` | Phone masking for public view |
| `check_*_rate_limit(...)` | Rate limit guards for AI, leads, posts, reviews |

---

## 6. All Pages & Routes

**Router:** React Router v7, BrowserRouter, flat routes (no nested layouts).
**Loading:** `Today` (`/`) is eagerly loaded. All other pages are lazy-loaded.

### Primary Navigation

| Path | Page File | Auth Required |
|---|---|---|
| `/` | `Today.tsx` | No (eager) |
| `/near-me` | `NearMe.tsx` | No |
| `/discover` | `Discover.tsx` | No |
| `/pulse` | `Pulse.tsx` | No (post requires auth) |
| `/loop` | `Loop.tsx` | Yes |

### Auth & Onboarding

| Path | Page File | Notes |
|---|---|---|
| `/auth` | `Auth.tsx` | Sign in / sign up |
| `/role-select` | `RoleSelect.tsx` | New user — step 1 |
| `/profile-setup` | `ProfileSetup.tsx` | New user — step 2 (residents only) |
| `/business-onboarding` | `BusinessOnboarding.tsx` | 5-step business creation wizard |

### User Pages

| Path | Page File | Auth |
|---|---|---|
| `/profile` | `Profile.tsx` | Yes |
| `/saved` | `Saved.tsx` | Yes |
| `/my-toledo` | `MyToledo.tsx` | Yes |
| `/c/:slug` | `PublicCollection.tsx` | No |
| `/requests` | `Requests.tsx` | Yes |

### Business Pages

| Path | Page File | Auth |
|---|---|---|
| `/business/:id` | `BusinessDetail.tsx` | No |
| `/business/:id/edit` | `EditBusiness.tsx` | Yes (owner) |
| `/create-business` | `CreateBusiness.tsx` | Yes |

### Business Dashboard

| Path | Page File |
|---|---|
| `/dashboard` | `Dashboard.tsx` |
| `/dashboard/qr-codes` | `BusinessQRCodes.tsx` |
| `/dashboard/rewards` | `BusinessRewards.tsx` |
| `/dashboard/pending-scans` | `PendingScans.tsx` |
| `/dashboard/staff` | `DashboardStaff.tsx` |
| `/dashboard/subscription` | `Subscription.tsx` |
| `/dashboard/deals` | `DashboardDeals.tsx` |
| `/dashboard/events` | `DashboardEvents.tsx` |
| `/dashboard/leads` | `DashboardLeads.tsx` |
| `/dashboard/boost` | `DashboardBoost.tsx` |
| `/dashboard/jobs` | `DashboardJobs.tsx` |
| `/dashboard/food-truck` | `DashboardFoodTruck.tsx` |

### Loop / QR

| Path | Page File | Notes |
|---|---|---|
| `/loop` | `Loop.tsx` | Wallet, missions, rewards, causes |
| `/loop-wallet` | `LoopWallet.tsx` | Alias — full wallet + QR |
| `/wallet` | `LoopWallet.tsx` | Second alias |
| `/scan/:qrCodeId` | `ScanQR.tsx` | Deep-link QR scan handler |
| `/scanner-mode` | `ScannerMode.tsx` | Staff scanner (BottomNav hidden) |

### Content & Discovery

| Path | Page File |
|---|---|
| `/pulse/:pulseId` | `PulseDetail.tsx` |
| `/events` | `Events.tsx` |
| `/events/:id` | `EventDetail.tsx` |
| `/deals` | `Deals.tsx` |
| `/jobs` | `Jobs.tsx` |
| `/food-today` | `FoodToday.tsx` |
| `/tours` | `Tours.tsx` |
| `/challenges` | `Challenges.tsx` |
| `/stories` | `Stories.tsx` |
| `/stories/create` | `CreateStory.tsx` |
| `/explore` | `Explore.tsx` |
| `/feed` | `Feed.tsx` |
| `/community` | `Community.tsx` |
| `/community/:slug` | `NonprofitDetail.tsx` |

### Connectors & Admin

| Path | Page File | Access |
|---|---|---|
| `/connector/:slug` | `ConnectorProfile.tsx` | Public |
| `/connector-dashboard` | `ConnectorDashboard.tsx` | `isConnector` only |
| `/admin` | `Admin.tsx` | `isAdmin` only |
| `/admin/businesses` | `AdminBusinesses.tsx` | `isAdmin` only |

### Utility

| Path | Page File |
|---|---|
| `/business-guide` | `BusinessGuide.tsx` |
| `/founding-5-guide` | `Founding5Guide.tsx` |
| `/subscription` | `Subscription.tsx` |
| `/accept-invitation` | `AcceptInvitation.tsx` |
| `*` | `NotFound.tsx` |

**BottomNav hidden on:** `/auth`, `/scanner-mode`, `/accept-invitation`

**Persistent UI (outside Routes):** `<AskToledoChat />` (lazy), `<InstallPrompt />`

---

## 7. Business Tier Structure

These are the subscription tiers for businesses on ToledoLokal:

### Tier Definitions

| Tier | Price | Deals | Events | Jobs | Pulse Posts/Day | Pinned Pulse | Loop Points/Month | Featured |
|---|---|---|---|---|---|---|---|---|
| **Free** | $0/mo | 0 | 0 | 1 | 1 | 0 | 0 | No |
| **Local Supporter** | $25/mo | 1/mo | 0 | Unlimited | 3 | 0 | 500 LP | No |
| **Featured Local** | $75/mo | Unlimited | Unlimited | Unlimited | 5 | 1/day | 2,000 LP | Category featured |
| **Anchor Partner** | $150/mo | Unlimited | Unlimited | Unlimited | 10 | 3/day | 5,000 LP | Homepage featured |

### Tier Details

**Free — $0/month**
- Basic business listing in directory
- 1 active job post
- 1 Pulse post per day (no pinning)
- No deals or events
- No Loop rewards participation
- Business profile with all standard fields

**Local Supporter — $25/month**
- Everything in Free
- 1 deal per month
- 3 Pulse posts per day
- Loop Starter: 500 LP to issue monthly
- Loop QR code (visit type)

**Featured Local — $75/month**
- Everything in Local Supporter
- Unlimited deals and events
- 5 Pulse posts per day + 1 pinned post per day
- Loop Growth: 2,000 LP to issue monthly
- All QR code types
- Featured placement within category

**Anchor Partner — $150/month**
- Everything in Featured Local
- 10 Pulse posts per day + 3 pinned posts per day
- Loop Partner: 5,000 LP to issue monthly
- Homepage featured placement
- Priority in search and Near Me
- Boost credits included

### Special Programs

**Founding 5** (max 5 businesses, invitation only)
- Free forever
- 30,000 LP/month
- Homepage featured permanently
- All features unlocked

**Founding 50** (max 50 businesses)
- 50% discount on any paid tier
- 15,000 LP/month bonus
- Founding badge on profile

### Tier in Code

- Tier stored in `businesses.tier_status` (string)
- Loop allocation in `business_loop_settings.loop_tier_id` → `loop_tiers` table
- Founding flags: `business_loop_settings.is_founding_member` and `is_founding_50`
- Tier visibility badge: `businesses.tier_badge_visible`
- Tier change history: `tier_change_log` table
- Tier config in `src/lib/subscription-tiers.ts`

---

## 8. Auth Setup

- **Provider:** Supabase Auth, email/password only. No OAuth.
- **Session:** Persisted in `localStorage`, JWT auto-refreshed.
- **Roles:** Stored in `user_roles` table (not JWT). Fetched after `onAuthStateChange`.
- **Hook:** `useAuth()` from `src/contexts/AuthContext.tsx`
- **Exposed:** `user`, `session`, `roles`, `isLoading`, `isAdmin`, `isBusiness`,
  `isNonprofit`, `isPartner`, `isOrganizer`, `isConnector`, `hasRole()`,
  `signIn()`, `signUp()`, `signOut()`
- **Guards:** Imperative per-page (`if (!user) navigate('/auth'); return null;`)
- **New user flow:** `/` → `/role-select` → `/profile-setup` → `/`

---

## 9. Key Patterns — Always Follow These

### Querying Supabase

```ts
// Always use businesses_public, not businesses
const { data } = await supabase
  .from('businesses_public')
  .select('*, category:categories(name), neighborhood:neighborhoods(name)')
  .eq('status', 'approved');

// React Query pattern
const { data, isLoading } = useQuery({
  queryKey: ['key', dependency],
  queryFn: async () => { ... },
  enabled: !!user,  // gate on auth if needed
});
```

### Image Handling

```tsx
// Always use SecureImage for Supabase storage images
import { SecureImage } from '@/components/ui/secure-image';
<SecureImage src={business.logo_url} alt={business.name} className="..." />

// SecureImage handles: external URLs, signed URLs, storage paths
// Never use <img> directly for user-uploaded content
```

### Toast Notifications

```ts
// Use sonner (preferred for new code)
import { toast } from 'sonner';
toast.success('Done!');
toast.error('Something went wrong.');

// Legacy hook (existing code uses this — don't replace, just be consistent within a file)
import { useToast } from '@/hooks/use-toast';
const { toast } = useToast();
toast({ title: 'Done', description: '...' });
```

### Route Protection Pattern

```tsx
// Every protected page — put this before any hooks that need user data
const { user, isAdmin } = useAuth();
const navigate = useNavigate();

if (!user) {
  navigate('/auth');
  return null;
}
```

### Loading Skeleton Pattern

```tsx
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-36 rounded-2xl animate-pulse" />
    <Skeleton className="h-52 rounded-2xl animate-pulse" style={{ animationDelay: '100ms' }} />
    <Skeleton className="h-40 rounded-2xl animate-pulse" style={{ animationDelay: '200ms' }} />
  </div>
) : data ? (
  <ActualContent />
) : (
  <EmptyState />
)}
```

### Page Layout Pattern

```tsx
export default function MyPage() {
  return (
    <>
      <SEOHead title="Page Title | ToledoLokal" description="..." />
      <Header title="Page Title" showBack />
      <PageContainer className="space-y-6 pb-20">
        {/* content */}
      </PageContainer>
    </>
  );
}
```

---

## 10. What NOT To Do

- **Don't** use raw hex color values in components — use Tailwind tokens
- **Don't** use shadcn `<Card>` — use `.card-elevated` div instead
- **Don't** use Tailwind's built-in shadows (`shadow-sm`, `shadow-md`, etc.)
- **Don't** use the `font-sans` Tailwind class (DM Sans isn't loaded)
- **Don't** query the `businesses` table directly from the frontend — use `businesses_public`
- **Don't** use `<img>` for user-uploaded Supabase storage images — use `<SecureImage>`
- **Don't** add a `getSession()` call alongside `onAuthStateChange` — it's redundant
- **Don't** use relative import paths — always use `@/` alias
- **Don't** create new toast systems — use `sonner` for new code
- **Don't** round corners with `rounded-md` on interactive UI elements — use `rounded-xl`
- **Don't** use inline styles for colors or spacing that have Tailwind equivalents
- **Don't** add features, error handling, or abstractions not explicitly requested
