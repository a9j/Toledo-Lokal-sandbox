import { BusinessCategory } from './profile-modules';

export interface SignalOption {
  type: string;
  label: string;
}

// Reactions every business can receive.
const UNIVERSAL: SignalOption[] = [
  { type: 'hidden_gem', label: 'Hidden Gem' },
  { type: 'good_vibes', label: 'Good Vibes' },
  { type: 'great_staff', label: 'Great Staff' },
  { type: 'welcoming', label: 'Welcoming' },
  { type: 'cozy', label: 'Cozy' },
  { type: 'local_favorite', label: 'Local Favorite' },
  { type: 'authentic', label: 'Authentic' },
  { type: 'community_staple', label: 'Community Staple' },
  { type: 'underrated', label: 'Underrated' },
  { type: 'worth_the_drive', label: 'Worth the Drive' },
];

const BY_CATEGORY: Partial<Record<BusinessCategory, SignalOption[]>> = {
  restaurant: [
    { type: 'great_food', label: 'Great Food' }, { type: 'fast_lunch', label: 'Fast Lunch' },
    { type: 'family_favorite', label: 'Family Favorite' }, { type: 'date_night', label: 'Date Night' },
    { type: 'good_portions', label: 'Good Portions' },
  ],
  food_truck: [
    { type: 'easy_to_find', label: 'Easy to Find' }, { type: 'great_flavor', label: 'Great Flavor' },
    { type: 'worth_the_wait', label: 'Worth the Wait' }, { type: 'event_favorite', label: 'Event Favorite' },
  ],
  retail: [
    { type: 'unique_finds', label: 'Unique Finds' }, { type: 'local_makers', label: 'Local Makers' },
    { type: 'gift_worthy', label: 'Gift-Worthy' }, { type: 'beautiful_shop', label: 'Beautiful Shop' },
    { type: 'worth_browsing', label: 'Worth Browsing' },
  ],
  salon_barber: [
    { type: 'great_cuts', label: 'Great Cuts' }, { type: 'clean_space', label: 'Clean Space' },
    { type: 'skilled', label: 'Skilled Stylists' }, { type: 'easy_booking', label: 'Easy Booking' },
    { type: 'confidence_boost', label: 'Confidence Boost' },
  ],
  gym_fitness: [
    { type: 'beginner_friendly', label: 'Beginner Friendly' }, { type: 'motivating', label: 'Motivating' },
    { type: 'clean_space', label: 'Clean Space' }, { type: 'great_coaches', label: 'Great Coaches' },
    { type: 'strong_community', label: 'Strong Community' },
  ],
  contractor_service: [
    { type: 'reliable', label: 'Reliable' }, { type: 'fast_response', label: 'Fast Response' },
    { type: 'fair_pricing', label: 'Fair Pricing' }, { type: 'quality_work', label: 'Quality Work' },
    { type: 'professional', label: 'Professional' },
  ],
  professional_service: [
    { type: 'reliable', label: 'Reliable' }, { type: 'professional', label: 'Professional' },
    { type: 'knowledgeable', label: 'Knowledgeable' }, { type: 'easy_process', label: 'Easy Process' },
  ],
  nonprofit: [
    { type: 'trusted_cause', label: 'Trusted Cause' }, { type: 'community_impact', label: 'Community Impact' },
    { type: 'volunteer_friendly', label: 'Volunteer Friendly' }, { type: 'transparent', label: 'Transparent' },
    { type: 'strong_mission', label: 'Strong Mission' },
  ],
  childcare: [
    { type: 'caring_staff', label: 'Caring Staff' }, { type: 'safe', label: 'Safe Environment' },
    { type: 'parent_trusted', label: 'Parent Trusted' }, { type: 'great_communication', label: 'Great Communication' },
    { type: 'warm', label: 'Warm Atmosphere' },
  ],
  artist_maker: [
    { type: 'creative', label: 'Creative' }, { type: 'beautiful_work', label: 'Beautiful Work' },
    { type: 'original', label: 'Original' }, { type: 'inspiring', label: 'Inspiring' },
  ],
  event_venue: [
    { type: 'beautiful_space', label: 'Beautiful Space' }, { type: 'great_atmosphere', label: 'Great Atmosphere' },
    { type: 'easy_planning', label: 'Easy Planning' },
  ],
  community_org: [
    { type: 'community_driven', label: 'Community Driven' }, { type: 'impactful', label: 'Impactful' },
    { type: 'welcoming', label: 'Welcoming' },
  ],
};

