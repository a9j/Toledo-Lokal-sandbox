// Loop Lokal Reward Templates
// Businesses choose from these predefined templates - no custom discounts allowed

export interface RewardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'perk' | 'experience' | 'service_credit';
  minPoints: number;
  maxPoints: number;
  suggestedPoints: number;
}

// Point bands per category - these protect the system
export const POINT_BANDS = {
  perk: { min: 50, max: 500 },
  experience: { min: 200, max: 2000 },
  service_credit: { min: 100, max: 1000 },
} as const;

// Reward templates - businesses select from these
export const REWARD_TEMPLATES: RewardTemplate[] = [
  // PERKS
  {
    id: 'free_item',
    name: 'Free Item',
    description: 'One free item of your choice',
    category: 'perk',
    minPoints: 50,
    maxPoints: 300,
    suggestedPoints: 100,
  },
  {
    id: 'free_addon',
    name: 'Free Add-on',
    description: 'A complimentary add-on with your order',
    category: 'perk',
    minPoints: 50,
    maxPoints: 200,
    suggestedPoints: 75,
  },
  {
    id: 'upgrade',
    name: 'Free Upgrade',
    description: 'Upgrade to the next size or level',
    category: 'perk',
    minPoints: 50,
    maxPoints: 200,
    suggestedPoints: 100,
  },
  {
    id: 'priority_service',
    name: 'Priority Service',
    description: 'Skip the line or get priority treatment',
    category: 'perk',
    minPoints: 100,
    maxPoints: 400,
    suggestedPoints: 150,
  },
  {
    id: 'guest_pass',
    name: 'Guest Pass',
    description: 'Bring a guest for free',
    category: 'perk',
    minPoints: 150,
    maxPoints: 500,
    suggestedPoints: 200,
  },
  
  // EXPERIENCES
  {
    id: 'vip_access',
    name: 'VIP Access',
    description: 'Exclusive VIP treatment',
    category: 'experience',
    minPoints: 300,
    maxPoints: 1500,
    suggestedPoints: 500,
  },
  {
    id: 'invite_only_event',
    name: 'Invite-Only Event',
    description: 'Access to a special private event',
    category: 'experience',
    minPoints: 400,
    maxPoints: 2000,
    suggestedPoints: 750,
  },
  {
    id: 'early_access',
    name: 'Early Access',
    description: 'Get early access to new products or services',
    category: 'experience',
    minPoints: 200,
    maxPoints: 1000,
    suggestedPoints: 400,
  },
  {
    id: 'limited_edition',
    name: 'Limited Edition Item',
    description: 'Access to exclusive, limited-run items',
    category: 'experience',
    minPoints: 500,
    maxPoints: 2000,
    suggestedPoints: 1000,
  },
  
  // SERVICE CREDITS
  {
    id: 'service_credit_25',
    name: '$25 Service Credit',
    description: 'Credit toward a future service',
    category: 'service_credit',
    minPoints: 200,
    maxPoints: 400,
    suggestedPoints: 250,
  },
  {
    id: 'service_credit_50',
    name: '$50 Service Credit',
    description: 'Credit toward a future service',
    category: 'service_credit',
    minPoints: 400,
    maxPoints: 700,
    suggestedPoints: 500,
  },
  {
    id: 'free_inspection',
    name: 'Free Inspection/Consultation',
    description: 'Complimentary inspection or consultation',
    category: 'service_credit',
    minPoints: 100,
    maxPoints: 500,
    suggestedPoints: 200,
  },
  {
    id: 'priority_scheduling',
    name: 'Priority Scheduling',
    description: 'Get preferred appointment times',
    category: 'service_credit',
    minPoints: 150,
    maxPoints: 400,
    suggestedPoints: 200,
  },
];

export const CATEGORY_LABELS = {
  perk: 'Perks',
  experience: 'Experiences',
  service_credit: 'Service Credits',
} as const;

export const CATEGORY_DESCRIPTIONS = {
  perk: 'Simple thank-you rewards like free items or upgrades',
  experience: 'Special access and exclusive experiences',
  service_credit: 'Credits for service-based businesses',
} as const;

export function getTemplatesByCategory(category: 'perk' | 'experience' | 'service_credit') {
  return REWARD_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string) {
  return REWARD_TEMPLATES.find(t => t.id === id);
}
