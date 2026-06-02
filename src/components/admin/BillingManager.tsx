import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_TIERS, FOUNDING_TIERS, type SubscriptionTier, type TierConfig } from '@/lib/subscription-tiers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CreditCard,
  CheckCircle,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BillingManagerProps {
  businessId: string;
}

interface BusinessBilling {
  tier_status: string | null;
  founding_number: number | null;
  tier_assigned_at: string | null;
  name: string;
}

const TIER_INFO: Record<string, { label: string; description: string; className: string }> = {
  founding_5: {
    label: 'Founding 5',
    description: 'Free forever — thank you for being one of the first five.',
    className: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950',
  },
  founding_50: {
    label: 'Founding 50',
    description: 'Free forever — launch pricing locked in. Early supporter benefits included.',
    className: 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-900',
  },
  pro: {
    label: 'Pro / Anchor',
    description: 'Full access to Pulse, Events, Deals, Passport, Jobs, Analytics, and all premium features.',
    className: 'bg-primary/10 text-primary',
  },
  growth: {
    label: 'Growth',
    description: 'Growing your reach with enhanced features, more posts, and advanced tools.',
    className: 'bg-emerald-100 text-emerald-800',
  },
  community: {
    label: 'Community',
    description: 'Free plan with essential profile, category listing, and basic visibility.',
    className: 'bg-slate-100 text-slate-700',
  },
};

function useBusinessBilling(businessId: string) {
  return useQuery({
    queryKey: ['admin-billing', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('tier_status, founding_number, tier_assigned_at, name')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data as BusinessBilling;
    },
    enabled: !!businessId,
  });
}

function tierStatusToSubscriptionTier(tierStatus: string): SubscriptionTier {
  if (tierStatus === 'founding_5' || tierStatus === 'pro') return 'pro';
  if (tierStatus === 'founding_50' || tierStatus === 'growth') return 'growth';
  return 'free';
}

