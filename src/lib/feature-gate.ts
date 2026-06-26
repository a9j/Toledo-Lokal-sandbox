import { supabase } from '@/integrations/supabase/client';

type Feature =
  | 'profile'
  | 'pulse'
  | 'events'
  | 'deals'
  | 'passport'
  | 'jobs'
  | 'analytics'
  | 'featured_placement';

const BASIC_FEATURES: Record<Feature, boolean | string> = {
  profile: true,
  pulse: false,
  events: false,
  deals: false,
  passport: false,
  jobs: false,
  analytics: false,
  featured_placement: false,
};

const PLAN_FEATURES: Record<string, Record<Feature, boolean | string>> = {
  basic: BASIC_FEATURES,
  enhanced: {
    profile: true,
    pulse: true,
    events: true,
    deals: true,
    passport: false,
    jobs: true,
    analytics: 'basic',
    featured_placement: false,
  },
  pro: {
    profile: true,
    pulse: true,
    events: true,
    deals: true,
    passport: true,
    jobs: true,
    analytics: 'full',
    featured_placement: true,
  },
};

const PLAN_ANNOUNCEMENT_LIMITS: Record<string, number> = {
  basic: 0,
  enhanced: 4,
  pro: 12,
};

export function isFeatureEnabled(plan: string, feature: Feature): boolean {
  const features = PLAN_FEATURES[plan] ?? BASIC_FEATURES;
  return !!features[feature];
}

export function getAnnouncementLimit(plan: string): number {
  return PLAN_ANNOUNCEMENT_LIMITS[plan] ?? 0;
}

export function getAnalyticsLevel(plan: string): false | 'basic' | 'full' {
  const features = PLAN_FEATURES[plan] ?? BASIC_FEATURES;
  const val = features.analytics;
  if (val === 'basic' || val === 'full') return val;
  return false;
}

export async function getBusinessPlan(businessId: string): Promise<string> {
  const { data } = await supabase
    .from('businesses')
    .select('plan')
    .eq('id', businessId)
    .single();
  return (data as { plan?: string } | null)?.plan ?? 'basic';
}