export function reactionOptionsFor(category: BusinessCategory): SignalOption[] {
  const extra = BY_CATEGORY[category] ?? [];
  const seen = new Set(UNIVERSAL.map((o) => o.type));
  return [...UNIVERSAL, ...extra.filter((o) => !seen.has(o.type))];
}

// Label lookup for any reaction type (covers aggregated/legacy types).
export const REACTION_LABELS: Record<string, string> = (() => {
  const all = [...UNIVERSAL, ...Object.values(BY_CATEGORY).flat()];
  const map: Record<string, string> = {};
  for (const o of all) if (o) map[o.type] = o.label;
  return map;
})();

export function reactionLabel(type: string): string {
  return REACTION_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// "Known For" trait phrase per reaction type.
const KNOWN_FOR: Record<string, string> = {
  great_staff: 'Friendly staff', welcoming: 'Welcoming atmosphere', cozy: 'Cozy space',
  authentic: 'Authentic experience', community_staple: 'Community involvement', local_favorite: 'Neighborhood favorite',
  great_food: 'Great food', fast_lunch: 'Fast service', family_favorite: 'Family-friendly experience',
  quality_work: 'Reliable work', beautiful_shop: 'Beautiful space', beautiful_space: 'Beautiful space',
  unique_finds: 'Unique finds', local_makers: 'Local makers', creative: 'Creative atmosphere',
  caring_staff: 'Caring staff', safe: 'Safe environment', trusted_cause: 'Trusted cause',
  great_coaches: 'Great coaches', skilled: 'Skilled work', professional: 'Personal, professional service',
};

export function knownForTrait(type: string): string {
  return KNOWN_FOR[type] ?? reactionLabel(type);
}

// Short, warm "What Locals Love" line per reaction type.
const LOVE_SENTENCES: Record<string, string> = {
  great_staff: 'People love the friendly staff.',
  welcoming: 'Known for a warm, welcoming atmosphere.',
  cozy: 'A cozy spot locals keep coming back to.',
  hidden_gem: 'Locals call this a true hidden gem.',
  community_staple: 'A neighborhood staple with loyal regulars.',
  fast_lunch: 'A favorite for quick lunch breaks.',
  family_favorite: 'A go-to for family visits.',
  great_food: 'People rave about the food.',
  authentic: 'Locals say this place feels real and personal.',
  worth_the_drive: 'Regulars say it’s worth the drive.',
  date_night: 'A favorite date-night spot.',
  good_vibes: 'People come here for the good vibes.',
  caring_staff: 'Parents trust the caring staff here.',
  reliable: 'Locals count on them to get the job done.',
  unique_finds: 'Shoppers love the unique local finds.',
};

export function loveSentence(type: string): string {
  return LOVE_SENTENCES[type] ?? `People love that it’s ${reactionLabel(type).toLowerCase()}.`;
}

// Reputation badge a reaction can earn once it crosses the threshold.
export const BADGE_THRESHOLD = 3;
const BADGE_FOR_REACTION: Record<string, string> = {
  hidden_gem: 'Hidden Gem', community_staple: 'Toledo Staple', local_favorite: 'Neighborhood Favorite',
  welcoming: 'Most Welcoming', good_vibes: 'Best Atmosphere', great_atmosphere: 'Best Atmosphere',
  family_favorite: 'Family Favorite', worth_the_drive: 'Worth the Drive', fast_lunch: 'Fast Favorite',
  creative: 'Local Creative Hub', cozy: 'Quiet Escape', community_driven: 'Community Anchor',
};

export function badgeForReaction(type: string): string | null {
  return BADGE_FOR_REACTION[type] ?? null;
}

export interface RecommendationPrompt {
  type: string;
  question: string;
  stat: string;
}

export const RECOMMENDATION_PROMPTS: RecommendationPrompt[] = [
  { type: 'friend', question: 'Would you bring a friend here?', stat: 'would bring a friend here' },
  { type: 'family', question: 'Would you bring family here?', stat: 'would bring family here' },
  { type: 'visitor', question: 'Recommend to someone new to Toledo?', stat: 'would recommend to a visitor' },
  { type: 'return', question: 'Would you come back?', stat: 'would come back' },
];
