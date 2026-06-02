export type LoopTierId = 'community' | 'growth' | 'pro';

export interface LoopTierConfig {
  id: LoopTierId;
  name: string;
  price: number;
  pointsCap: number;
  features: string[];
  canCreateMissions: boolean;
  canSponsorMissions: boolean;
  stripePriceId: string | null;
}

export const LOOP_TIERS: Record<LoopTierId, LoopTierConfig> = {
  community: {
    id: 'community',
    name: 'Community',
    price: 0,
    pointsCap: 1000,
    features: [
      'Business listing',
      'Basic Loop participation',
      '1,000 LP/month',
      'Accept LP redemptions'
    ],
    canCreateMissions: false,
    canSponsorMissions: false,
    stripePriceId: null
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 59,
    pointsCap: 7500,
    features: [
      'Everything in Community',
      '7,500 LP/month',
      'Citywide missions',
      'Featured discovery',
      'Referral rewards',
      'Advanced analytics'
    ],
    canCreateMissions: true,
    canSponsorMissions: false,
    stripePriceId: null
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 149,
    pointsCap: 25000,
    features: [
      'Everything in Growth',
      '25,000 LP/month',
      'Priority placement',
      'Sponsored missions',
      'Event integrations',
      'Co-branding',
      'Quarterly reports'
    ],
    canCreateMissions: true,
    canSponsorMissions: true,
    stripePriceId: null
  }
};

// Special allocations for Founding programs
export const FOUNDING_5_LP_MONTHLY = 30000;
export const FOUNDING_50_LP_MONTHLY = 15000;
export const FOUNDING_5_SUPPLY_CAP_PERCENT = 20; // Max 20% of total supply

export const getLoopTierById = (id: LoopTierId | string | null): LoopTierConfig => {
  if (!id || !(id in LOOP_TIERS)) return LOOP_TIERS.community;
  return LOOP_TIERS[id as LoopTierId];
};

export const isLoopParticipant = (tierId: LoopTierId | string | null): boolean => {
  // All tiers participate now — community is the base tier
  return tierId !== null && tierId in LOOP_TIERS;
};

/**
 * Get the effective monthly LP allocation for a business,
 * accounting for Founding 5 and Founding 25 overrides.
 */
export const getEffectivePointsCap = (
  tierId: LoopTierId | string | null,
  isFoundingMember: boolean,
  isFounding50: boolean
): number => {
  if (isFoundingMember) return FOUNDING_5_LP_MONTHLY;
  if (isFounding50) return FOUNDING_50_LP_MONTHLY;
  return getLoopTierById(tierId).pointsCap;
};

/** LP value: 1,000 LP = $10 perceived value */
export const LP_PER_DOLLAR = 100;
export const LP_EXPIRATION_DAYS = 90;
export const PURCHASED_LP_EXPIRATION_DAYS = 60;

/** User earning rates */
export const USER_EARNING = {
  PURCHASE_PERCENT: 5,       // 5% back on purchases
  REFERRAL_BONUS: 1000,      // Verified referral
  EVENT_CHECKIN: 250,         // Event check-in
  NONPROFIT_ACTION: 500,     // Nonprofit actions
  CHALLENGE_MIN: 1000,       // City challenges min
  CHALLENGE_MAX: 5000,       // City challenges max
} as const;
