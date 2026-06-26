export interface Subcategory {
  slug: string;
  label: string;
}

export interface CategoryConfig {
  slug: string;
  name: string;
  icon: string;
  sortOrder: number;
  subcategories: readonly string[];
}

const SUBCATEGORY_DEFINITIONS: Record<string, Subcategory> = {
  restaurants: { slug: 'restaurants', label: 'Restaurants' },
  coffee: { slug: 'coffee', label: 'Coffee Shops' },
  bars: { slug: 'bars', label: 'Bars' },
  breweries: { slug: 'breweries', label: 'Breweries' },
  bakeries: { slug: 'bakeries', label: 'Bakeries' },
  'food-trucks': { slug: 'food-trucks', label: 'Food Trucks' },
  desserts: { slug: 'desserts', label: 'Desserts' },
  catering: { slug: 'catering', label: 'Catering' },
  boutiques: { slug: 'boutiques', label: 'Boutiques' },
  clothing: { slug: 'clothing', label: 'Clothing' },
  gifts: { slug: 'gifts', label: 'Gifts' },
  bookstores: { slug: 'bookstores', label: 'Bookstores' },
  markets: { slug: 'markets', label: 'Markets' },
  'specialty-retail': { slug: 'specialty-retail', label: 'Specialty Retail' },
  'local-makers': { slug: 'local-makers', label: 'Local Makers' },
  gyms: { slug: 'gyms', label: 'Gyms' },
  yoga: { slug: 'yoga', label: 'Yoga' },
  'mental-health': { slug: 'mental-health', label: 'Mental Health' },
  doctors: { slug: 'doctors', label: 'Doctors' },
  dentists: { slug: 'dentists', label: 'Dentists' },
  chiropractors: { slug: 'chiropractors', label: 'Chiropractors' },
  'physical-therapy': { slug: 'physical-therapy', label: 'Physical Therapy' },
  nutrition: { slug: 'nutrition', label: 'Nutrition' },
  spas: { slug: 'spas', label: 'Spas' },
  barbers: { slug: 'barbers', label: 'Barbers' },
  'hair-salons': { slug: 'hair-salons', label: 'Hair Salons' },
  'nail-salons': { slug: 'nail-salons', label: 'Nail Salons' },
  estheticians: { slug: 'estheticians', label: 'Estheticians' },
  massage: { slug: 'massage', label: 'Massage' },
  'makeup-artists': { slug: 'makeup-artists', label: 'Makeup Artists' },
  'beauty-supply': { slug: 'beauty-supply', label: 'Beauty Supply' },
  contractors: { slug: 'contractors', label: 'Contractors' },
  plumbers: { slug: 'plumbers', label: 'Plumbers' },
  electricians: { slug: 'electricians', label: 'Electricians' },
  roofing: { slug: 'roofing', label: 'Roofing' },
  landscaping: { slug: 'landscaping', label: 'Landscaping' },
  cleaning: { slug: 'cleaning', label: 'Cleaning' },
  'interior-design': { slug: 'interior-design', label: 'Interior Design' },
  'pest-control': { slug: 'pest-control', label: 'Pest Control' },
  hvac: { slug: 'hvac', label: 'HVAC' },
  'auto-repair': { slug: 'auto-repair', label: 'Auto Repair' },
  dealerships: { slug: 'dealerships', label: 'Dealerships' },
  detailing: { slug: 'detailing', label: 'Detailing' },
  tires: { slug: 'tires', label: 'Tires' },
  towing: { slug: 'towing', label: 'Towing' },
  'car-washes': { slug: 'car-washes', label: 'Car Washes' },
  'collision-repair': { slug: 'collision-repair', label: 'Collision Repair' },
  museums: { slug: 'museums', label: 'Museums' },
  'music-venues': { slug: 'music-venues', label: 'Music Venues' },
  theaters: { slug: 'theaters', label: 'Theaters' },
  galleries: { slug: 'galleries', label: 'Galleries' },
  'creative-studios': { slug: 'creative-studios', label: 'Creative Studios' },
  attractions: { slug: 'attractions', label: 'Attractions' },
  nightlife: { slug: 'nightlife', label: 'Nightlife' },
  festivals: { slug: 'festivals', label: 'Festivals' },
  concerts: { slug: 'concerts', label: 'Concerts' },
  'pop-ups': { slug: 'pop-ups', label: 'Pop-ups' },
  classes: { slug: 'classes', label: 'Classes' },
  workshops: { slug: 'workshops', label: 'Workshops' },
  fundraisers: { slug: 'fundraisers', label: 'Fundraisers' },
  'community-events': { slug: 'community-events', label: 'Community Events' },
  nonprofits: { slug: 'nonprofits', label: 'Nonprofits' },
  'volunteer-opportunities': { slug: 'volunteer-opportunities', label: 'Volunteer Opportunities' },
  churches: { slug: 'churches', label: 'Churches' },
  'support-organizations': { slug: 'support-organizations', label: 'Support Organizations' },
  'youth-programs': { slug: 'youth-programs', label: 'Youth Programs' },
  'civic-groups': { slug: 'civic-groups', label: 'Civic Groups' },
  'community-centers': { slug: 'community-centers', label: 'Community Centers' },
  'law-firms': { slug: 'law-firms', label: 'Law Firms' },
  accounting: { slug: 'accounting', label: 'Accounting' },
  'real-estate': { slug: 'real-estate', label: 'Real Estate' },
  insurance: { slug: 'insurance', label: 'Insurance' },
  marketing: { slug: 'marketing', label: 'Marketing' },
  consulting: { slug: 'consulting', label: 'Consulting' },
  recruiting: { slug: 'recruiting', label: 'Recruiting' },
  'financial-services': { slug: 'financial-services', label: 'Financial Services' },
  daycares: { slug: 'daycares', label: 'Daycares' },
  schools: { slug: 'schools', label: 'Schools' },
  'kids-activities': { slug: 'kids-activities', label: 'Kids Activities' },
  tutoring: { slug: 'tutoring', label: 'Tutoring' },
  'family-services': { slug: 'family-services', label: 'Family Services' },
  parks: { slug: 'parks', label: 'Parks' },
  'parenting-resources': { slug: 'parenting-resources', label: 'Parenting Resources' },
  trails: { slug: 'trails', label: 'Trails' },
  sports: { slug: 'sports', label: 'Sports' },
  'fitness-groups': { slug: 'fitness-groups', label: 'Fitness Groups' },
  'outdoor-activities': { slug: 'outdoor-activities', label: 'Outdoor Activities' },
  'recreation-centers': { slug: 'recreation-centers', label: 'Recreation Centers' },
  'hidden-gems': { slug: 'hidden-gems', label: 'Hidden Gems' },
  'training-programs': { slug: 'training-programs', label: 'Training Programs' },
  'art-classes': { slug: 'art-classes', label: 'Art Classes' },
  'music-lessons': { slug: 'music-lessons', label: 'Music Lessons' },
  'career-training': { slug: 'career-training', label: 'Career Training' },
  'adult-education': { slug: 'adult-education', label: 'Adult Education' },
  'local-jobs': { slug: 'local-jobs', label: 'Local Jobs' },
  internships: { slug: 'internships', label: 'Internships' },
  'volunteer-roles': { slug: 'volunteer-roles', label: 'Volunteer Roles' },
  apprenticeships: { slug: 'apprenticeships', label: 'Apprenticeships' },
  'contractor-gigs': { slug: 'contractor-gigs', label: 'Contractor Gigs' },
  'hiring-businesses': { slug: 'hiring-businesses', label: 'Hiring Businesses' },
  printing: { slug: 'printing', label: 'Printing' },
  photography: { slug: 'photography', label: 'Photography' },
  'event-planning': { slug: 'event-planning', label: 'Event Planning' },
  'pet-services': { slug: 'pet-services', label: 'Pet Services' },
  moving: { slug: 'moving', label: 'Moving' },
  storage: { slug: 'storage', label: 'Storage' },
  'repair-services': { slug: 'repair-services', label: 'Repair Services' },
  miscellaneous: { slug: 'miscellaneous', label: 'Miscellaneous Local Services' },
} as const;

