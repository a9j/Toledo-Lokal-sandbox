// Pulse post categories and their configuration
export type PulseCategory = 'right_now' | 'heads_up' | 'energy_check' | 'community_ask' | 'good_stuff';

export interface PulseCategoryConfig {
  id: PulseCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  defaultExpirationHours: number;
  maxExpirationHours: number;
  examples: string[];
}

export const PULSE_CATEGORIES: Record<PulseCategory, PulseCategoryConfig> = {
  right_now: {
    id: 'right_now',
    label: 'Right Now',
    description: 'Immediate, active happenings',
    icon: 'Zap',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    defaultExpirationHours: 1,
    maxExpirationHours: 4,
    examples: ['Free tacos at X until 8pm', 'Live jazz just started downtown'],
  },
  heads_up: {
    id: 'heads_up',
    label: 'Heads Up',
    description: 'Useful alerts or awareness notices',
    icon: 'AlertTriangle',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    defaultExpirationHours: 6,
    maxExpirationHours: 12,
    examples: ['Road closed on Adams St', 'Power outage near UT campus'],
  },
  energy_check: {
    id: 'energy_check',
    label: 'Energy Check',
    description: 'The vibe or activity level of an area',
    icon: 'Activity',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    defaultExpirationHours: 4,
    maxExpirationHours: 4,
    examples: ['Downtown is packed tonight', 'Quiet morning in Sylvania'],
  },
  community_ask: {
    id: 'community_ask',
    label: 'Community Ask',
    description: 'Requests for local help or recommendations',
    icon: 'HelpCircle',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    defaultExpirationHours: 24,
    maxExpirationHours: 24,
    examples: ['Looking for a plumber today', 'Any local photographers available?'],
  },
  good_stuff: {
    id: 'good_stuff',
    label: 'Good Stuff',
    description: 'Positive moments in the community',
    icon: 'Heart',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    defaultExpirationHours: 24,
    maxExpirationHours: 24,
    examples: ['Local kid raised $500 for charity', 'Wallet returned at Maumee Bay'],
  },
};

// Business tier pulse limits
export interface PulseTierLimits {
  postsPerDay: number;
  allowedCategories: PulseCategory[];
  canPin: boolean;
  maxPinnedPerDay: number;
  canUsePromoLanguage: boolean;
  expirationMultiplier: number; // 1 = normal, higher = longer expiration
}

export const PULSE_TIER_LIMITS: Record<string, PulseTierLimits> = {
  // Regular users
  user: {
    postsPerDay: 3,
    allowedCategories: ['right_now', 'heads_up', 'energy_check', 'community_ask', 'good_stuff'],
    canPin: false,
    maxPinnedPerDay: 0,
    canUsePromoLanguage: false,
    expirationMultiplier: 1,
  },
  // Unpaid businesses
  free: {
    postsPerDay: 1,
    allowedCategories: ['right_now', 'community_ask'],
    canPin: false,
    maxPinnedPerDay: 0,
    canUsePromoLanguage: false,
    expirationMultiplier: 0.5, // Shorter expiration
  },
  // Local Supporter tier
  local_supporter: {
    postsPerDay: 3,
    allowedCategories: ['right_now', 'heads_up'],
    canPin: false,
    maxPinnedPerDay: 0,
    canUsePromoLanguage: true,
    expirationMultiplier: 1,
  },
  // Featured Local tier
  featured_local: {
    postsPerDay: 5,
    allowedCategories: ['right_now', 'heads_up', 'energy_check', 'community_ask', 'good_stuff'],
    canPin: true,
    maxPinnedPerDay: 1,
    canUsePromoLanguage: true,
    expirationMultiplier: 1.5,
  },
  // Anchor Partner tier
  anchor_partner: {
    postsPerDay: 10,
    allowedCategories: ['right_now', 'heads_up', 'energy_check', 'community_ask', 'good_stuff'],
    canPin: true,
    maxPinnedPerDay: 3,
    canUsePromoLanguage: true,
    expirationMultiplier: 2,
  },
};

// Promotional language patterns to detect
export const PROMO_PATTERNS = [
  /\b(sale|discount|off|free|deal|offer|promo|coupon|save)\b/i,
  /\b(\d+%\s*off|\$\d+\s*off)\b/i,
  /\b(limited\s*time|act\s*now|hurry|don't\s*miss)\b/i,
  /\b(buy\s*one|bogo|special)\b/i,
];

export function containsPromoLanguage(text: string): boolean {
  return PROMO_PATTERNS.some(pattern => pattern.test(text));
}

export function getPulseTierLimits(
  isBusinessPost: boolean,
  subscriptionTier: string | null
): PulseTierLimits {
  if (!isBusinessPost) {
    return PULSE_TIER_LIMITS.user;
  }
  
  const tier = subscriptionTier || 'free';
  return PULSE_TIER_LIMITS[tier] || PULSE_TIER_LIMITS.free;
}

export function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getExpirationOptions(category: PulseCategory, tierMultiplier: number = 1): { label: string; hours: number }[] {
  const config = PULSE_CATEGORIES[category];
  const maxHours = Math.min(config.maxExpirationHours * tierMultiplier, 48);
  
  const options: { label: string; hours: number }[] = [];
  
  if (maxHours >= 1) options.push({ label: '1 hour', hours: 1 });
  if (maxHours >= 2) options.push({ label: '2 hours', hours: 2 });
  if (maxHours >= 4) options.push({ label: '4 hours', hours: 4 });
  if (maxHours >= 6) options.push({ label: '6 hours', hours: 6 });
  if (maxHours >= 12) options.push({ label: '12 hours', hours: 12 });
  if (maxHours >= 24) options.push({ label: '24 hours', hours: 24 });
  if (maxHours >= 48) options.push({ label: '48 hours', hours: 48 });
  
  return options;
}
