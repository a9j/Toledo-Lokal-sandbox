import { LoopTierId } from './loop-tiers';

export type SubscriptionTier = 'free' | 'local_supporter' | 'featured_local' | 'anchor_partner';

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
  };
  // Loop Lokal integration
  loopTierId: LoopTierId | null;
  loopFeatures: string[];
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    productId: null,
    features: [
      'Business name & category',
      'Location on map',
      'Basic listing',
      '1 active job posting',
      'Jobs auto-expire in 30 days'
    ],
    limits: {
      deals: 0,
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
    },
    loopTierId: 'community',
    loopFeatures: [
      'Community Loop tier',
      '1,000 LP/month',
      'Accept LP redemptions'
    ]
  },
  local_supporter: {
    id: 'local_supporter',
    name: 'Local Supporter',
    price: 25,
    priceId: 'price_1SnOZDL0YJBOxs9s3h1Cp9Za',
    productId: 'prod_TkuNmw1oP99cDB',
    features: [
      'Everything in Free',
      '1 deal per month',
      'Support local badge',
      'Enhanced listing',
      '3 active job postings',
      '"Local Employer" badge on jobs',
      'Repost & duplicate jobs'
    ],
    limits: {
      deals: 1,
      events: 0,
      jobs: 3,
      jobExpirationDays: 0, // No expiration
      featuredPlacement: false,
      homepageFeatured: false,
      analytics: false,
      supportBadge: true,
      prioritySupport: false,
      jobBadge: true,
      jobAnalytics: false,
      pulsePostsPerDay: 3,
      pulsePinnedPerDay: 0,
      pulsePromoAllowed: true,
    },
    loopTierId: 'community',
    loopFeatures: [
      'Community Loop tier',
      '1,000 LP/month',
      'Accept LP redemptions',
      'QR code issuance',
      'Basic rewards setup'
    ]
  },
  featured_local: {
    id: 'featured_local',
    name: 'Featured Local',
    price: 75,
    priceId: 'price_1SnOZWL0YJBOxs9siQddFtHi',
    productId: 'prod_TkuOJkqlruAjiG',
    features: [
      'Everything in Local Supporter',
      'Unlimited deals',
      'Post events',
      'Featured placement',
      'Basic analytics',
      '5 active job postings',
      'Higher visibility in job feed'
    ],
    limits: {
      deals: -1, // unlimited
      events: -1, // unlimited
      jobs: 5,
      jobExpirationDays: 0,
      featuredPlacement: true,
      homepageFeatured: false,
      analytics: true,
      supportBadge: true,
      prioritySupport: false,
      jobBadge: true,
      jobAnalytics: true,
      pulsePostsPerDay: 5,
      pulsePinnedPerDay: 1,
      pulsePromoAllowed: true,
    },
    loopTierId: 'growth',
    loopFeatures: [
      'Loop Growth included',
      '7,500 LP/month',
      'Citywide missions',
      'Featured discovery',
      'Referral rewards',
      'Advanced analytics'
    ]
  },
  anchor_partner: {
    id: 'anchor_partner',
    name: 'Anchor Partner',
    price: 150,
    priceId: 'price_1SnOZtL0YJBOxs9sJXuOYimJ',
    productId: 'prod_TkuOGiyIs7qK5U',
    features: [
      'Everything in Featured Local',
      'Homepage featured section',
      'Exclusive placements',
      'Advanced analytics',
      'Priority support',
      'Unlimited job postings',
      'Featured job placement',
      'Job analytics dashboard'
    ],
    limits: {
      deals: -1,
      events: -1,
      jobs: -1, // unlimited
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
    },
    loopTierId: 'pro',
    loopFeatures: [
      'Loop Pro included',
      '25,000 LP/month',
      'Priority placement',
      'Sponsored missions',
      'Event integrations',
      'Co-branding',
      'Quarterly reports'
    ]
  }
};

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