export const CATEGORIES: readonly CategoryConfig[] = [
  {
    slug: 'food-drink',
    name: 'Food & Drink',
    icon: 'utensils',
    sortOrder: 1,
    subcategories: ['restaurants', 'coffee', 'bars', 'breweries', 'bakeries', 'food-trucks', 'desserts', 'catering'],
  },
  {
    slug: 'shopping',
    name: 'Shopping',
    icon: 'shopping-bag',
    sortOrder: 2,
    subcategories: ['boutiques', 'clothing', 'gifts', 'bookstores', 'markets', 'specialty-retail', 'local-makers'],
  },
  {
    slug: 'health-wellness',
    name: 'Health & Wellness',
    icon: 'heart-pulse',
    sortOrder: 3,
    subcategories: ['gyms', 'yoga', 'mental-health', 'doctors', 'dentists', 'chiropractors', 'physical-therapy', 'nutrition', 'spas'],
  },
  {
    slug: 'beauty',
    name: 'Beauty & Personal Care',
    icon: 'sparkles',
    sortOrder: 4,
    subcategories: ['barbers', 'hair-salons', 'nail-salons', 'estheticians', 'massage', 'makeup-artists', 'beauty-supply'],
  },
  {
    slug: 'home-services',
    name: 'Home Services',
    icon: 'home',
    sortOrder: 5,
    subcategories: ['contractors', 'plumbers', 'electricians', 'roofing', 'landscaping', 'cleaning', 'interior-design', 'pest-control', 'hvac'],
  },
  {
    slug: 'automotive',
    name: 'Automotive',
    icon: 'car',
    sortOrder: 6,
    subcategories: ['auto-repair', 'dealerships', 'detailing', 'tires', 'towing', 'car-washes', 'collision-repair'],
  },
  {
    slug: 'arts-entertainment',
    name: 'Arts & Entertainment',
    icon: 'palette',
    sortOrder: 7,
    subcategories: ['museums', 'music-venues', 'theaters', 'galleries', 'creative-studios', 'attractions', 'nightlife'],
  },
  {
    slug: 'events',
    name: 'Events',
    icon: 'calendar',
    sortOrder: 8,
    subcategories: ['festivals', 'concerts', 'pop-ups', 'markets', 'classes', 'workshops', 'fundraisers', 'community-events'],
  },
  // Community & Nonprofits removed from browse categories.
  // Nonprofits and community partners now live in the dedicated Community tab,
  // gated by account_type and verification_status.
  {
    slug: 'professional-services',
    name: 'Professional Services',
    icon: 'briefcase',
    sortOrder: 10,
    subcategories: ['law-firms', 'accounting', 'real-estate', 'insurance', 'marketing', 'consulting', 'recruiting', 'financial-services'],
  },
  {
    slug: 'family-kids',
    name: 'Family & Kids',
    icon: 'baby',
    sortOrder: 11,
    subcategories: ['daycares', 'schools', 'kids-activities', 'tutoring', 'family-services', 'parks', 'parenting-resources'],
  },
  {
    slug: 'outdoors-recreation',
    name: 'Outdoors & Recreation',
    icon: 'mountain',
    sortOrder: 12,
    subcategories: ['parks', 'trails', 'sports', 'fitness-groups', 'outdoor-activities', 'recreation-centers', 'hidden-gems'],
  },
  {
    slug: 'education-classes',
    name: 'Education & Classes',
    icon: 'graduation-cap',
    sortOrder: 13,
    subcategories: ['schools', 'training-programs', 'workshops', 'art-classes', 'music-lessons', 'career-training', 'adult-education'],
  },
  {
    slug: 'jobs-opportunities',
    name: 'Jobs & Opportunities',
    icon: 'briefcase',
    sortOrder: 14,
    subcategories: ['local-jobs', 'internships', 'volunteer-roles', 'apprenticeships', 'contractor-gigs', 'hiring-businesses'],
  },
  {
    slug: 'local-services',
    name: 'Local Services',
    icon: 'wrench',
    sortOrder: 15,
    subcategories: ['printing', 'photography', 'event-planning', 'pet-services', 'moving', 'storage', 'repair-services', 'miscellaneous'],
  },
] as const;

export function getSubcategory(slug: string): Subcategory | undefined {
  return SUBCATEGORY_DEFINITIONS[slug];
}

export function getSubcategoriesForCategory(categorySlug: string): Subcategory[] {
  const category = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!category) return [];
  return category.subcategories
    .map((s) => SUBCATEGORY_DEFINITIONS[s])
    .filter(Boolean);
}

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getAllSubcategories(): Subcategory[] {
  return Object.values(SUBCATEGORY_DEFINITIONS);
}

export type CategorySlug = (typeof CATEGORIES)[number]['slug'];
export type SubcategorySlug = keyof typeof SUBCATEGORY_DEFINITIONS;
