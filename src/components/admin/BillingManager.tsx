import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CreditCard,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface BillingManagerProps {
  businessId: string;
}

interface BusinessBilling {
  tier_status: string | null;
  founding_number: number | null;
  name: string;
}

const TIER_INFO: Record<string, { label: string; description: string; className: string }> = {
  founding_5: {
    label: 'Founding 5',
    description: 'Free forever -- thank you for being one of the first five.',
    className: 'bg-amber-100 text-amber-800',
  },
  founding_50: {
    label: 'Founding 50',
    description: 'Launch pricing locked in. Early supporter benefits included.',
    className: 'bg-amber-100 text-amber-800',
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
        .select('tier_status, founding_number, name')
        .eq('id', businessId)
        .single();
      if (error) throw error;
      return data as BusinessBilling;
    },
    enabled: !!businessId,
  });
}

export function BillingManager({ businessId }: BillingManagerProps) {
  const { tier, tierConfig, isLoading: subLoading, subscriptionEnd } = useSubscription();
  const { data: billing, isLoading } = useBusinessBilling(businessId);

  if (isLoading || subLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tierStatus = billing?.tier_status || 'community';
  const info = TIER_INFO[tierStatus] || TIER_INFO.community;
  const isFounder = tierStatus === 'founding_5' || tierStatus === 'founding_50';

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
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
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
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm font-medium text-amber-900">
              Founding member #{billing.founding_number}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Your founding status is permanent and includes all premium features.
            </p>
          </div>
        )}

        {subscriptionEnd && !isFounder && (
          <div className="text-sm text-muted-foreground">
            {tier === 'free' ? 'No active subscription' : (
              <>Current period ends {new Date(subscriptionEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</>
            )}
          </div>
        )}
      </div>

      {/* Plan features */}
      <div className="card-elevated p-5 space-y-3">
        <h3 className="font-semibold text-sm">Included in your plan</h3>
        <div className="space-y-2">
          {tierConfig.features.map((feature, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan limits */}
      <div className="card-elevated p-5 space-y-3">
        <h3 className="font-semibold text-sm">Plan limits</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <PlanLimitRow label="Deals" value={tierConfig.limits.deals === -1 ? 'Unlimited' : String(tierConfig.limits.deals)} />
          <PlanLimitRow label="Events" value={tierConfig.limits.events === -1 ? 'Unlimited' : String(tierConfig.limits.events)} />
          <PlanLimitRow label="Jobs" value={tierConfig.limits.jobs === -1 ? 'Unlimited' : String(tierConfig.limits.jobs)} />
          <PlanLimitRow label="Pulse posts/day" value={String(tierConfig.limits.pulsePostsPerDay)} />
          <PlanLimitRow label="Active offers" value={String(tierConfig.limits.maxActiveOffers)} />
          <PlanLimitRow label="Featured placement" value={tierConfig.limits.featuredPlacement ? 'Yes' : 'No'} />
          <PlanLimitRow label="Analytics" value={tierConfig.limits.analytics ? 'Full' : 'Basic'} />
          <PlanLimitRow label="Priority support" value={tierConfig.limits.prioritySupport ? 'Yes' : 'No'} />
        </div>
      </div>

      {/* Upgrade CTA */}
      {tier === 'free' && (
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
