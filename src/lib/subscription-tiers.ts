import { LoopTierId } from './loop-tiers';

export type SubscriptionTier = 'free' | 'growth' | 'pro';

export interface TierConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  priceId: string | null;
  productId: string | null;
  features: string[];
  limits: {
    deals: number;
    events: number;
    jobs: number; // -1 = unlimited
    jobExpirationDays: number; // 0 = no expiration
    featuredPlacement: boolean;
    homepageFeatured: boolean;
    analytics: boolean;
    supportBadge: boolean;
    prioritySupport: boolean;
    jobBadge: boolean;
    jobAnalytics: boolean;
    // Pulse limits
    pulsePostsPerDay: number;
    pulsePinnedPerDay: number;
    pulsePromoAllowed: boolean;
    // Offers/rewards
    maxActiveOffers: number;
  };
  // Loop Lokal integration
  loopTierId: LoopTierId | null;
  loopFeatures: string[];
  // Business tier_status this maps to
  tierStatus: string;
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Community',
    price: 0,
    priceId: null,
    productId: null,
    features: [
      'Business profile with photos, hours, contact',
      'Category listing & search',
      'Accept Loop Points from customers',
      '1 active offer/reward',
      'Basic analytics',
    ],
    limits: {
      deals: 1,
      events: 0,
      jobs: 1,
      jobExpirationDays: 30,
      featuredPlacement: false,
      homepageFeatured: false,
      analytics: false,
      supportBadge: false,
      prioritySupport: false,
      jobBadge: false,
      jobAnalytics: false,
      pulsePostsPerDay: 1,
      pulsePinnedPerDay: 0,
      pulsePromoAllowed: false,
      maxActiveOffers: 1,
    },
    loopTierId: 'community',
    loopFeatures: [
      '1,000 LP/month',
      'Always-On or Challenge-Only modes',
      'Accept LP redemptions',
    ],
    tierStatus: 'community',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 59,
    priceId: 'price_1SnOZWL0YJBOxs9siQddFtHi',
    productId: 'prod_TkuOJkqlruAjiG',
    features: [
      'Everything in Community',
      '4 active offers/rewards',
      'Priority search placement',
      'Featured category rotation',
      'Custom Loop Challenges',
      'Double Points Days',
      'Customer insights dashboard',
      'Email newsletter rotation',
    ],
    limits: {
      deals: -1,
      events: -1,
      jobs: 5,
      jobExpirationDays: 0,
      featuredPlacement: true,
      homepageFeatured: false,
      analytics: true,
      supportBadge: false,
      prioritySupport: false,
      jobBadge: true,
      jobAnalytics: true,
      pulsePostsPerDay: 5,
      pulsePinnedPerDay: 1,
      pulsePromoAllowed: true,
      maxActiveOffers: 4,
    },
    loopTierId: 'growth',
    loopFeatures: [
      '7,500 LP/month',
      'All participation modes',
      'Custom Loop Challenges',
    ],
    tierStatus: 'growth',
  },
  pro: {
    id: 'pro',
    name: 'Pro / Anchor',
    price: 149,
    priceId: 'price_1SnOZtL0YJBOxs9sJXuOYimJ',
    productId: 'prod_TkuOGiyIs7qK5U',
    features: [
      'Everything in Growth',
      'Top-of-category search placement',
      'Homepage rotation',
      '1 push notification/month',
      'Sponsored challenge access',
      'Advanced analytics',
      'Pro badge on profile',
      'Quarterly spotlight post',
      'Unlimited offers/rewards',
    ],
    limits: {
      deals: -1,
      events: -1,
      jobs: -1,
      jobExpirationDays: 0,
      featuredPlacement: true,
      homepageFeatured: true,
      analytics: true,
      supportBadge: true,
      prioritySupport: true,
      jobBadge: true,
      jobAnalytics: true,
      pulsePostsPerDay: 10,
      pulsePinnedPerDay: 3,
      pulsePromoAllowed: true,
      maxActiveOffers: -1,
    },
    loopTierId: 'pro',
    loopFeatures: [
      '25,000 LP/month',
      'All participation modes',
      'Sponsored missions',
    ],
    tierStatus: 'pro',
  },
};

// Founding tier configs (not subscription-based, admin-assigned)
export const FOUNDING_TIERS = {
  founding_5: {
    name: 'Founding 5',
    lpMonthly: 30000,
    maxActiveOffers: -1,
    subscriptionPrice: 0,
  },
  founding_50: {
    name: 'Founding 50',
    lpMonthlyLaunch: 15000,
    discountPercentage: 50,
    maxActiveOffers: 4,
    subscriptionPrice: 0,
  },
} as const;

export const getTierByProductId = (productId: string | null): SubscriptionTier => {
  if (!productId) return 'free';
  
  for (const [tierId, config] of Object.entries(SUBSCRIPTION_TIERS)) {
    if (config.productId === productId) {
      return tierId as SubscriptionTier;
    }
  }
  return 'free';
};

export const canAccessFeature = (
  tier: SubscriptionTier, 
  feature: keyof TierConfig['limits']
): boolean => {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const value = tierConfig.limits[feature];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return false;
};

export const getDealsLimit = (tier: SubscriptionTier): number => {
  return SUBSCRIPTION_TIERS[tier].limits.deals;
};

export const getEventsLimit = (tier: SubscriptionTier): number => {
  return SUBSCRIPTION_TIERS[tier].limits.events;
};

export const getJobsLimit = (tier: SubscriptionTier): number => {
  return SUBSCRIPTION_TIERS[tier].limits.jobs;
};

export const getJobExpirationDays = (tier: SubscriptionTier): number => {
  return SUBSCRIPTION_TIERS[tier].limits.jobExpirationDays;
};

export const getLoopTierForSubscription = (tier: SubscriptionTier): LoopTierId => {
  return SUBSCRIPTION_TIERS[tier].loopTierId || 'community';
};
