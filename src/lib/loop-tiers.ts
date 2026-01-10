export type LoopTierId = 'visible_only' | 'loop_starter' | 'loop_growth' | 'loop_partner';

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
  visible_only: {
    id: 'visible_only',
    name: 'Loop-Visible Only',
    price: 0,
    pointsCap: 0,
    features: [
      'Business listing',
      'Events and description',
      'Contact info',
      'No points issued',
      'No points accepted'
    ],
    canCreateMissions: false,
    canSponsorMissions: false,
    stripePriceId: null
  },
  loop_starter: {
    id: 'loop_starter',
    name: 'Loop Starter',
    price: 29,
    pointsCap: 500,
    features: [
      'Universal Loop participation',
      'Business profile',
      'QR code issuance',
      'Issue Loop Points',
      'Accept redemptions',
      'Basic reward setup',
      'Basic analytics'
    ],
    canCreateMissions: false,
    canSponsorMissions: false,
    stripePriceId: null // Set when Stripe products are created
  },
  loop_growth: {
    id: 'loop_growth',
    name: 'Loop Growth',
    price: 79,
    pointsCap: 2000,
    features: [
      'Everything in Starter',
      'Higher point caps',
      'Citywide missions',
      'Featured discovery',
      'Referral rewards',
      'Experience rewards',
      'Advanced analytics'
    ],
    canCreateMissions: true,
    canSponsorMissions: false,
    stripePriceId: null
  },
  loop_partner: {
    id: 'loop_partner',
    name: 'Loop Partner',
    price: 149,
    pointsCap: 5000,
    features: [
      'Everything in Growth',
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

export const getLoopTierById = (id: LoopTierId | string | null): LoopTierConfig => {
  if (!id || !(id in LOOP_TIERS)) return LOOP_TIERS.visible_only;
  return LOOP_TIERS[id as LoopTierId];
};

export const isLoopParticipant = (tierId: LoopTierId | string | null): boolean => {
  return tierId !== null && tierId !== 'visible_only';
};
