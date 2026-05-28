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
  // Growth tier
  growth: {
    postsPerDay: 5,
    allowedCategories: ['right_now', 'heads_up', 'energy_check', 'community_ask', 'good_stuff'],
    canPin: true,
    maxPinnedPerDay: 1,
    canUsePromoLanguage: true,
    expirationMultiplier: 1.5,
  },
  // Pro / Anchor tier
  pro: {
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

// ===========================================================================
// PULSE RESTRUCTURE — "the heartbeat of the city"
//
// Pulse is organized around four structured content types, not a generic feed.
// Everything below powers the restructured experience: content types, the
// template-driven composer (structured posting only), neighborhoods, category
// filters, lightweight positive reactions, feed tabs, and the trust system.
// ===========================================================================

export type PulseContentType =
  | 'business_activity'
  | 'community_activity'
  | 'local_moment'
  | 'city_signal';

export interface PulseContentTypeConfig {
  id: PulseContentType;
  label: string;
  tagline: string;
  icon: string;
  accent: string; // text color
  surface: string; // subtle background
}

export const PULSE_CONTENT_TYPES: Record<PulseContentType, PulseContentTypeConfig> = {
  business_activity: {
    id: 'business_activity',
    label: 'Business Activity',
    tagline: 'Real-time updates from local businesses',
    icon: 'Store',
    accent: 'text-lokal-amber',
    surface: 'bg-lokal-amber/10',
  },
  community_activity: {
    id: 'community_activity',
    label: 'Community',
    tagline: 'Nonprofits and neighbors in motion',
    icon: 'HeartHandshake',
    accent: 'text-lokal-forest',
    surface: 'bg-lokal-forest/10',
  },
  local_moment: {
    id: 'local_moment',
    label: 'Local Moments',
    tagline: 'Small, real moments tied to local places',
    icon: 'Sparkles',
    accent: 'text-lokal-terracotta',
    surface: 'bg-lokal-terracotta/10',
  },
  city_signal: {
    id: 'city_signal',
    label: 'City Signals',
    tagline: 'The city, alive right now',
    icon: 'Radio',
    accent: 'text-primary',
    surface: 'bg-primary/10',
  },
};

// --- Structured posting: templates are the ONLY way to post (no blank posts) ---

export type PulseAuthorKind = 'user' | 'business' | 'nonprofit';

export interface PulseTemplateField {
  key: string;
  label: string;
  type: 'short_text' | 'long_text' | 'time' | 'place';
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}

export interface PulseTemplate {
  key: string;
  contentType: PulseContentType;
  label: string;
  description: string;
  icon: string;
  prompt: string;
  defaultExpirationHours: number;
  maxExpirationHours: number;
  allowedAuthors: PulseAuthorKind[];
  // Whether the post must be tied to a real place (check-in / moment).
  requiresPlace?: boolean;
  examples: string[];
}

export const PULSE_TEMPLATES: PulseTemplate[] = [
  // ---- Business activity ----
  { key: 'todays_special', contentType: 'business_activity', label: "Today's special", description: 'A dish, drink, or item available today', icon: 'Sparkles', prompt: "What's special today?", defaultExpirationHours: 24, maxExpirationHours: 24, allowedAuthors: ['business'], examples: ['Fresh pastries available now', 'Chef’s special: smoked brisket tacos'] },
  { key: 'flash_reward', contentType: 'business_activity', label: 'Flash reward', description: 'A limited-time Loop reward or bonus', icon: 'Zap', prompt: 'What reward is live right now?', defaultExpirationHours: 4, maxExpirationHours: 8, allowedAuthors: ['business'], examples: ['Double Loop Points until 6 PM', 'Free drink with any check-in today'] },
  { key: 'business_event', contentType: 'business_activity', label: 'Event', description: 'Something happening at your business', icon: 'CalendarDays', prompt: "What's the event?", defaultExpirationHours: 48, maxExpirationHours: 72, allowedAuthors: ['business'], examples: ['Trivia night at 8', 'Author signing this Saturday'] },
  { key: 'new_arrival', contentType: 'business_activity', label: 'New arrival', description: 'Something new in stock or on the menu', icon: 'PackagePlus', prompt: 'What just arrived?', defaultExpirationHours: 24, maxExpirationHours: 48, allowedAuthors: ['business'], examples: ['New fall roast just landed', 'Spring collection now in store'] },
  { key: 'hiring', contentType: 'business_activity', label: 'Hiring', description: 'An open role at your business', icon: 'Briefcase', prompt: 'What role are you hiring for?', defaultExpirationHours: 48, maxExpirationHours: 72, allowedAuthors: ['business'], examples: ['Hiring a barista — mornings', 'Looking for a line cook'] },
  { key: 'staff_spotlight', contentType: 'business_activity', label: 'Staff spotlight', description: 'Celebrate someone on your team', icon: 'UserStar', prompt: 'Who are you spotlighting?', defaultExpirationHours: 24, maxExpirationHours: 48, allowedAuthors: ['business'], examples: ['Meet Dana, our weekend pastry chef', '5 years for our shop manager Lee!'] },
  { key: 'live_music', contentType: 'business_activity', label: 'Live music', description: 'Live music happening tonight', icon: 'Music', prompt: "Who's playing and when?", defaultExpirationHours: 8, maxExpirationHours: 12, allowedAuthors: ['business'], examples: ['Live music tonight at 7', 'Acoustic set starting now'] },
  { key: 'availability', contentType: 'business_activity', label: 'Availability', description: 'Open slots, tables, or appointments', icon: 'Clock', prompt: "What's available right now?", defaultExpirationHours: 6, maxExpirationHours: 12, allowedAuthors: ['business'], examples: ['Appointments open this afternoon', 'Walk-ins welcome until 4'] },
  { key: 'community_support', contentType: 'business_activity', label: 'Community support', description: "A cause or fundraiser you're backing", icon: 'HeartHandshake', prompt: 'Who are you supporting?', defaultExpirationHours: 48, maxExpirationHours: 72, allowedAuthors: ['business'], examples: ['Supporting a local fundraiser tonight', '10% of sales go to the food bank today'] },
  { key: 'holiday_update', contentType: 'business_activity', label: 'Holiday update', description: 'Holiday hours or closures', icon: 'PartyPopper', prompt: "What's changing for the holiday?", defaultExpirationHours: 72, maxExpirationHours: 168, allowedAuthors: ['business'], examples: ['Closed Thanksgiving, open Friday', 'Holiday hours posted'] },
  { key: 'schedule_update', contentType: 'business_activity', label: 'Schedule update', description: 'A change to your normal hours', icon: 'CalendarClock', prompt: "What's the schedule change?", defaultExpirationHours: 24, maxExpirationHours: 48, allowedAuthors: ['business'], examples: ['Opening late tomorrow (10 AM)', 'Closing early today at 3'] },
  { key: 'limited_offer', contentType: 'business_activity', label: 'Limited-time offer', description: 'A short-lived offer for locals', icon: 'Tag', prompt: 'What’s the offer and when does it end?', defaultExpirationHours: 12, maxExpirationHours: 24, allowedAuthors: ['business'], examples: ['Happy hour pricing until 6', 'First 20 orders get a free side'] },
  // ---- Community activity ----
  { key: 'volunteer_need', contentType: 'community_activity', label: 'Volunteer need', description: 'Recruit volunteers for a need', icon: 'Users', prompt: 'What help do you need and when?', defaultExpirationHours: 72, maxExpirationHours: 168, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Volunteers needed Saturday morning', 'Need 5 hands to sort donations'] },
  { key: 'donation_drive', contentType: 'community_activity', label: 'Donation drive', description: 'Collect donations for a cause', icon: 'Gift', prompt: 'What are you collecting?', defaultExpirationHours: 168, maxExpirationHours: 336, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Winter coat drive accepting donations', 'Collecting school supplies this week'] },
  { key: 'community_event', contentType: 'community_activity', label: 'Community event', description: 'A free or open community gathering', icon: 'CalendarHeart', prompt: "What's the event?", defaultExpirationHours: 72, maxExpirationHours: 168, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Community yoga tonight', 'Neighborhood block party Sunday'] },
  { key: 'cleanup_effort', contentType: 'community_activity', label: 'Cleanup effort', description: 'A neighborhood cleanup or beautification', icon: 'Trash2', prompt: 'Where and when is the cleanup?', defaultExpirationHours: 72, maxExpirationHours: 168, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Neighborhood cleanup starts at 10 AM', 'Riverside trash pickup Saturday'] },
  { key: 'mutual_aid', contentType: 'community_activity', label: 'Mutual aid', description: 'Neighbors helping neighbors', icon: 'HandHeart', prompt: 'What support is being offered or needed?', defaultExpirationHours: 72, maxExpirationHours: 168, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Free firewood for anyone who needs it', 'Rides available to the clinic this week'] },
  { key: 'youth_program', contentType: 'community_activity', label: 'Youth program', description: 'A program for kids or teens', icon: 'GraduationCap', prompt: "What's the program?", defaultExpirationHours: 168, maxExpirationHours: 336, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['After-school coding club starting', 'Summer reading program sign-ups open'] },
  { key: 'public_resource', contentType: 'community_activity', label: 'Public resource', description: 'A free resource locals should know about', icon: 'BookOpen', prompt: "What's the resource?", defaultExpirationHours: 168, maxExpirationHours: 336, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Free flu shots at the rec center', 'Warming center open this weekend'] },
  { key: 'community_class', contentType: 'community_activity', label: 'Community class', description: 'A class open to the community', icon: 'Presentation', prompt: "What's the class?", defaultExpirationHours: 72, maxExpirationHours: 168, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Free resume workshop Thursday', 'Beginner ESL class starting'] },
  { key: 'school_support', contentType: 'community_activity', label: 'School support', description: 'Support a local school', icon: 'School', prompt: 'How can locals help the school?', defaultExpirationHours: 168, maxExpirationHours: 336, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Classroom supply wishlist', 'Chaperones needed for field trip'] },
  { key: 'fundraiser', contentType: 'community_activity', label: 'Fundraiser', description: 'Raise funds for a cause', icon: 'PiggyBank', prompt: 'What are you raising funds for?', defaultExpirationHours: 336, maxExpirationHours: 720, allowedAuthors: ['nonprofit', 'business', 'user'], examples: ['Food pantry needs support this week', 'Fundraiser for the youth center roof'] },
  // ---- Local moments (residents) ----
  { key: 'local_moment', contentType: 'local_moment', label: 'Local moment', description: 'A short, positive memory tied to a place', icon: 'Sparkle', prompt: 'What made this place special?', defaultExpirationHours: 24, maxExpirationHours: 48, allowedAuthors: ['user'], requiresPlace: true, examples: ['Perfect rainy-day coffee spot.', 'Took my daughter here after her recital.'] },
  { key: 'check_in', contentType: 'local_moment', label: 'Check-in', description: "You're here right now", icon: 'MapPin', prompt: 'Where are you?', defaultExpirationHours: 6, maxExpirationHours: 12, allowedAuthors: ['user'], requiresPlace: true, examples: ['Found my new Saturday routine.', 'Met a client here and stayed for hours.'] },
  { key: 'recommendation', contentType: 'local_moment', label: 'Recommendation', description: 'A place worth telling neighbors about', icon: 'ThumbsUp', prompt: 'What do you recommend and why?', defaultExpirationHours: 48, maxExpirationHours: 72, allowedAuthors: ['user'], requiresPlace: true, examples: ['This place made me feel welcome.', 'Best patio in the Old West End.'] },
];

export function getTemplate(key: string | null | undefined): PulseTemplate | undefined {
  if (!key) return undefined;
  return PULSE_TEMPLATES.find((t) => t.key === key);
}

export function getTemplatesFor(authors: PulseAuthorKind[]): PulseTemplate[] {
  return PULSE_TEMPLATES.filter((t) => t.allowedAuthors.some((a) => authors.includes(a)));
}

export const PULSE_MOMENT_MAX_LENGTH = 140;

// --- Neighborhoods ---

export interface PulseNeighborhood {
  id: string;
  label: string;
}

export const PULSE_NEIGHBORHOODS: PulseNeighborhood[] = [
  { id: 'Downtown', label: 'Downtown' },
  { id: 'Old West End', label: 'Old West End' },
  { id: 'Sylvania', label: 'Sylvania' },
  { id: 'Maumee', label: 'Maumee' },
  { id: 'Perrysburg', label: 'Perrysburg' },
  { id: 'West Toledo', label: 'West Toledo' },
];

// --- Category filters ---

export interface PulseCategoryTag {
  id: string;
  label: string;
  icon: string;
}

export const PULSE_CATEGORY_TAGS: PulseCategoryTag[] = [
  { id: 'food', label: 'Food', icon: 'UtensilsCrossed' },
  { id: 'coffee', label: 'Coffee', icon: 'Coffee' },
  { id: 'events', label: 'Events', icon: 'CalendarDays' },
  { id: 'family', label: 'Family', icon: 'Baby' },
  { id: 'nonprofits', label: 'Nonprofits', icon: 'HeartHandshake' },
  { id: 'live_music', label: 'Live Music', icon: 'Music' },
  { id: 'shopping', label: 'Shopping', icon: 'ShoppingBag' },
  { id: 'wellness', label: 'Wellness', icon: 'HeartPulse' },
  { id: 'nightlife', label: 'Nightlife', icon: 'Wine' },
];

// --- Reactions (lightweight + positive only) ---

export type PulseReactionType =
  | 'love'
  | 'trending'
  | 'want_to_go'
  | 'community_favorite'
  | 'looks_fun'
  | 'my_list';

export interface PulseReactionConfig {
  id: PulseReactionType;
  emoji: string;
  label: string;
}

export const PULSE_REACTIONS: PulseReactionConfig[] = [
  { id: 'love', emoji: '❤️', label: 'Love this' },
  { id: 'trending', emoji: '🔥', label: 'Trending' },
  { id: 'want_to_go', emoji: '☕', label: 'Want to go' },
  { id: 'community_favorite', emoji: '🙌', label: 'Community favorite' },
  { id: 'looks_fun', emoji: '🎉', label: 'Looks fun' },
  { id: 'my_list', emoji: '📍', label: 'Adding to my list' },
];

// --- Feed tabs ---

export type PulseTab =
  | 'for_you'
  | 'nearby'
  | 'trending'
  | 'following'
  | 'community'
  | 'events'
  | 'live';

export interface PulseTabConfig {
  id: PulseTab;
  label: string;
  icon: string;
}

export const PULSE_TABS: PulseTabConfig[] = [
  { id: 'for_you', label: 'For You', icon: 'Sparkles' },
  { id: 'nearby', label: 'Nearby', icon: 'MapPin' },
  { id: 'trending', label: 'Trending', icon: 'Flame' },
  { id: 'following', label: 'Following', icon: 'Heart' },
  { id: 'community', label: 'Community', icon: 'HeartHandshake' },
  { id: 'events', label: 'Events', icon: 'CalendarDays' },
  { id: 'live', label: 'Live', icon: 'Radio' },
];

// Template keys that belong on the Events tab.
export const PULSE_EVENT_TEMPLATE_KEYS = ['business_event', 'community_event', 'live_music'];

// --- Trust system (non-AI) ---

export type PulseTrustLevel = 'new' | 'local' | 'trusted' | 'ambassador';

export interface PulseTrustLevelConfig {
  id: PulseTrustLevel;
  label: string;
  icon: string;
  minScore: number;
  dailyPostLimit: number;
  requiresApproval: boolean;
  canBeFeatured: boolean;
  description: string;
}

export const PULSE_TRUST_LEVELS: Record<PulseTrustLevel, PulseTrustLevelConfig> = {
  new: { id: 'new', label: 'New', icon: 'Sprout', minScore: 0, dailyPostLimit: 2, requiresApproval: false, canBeFeatured: false, description: 'Just getting started in Toledo' },
  local: { id: 'local', label: 'Local', icon: 'MapPin', minScore: 25, dailyPostLimit: 4, requiresApproval: false, canBeFeatured: false, description: 'An active part of the community' },
  trusted: { id: 'trusted', label: 'Trusted Local', icon: 'BadgeCheck', minScore: 80, dailyPostLimit: 8, requiresApproval: false, canBeFeatured: true, description: 'A reliable local voice' },
  ambassador: { id: 'ambassador', label: 'Ambassador', icon: 'Crown', minScore: 200, dailyPostLimit: 20, requiresApproval: false, canBeFeatured: true, description: 'A trusted community ambassador' },
};

export function getTrustLevelConfig(level: PulseTrustLevel | string | null | undefined): PulseTrustLevelConfig {
  return PULSE_TRUST_LEVELS[(level as PulseTrustLevel)] ?? PULSE_TRUST_LEVELS.new;
}

// --- Report reasons ---

export const PULSE_REPORT_REASONS: { id: string; label: string }[] = [
  { id: 'spam', label: 'Spam or self-promotion' },
  { id: 'not_local', label: 'Not relevant to Toledo' },
  { id: 'inappropriate', label: 'Inappropriate content' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'misleading', label: 'Misleading or fake' },
  { id: 'duplicate', label: 'Duplicate post' },
  { id: 'other', label: 'Something else' },
];

export const NEIGHBORHOOD_ENERGY_STYLES: Record<string, { ring: string; text: string }> = {
  quiet: { ring: 'border-muted', text: 'text-muted-foreground' },
  calm: { ring: 'border-lokal-amber/40', text: 'text-lokal-amber' },
  steady: { ring: 'border-lokal-forest/40', text: 'text-lokal-forest' },
  active: { ring: 'border-lokal-terracotta/50', text: 'text-lokal-terracotta' },
  buzzing: { ring: 'border-primary/60', text: 'text-primary' },
};
