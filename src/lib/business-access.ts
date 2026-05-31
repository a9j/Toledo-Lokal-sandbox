// Centralized business-dashboard access rules.
//
// These small predicates decide which dashboard features a business can see,
// based on its `business_category` enum and `tier_status` (plan). Keep the
// checks here so the gating stays consistent across the dashboard, sub-pages,
// and profile actions instead of being re-derived with ad-hoc string compares.
//
// NOTE on naming: the schema has no `business_type`/`plan` columns. The real
// column is `category` (enum `business_category`) and the plan is `tier_status`
// (default `community`). The "free" plan is `community` — the partner guide's
// "Visible Only" tier.

import type { BusinessCategory } from './profile-modules';
import { FOOD_BUSINESS_CATEGORIES } from './business-profile-config';

/**
 * Categories that get a Menu (food/drink businesses).
 *
 * The task asked for `food_truck | restaurant | cafe`, but the real
 * `business_category` enum has no `cafe` (or `service`/`other`) value, so the
 * food/drink set is `restaurant` + `food_truck`. We reuse the existing
 * `FOOD_BUSINESS_CATEGORIES` constant that already drives the public profile's
 * Menu tab, so the dashboard and the public profile agree.
 */
export const MENU_CATEGORIES: readonly BusinessCategory[] = FOOD_BUSINESS_CATEGORIES;

export const canHaveMenu = (category?: BusinessCategory | string | null): boolean =>
  !!category && (MENU_CATEGORIES as readonly string[]).includes(category);

/** Food-truck-only features: current location, "Open now", schedule editor. */
export const isFoodTruckCategory = (category?: BusinessCategory | string | null): boolean =>
  category === 'food_truck';

/**
 * Loop gate. The free ("Community") plan is "Visible Only" per the partner
 * guide: 0 Loop Points and no Loop participation. Every paid plan
 * (growth, pro, founding_5, founding_50) gets Loop. A missing/unknown
 * tier_status is treated as free.
 */
export const FREE_TIER_STATUS = 'community';

export const isFreeTier = (tierStatus?: string | null): boolean =>
  !tierStatus || tierStatus === FREE_TIER_STATUS;

export const loopEnabled = (tierStatus?: string | null): boolean => !isFreeTier(tierStatus);

/** Upgrade nudge shown where Loop issuing UI is gated off for free-tier businesses. */
export const LOOP_UPGRADE_NUDGE = 'Loop Points are available on paid plans.';