export function BillingManager({ businessId }: BillingManagerProps) {
  const { data: billing, isLoading } = useBusinessBilling(businessId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tierStatus = billing?.tier_status || 'community';
  const info = TIER_INFO[tierStatus] || TIER_INFO.community;
  const isFounder = tierStatus === 'founding_5' || tierStatus === 'founding_50';
  const isF5 = tierStatus === 'founding_5';
  const isF50 = tierStatus === 'founding_50';
  const tier = tierStatusToSubscriptionTier(tierStatus);
  const tierConfig: TierConfig = SUBSCRIPTION_TIERS[tier];

  const foundingConfig = isF5 ? FOUNDING_TIERS.founding_5 : isF50 ? FOUNDING_TIERS.founding_50 : null;
  const features = foundingConfig ? foundingConfig.features : tierConfig.features;
  const estYear = billing?.tier_assigned_at
    ? new Date(billing.tier_assigned_at).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Your plan and subscription details.
        </p>
      </div>

      {/* Current plan */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              isF5 ? 'bg-gradient-to-br from-amber-500 to-yellow-400' :
              isF50 ? 'bg-gradient-to-br from-slate-400 to-slate-300' :
              'bg-primary/10'
            )}>
              {isFounder ? (
                <Shield className={cn('h-6 w-6 fill-current', isF5 ? 'text-amber-950' : 'text-slate-900')} />
              ) : (
                <CreditCard className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{info.label}</h3>
                <Badge variant="outline" className={cn('text-xs', info.className)}>
                  Current plan
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{info.description}</p>
            </div>
          </div>
        </div>

        {isFounder && billing?.founding_number && (
          <div className={cn(
            'rounded-xl border p-3',
            isF5 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
          )}>
            <p className={cn('text-sm font-medium', isF5 ? 'text-amber-900' : 'text-slate-900')}>
              {isF5 ? 'Founding 5' : 'Founding 50'} member #{billing.founding_number} — Est. {estYear}
            </p>
            <p className={cn('text-xs mt-0.5', isF5 ? 'text-amber-700' : 'text-slate-600')}>
              Your founding status is permanent and includes all {isF5 ? 'premium' : 'core'} features at no cost.
            </p>
          </div>
        )}

        {!isFounder && (
          <div className="text-sm text-muted-foreground">
            {tier === 'free' ? 'No active subscription' : 'Active subscription'}
          </div>
        )}
      </div>

      {/* Founding advisory note */}
      {isFounder && (
        <div className="card-elevated p-5 space-y-2">
          <h3 className="font-semibold text-sm">
            {isF5 ? 'Founding Business Advisory' : 'Advisory Participation'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isF5
              ? "You have a full advisory seat with direct input on platform direction. You'll be consulted on major product decisions and new feature rollouts."
              : "Your voice informs platform direction. You'll receive updates and opportunities to share feedback on the platform's evolution."}
          </p>
        </div>
      )}

      {/* Plan features */}
      <div className="card-elevated p-5 space-y-3">
        <h3 className="font-semibold text-sm">Included in your plan</h3>
        <div className="space-y-2">
          {features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className={cn(
                'h-4 w-4 shrink-0 mt-0.5',
                isF5 ? 'text-amber-600' : isF50 ? 'text-slate-500' : 'text-emerald-600'
              )} />
              <p className="text-sm text-foreground/80">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan limits */}
      <div className="card-elevated p-5 space-y-3">
        <h3 className="font-semibold text-sm">Plan limits</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {foundingConfig ? (
            <>
              <PlanLimitRow label="Deals" value="Unlimited" />
              <PlanLimitRow label="Events" value="Unlimited" />
              <PlanLimitRow label="Jobs" value="Unlimited" />
              <PlanLimitRow label="Pulse posts/day" value={String(foundingConfig.limits.pulsePostsPerDay)} />
              <PlanLimitRow label="Active offers" value="Unlimited" />
              <PlanLimitRow label="Featured placement" value="Yes" />
              <PlanLimitRow label="Analytics" value={isF5 ? 'Full' : 'Standard'} />
              <PlanLimitRow label="Loop multiplier cap" value={`${foundingConfig.maxMultiplier}×`} />
              <PlanLimitRow label="Priority support" value={isF5 ? 'Yes' : 'No'} />
              <PlanLimitRow label="Cost" value="Free forever" />
            </>
          ) : (
            <>
              <PlanLimitRow label="Deals" value={tierConfig.limits.deals === -1 ? 'Unlimited' : String(tierConfig.limits.deals)} />
              <PlanLimitRow label="Events" value={tierConfig.limits.events === -1 ? 'Unlimited' : String(tierConfig.limits.events)} />
              <PlanLimitRow label="Jobs" value={tierConfig.limits.jobs === -1 ? 'Unlimited' : String(tierConfig.limits.jobs)} />
              <PlanLimitRow label="Pulse posts/day" value={String(tierConfig.limits.pulsePostsPerDay)} />
              <PlanLimitRow label="Active offers" value={tierConfig.limits.maxActiveOffers === -1 ? 'Unlimited' : String(tierConfig.limits.maxActiveOffers)} />
              <PlanLimitRow label="Featured placement" value={tierConfig.limits.featuredPlacement ? 'Yes' : 'No'} />
              <PlanLimitRow label="Analytics" value={tierConfig.limits.analytics ? 'Full' : 'Basic'} />
              <PlanLimitRow label="Priority support" value={tierConfig.limits.prioritySupport ? 'Yes' : 'No'} />
            </>
          )}
        </div>
      </div>

      {/* Upgrade CTA */}
      {tier === 'free' && !isFounder && (
        <Link to="/dashboard/subscription">
          <div className="card-elevated p-5 flex items-center gap-3 border-dashed border-2 hover-lift cursor-pointer">
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Upgrade your plan</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Unlock Pulse, events, deals, passport, and more with Growth or Pro.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      )}

      {/* Manage subscription link */}
      {tier !== 'free' && !isFounder && (
        <Link to="/dashboard/subscription">
          <Button variant="outline" className="w-full gap-1.5">
            <CreditCard className="h-4 w-4" />
            Manage subscription
          </Button>
        </Link>
      )}
    </div>
  );
}

function PlanLimitRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
