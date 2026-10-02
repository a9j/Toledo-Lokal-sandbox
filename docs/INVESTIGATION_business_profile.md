# Investigation Report — Business Profile, Founding Tiers, Messaging & Roles

## ⚠️ First, an important correction about the route

There is **no `/b/{slug}` route** in this app. The public business profile renders at **`/business/:id`** (`src/App.tsx:162` → `BusinessDetail`). That `:id` param accepts **either a UUID or a slug** — `BusinessDetail.tsx:54` tests whether it looks like a UUID and queries the `businesses_public` view by `id` or `slug` accordingly (`src/pages/BusinessDetail.tsx:67-70`). So the page you mean is `/business/{slug}`.

---

## 1. The business profile page & where each element renders

**Page:** `src/pages/BusinessDetail.tsx` — composed of redesign components in `src/components/business/profile/redesign/`.

### QR contact code — NOT on the profile page
The QR code component is `src/components/qr/ContactQRCode.tsx`. It is **not rendered anywhere on the public `/business/...` profile.** It only appears in:
- `src/components/admin/console/FoundingContactCards.tsx:70` (admin console — one printable card per founding business)
- `src/pages/BusinessQRCodes.tsx`, `BusinessOnboarding.tsx`, `AdminBusinesses.tsx`, `IdentityCard.tsx`, `BusinessCard.tsx`

The QR encodes a **`/save/:id`** contact link (`FoundingContactCards.tsx:63`), which opens `src/pages/SaveContact.tsx` (save-to-contacts / vCard flow). Its own comment even says it's "Used in the admin console to print one card per Founding 25 business" (`ContactQRCode.tsx:18-19`).
> If the task is to put the QR on the profile, note it currently isn't there.

### "Menu" tab
- Rendered/gated in `src/pages/BusinessDetail.tsx:252-269`. The tab is **hidden** unless the business's profile category is a food category: `hiddenTabs` pushes `'menu'` out for non-food businesses (line 257).
- Food categories are defined in `src/lib/business-profile-config.ts:22`: `FOOD_BUSINESS_CATEGORIES = ['restaurant', 'food_truck']`.
- The tab body is `src/components/business/profile/redesign/MenuTab.tsx`, which reads via the `useMenuItems(businessId)` hook.

### Founding tier badges
Two places:
- **In the hero**, hardcoded inline badges: `src/components/business/profile/redesign/ProfileHero.tsx:94-103` — shows a gold "Founding 5" badge if `business.isFoundingMember`, or a silver **"Founding 25"** badge when `tierStatus === 'founding_50'`.
- **The reusable badge components**: `src/components/business/TierBadge.tsx` (`TierBadge` and `TierLabel`). `TierLabel` is also rendered in the hero at `ProfileHero.tsx:108-112`.
- The `isFoundingMember` / `isFounding50` flags come from the `business_loop_settings` row (`BusinessDetail.tsx:93-118`), separate from `tier_status`.

---

## 2. `businesses` table — founding tier & menu/food columns

**Founding tier column: `businesses.tier_status`** (text). Allowed values are enforced by the `validate_tier_status()` trigger (`supabase/migrations/20260616000000_civic_partner_tier.sql:11`):

```
'founding_5' | 'founding_50' | 'community' | 'growth' | 'pro' | 'civic_partner'
```

> 🔑 **Naming gotcha:** the **"Founding 25"** label on screen maps to the stored value **`founding_50`** (see `TierBadge.tsx:21-29` and `ProfileHero.tsx:99-103`). There is no `founding_25` value. "Founding 5" = `founding_5`.

Related founding/tier columns on `businesses` (added in `supabase/migrations/20260526000000_founding_5_schema.sql:13-22`):
- `founding_number` (int) — permanent position No.
- `founding_quote` (text)
- `owner_name`, `owner_image_url` (text)
- `tier_badge_visible`, `tier_assigned_at` (selected in `BusinessDetail.tsx:40-41`)
- `plan` (text, default `'basic'`) — separate billing flag (`foundation.sql:161`)

