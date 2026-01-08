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
    featuredPlacement: boolean;
    homepageFeatured: boolean;
    analytics: boolean;
    supportBadge: boolean;
    prioritySupport: boolean;
  };
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
      'Basic listing'
    ],
    limits: {
      deals: 0,
      events: 0,
      featuredPlacement: false,
      homepageFeatured: false,
      analytics: false,
      supportBadge: false,
      prioritySupport: false,
    }
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
      'Enhanced listing'
    ],
    limits: {
      deals: 1,
      events: 0,
      featuredPlacement: false,
      homepageFeatured: false,
      analytics: false,
      supportBadge: true,
      prioritySupport: false,
    }
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
      'Basic analytics'
    ],
    limits: {
      deals: -1, // unlimited
      events: -1, // unlimited
      featuredPlacement: true,
      homepageFeatured: false,
      analytics: true,
      supportBadge: true,
      prioritySupport: false,
    }
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
      'Priority support'
    ],
    limits: {
      deals: -1,
      events: -1,
      featuredPlacement: true,
      homepageFeatured: true,
      analytics: true,
      supportBadge: true,
      prioritySupport: true,
    }
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