**Menu / food / drinks:** there is **no menu/food/drinks flag column on `businesses`.** Instead:
- Menu data lives in a separate table **`menu_items`** (`supabase/migrations/20260531000000_menu_items.sql`): `id, business_id, name, description, price_cents, image_url, category, is_available, sort_order, created_at`.
- Whether a business "is food" is **derived from its category**, not a column — via `FOOD_BUSINESS_CATEGORIES = ['restaurant', 'food_truck']` (the `category` enum column, aliased `business_category` in `BusinessDetail.tsx:46`). Food-truck detection also keys off the category name/icon (`BusinessDetail.tsx:104`).

---

## 3. Messaging send logic & RLS

There is **only one messaging system, and it is admin → business-owner only.** There is **no consumer-to-business messaging and no `threads`/`conversations` tables anywhere** in the schema.

**Table: `owner_messages`** (`supabase/migrations/20260524000000_owner_messages.sql`):
`id, sender_id, recipient_id, business_id, subject, body, is_broadcast, emailed, read_at, created_at`.

**Send logic:** edge function `supabase/functions/send-owner-message/index.ts`:
- Requires a valid auth token, then **checks the caller has the `admin` role** in `user_roles` — non-admins get 403 (lines 62-68).
- Supports `mode: 'broadcast'` (all owners, optionally filtered by `tier_status`) or single recipient.
- Inserts one `owner_messages` row per recipient (line 119) and emails via Resend.

**RLS policies on `owner_messages`** (migration lines 21-36):
- `"Admins manage all owner messages"` — `FOR ALL`, `has_role(auth.uid(),'admin')` (read/write everything).
- `"Recipients can view their messages"` — `FOR SELECT`, `recipient_id = auth.uid()`.
- `"Recipients can update their messages"` — `FOR UPDATE`, `recipient_id = auth.uid()` (to mark read).
- No INSERT policy for normal users — inserts happen via the edge function using the service-role key.

---

## 4. Consumer vs business vs admin in the data model

Roles are stored in a dedicated **`user_roles`** table (`user_id`, `role`), separate from `profiles` for security (`supabase/migrations/20260108022029_...sql:32-37`). `role` is the **`app_role` enum**.

- `app_role` originally: `('resident', 'business', 'admin')` (same migration, line 2).
- Later extended via `ALTER TYPE ... ADD VALUE`: `organizer`, `nonprofit`, `partner`, `connector`, plus `super_admin`, `city_admin`, `moderator`, `ambassador`, `support_staff`.

**There is no literal "consumer" role — the consumer/resident account is `'resident'`.** Every new user gets `'resident'` by default: the `handle_new_user()` trigger inserts a `profiles` row + a `user_roles` row with `role = 'resident'` (`20260108205023_...sql:12-13`; default also set on the column at line 35 of the first migration).

- **Business account:** the `'business'` role is **not** assigned at signup. It's added when a user creates a business — `src/pages/CreateBusiness.tsx:114` and `:120-122` upsert/insert `user_roles` with `role: 'business'`. Ownership itself is tracked by `businesses.owner_user_id` (plus `business_staff` / `business_admins` for managers).
- **Admin:** `role = 'admin'`, checked everywhere via the SQL `has_role(auth.uid(), 'admin')` function (`20260108022029_...sql:181`) and in the client via `AuthContext`.

**Client side:** `src/contexts/AuthContext.tsx` fetches all of a user's `user_roles` (line 36-39) and exposes booleans `isAdmin`, `isBusiness`, `isNonprofit`, etc. (lines 121-126). Its `AppRole` type lists `'resident' | 'business' | 'admin' | 'organizer' | 'nonprofit' | 'partner' | 'connector'` (line 6) — note it doesn't include the admin sub-roles. A user can hold **multiple** roles simultaneously (`UNIQUE (user_id, role)`).
