import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_TIERS, FOUNDING_TIERS, SubscriptionTier } from '@/lib/subscription-tiers';
import { PricingCard } from './PricingCard';

// Founding businesses receive a paid plan free through their membership. Map the
// founding tier_status to the subscription tier it includes so the view reflects
// the effective plan instead of defaulting to the Stripe-derived Community tier.
const FOUNDING_INCLUDED_TIER: Record<'founding_5' | 'founding_50', SubscriptionTier> = {
  founding_5: 'pro',
  founding_50: 'growth',
};

interface SubscriptionManagerProps {
  // The owner's business tier_status, fetched at the page level. When this is a
  // founding tier we override the display only; the Stripe-derived subscription
  // logic is untouched for everyone else.
  foundingTierStatus?: string | null;
}

export function SubscriptionManager({ foundingTierStatus = null }: SubscriptionManagerProps) {
  const { user, session } = useAuth();
  const { tier, tierConfig, subscriptionEnd, refreshSubscription, isLoading: subscriptionLoading, ensureLoaded } = useSubscription();
  useEffect(() => { ensureLoaded(); }, [ensureLoaded]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string) => {
    if (!user || !session) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session) return;

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Portal error:', err);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const tiers = Object.values(SUBSCRIPTION_TIERS) as typeof SUBSCRIPTION_TIERS[SubscriptionTier][];

  const isFounding = foundingTierStatus === 'founding_5' || foundingTierStatus === 'founding_50';
  const foundingKey = isFounding ? (foundingTierStatus as 'founding_5' | 'founding_50') : null;
  const includedTier = foundingKey ? FOUNDING_INCLUDED_TIER[foundingKey] : null;
  const foundingMembershipName = foundingKey ? FOUNDING_TIERS[foundingKey].name : null;
  const includedConfig = includedTier ? SUBSCRIPTION_TIERS[includedTier] : null;

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Current Subscription
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshSubscription}
              disabled={subscriptionLoading}
            >
              <RefreshCw className={`h-4 w-4 ${subscriptionLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          {isFounding && includedConfig ? (
            <CardDescription>
              You are on the <strong>{includedConfig.name}</strong> plan, included free through your{' '}
              <strong>{foundingMembershipName}</strong> membership
            </CardDescription>
          ) : (
            <CardDescription>
              You are currently on the <strong>{tierConfig.name}</strong> plan
              {subscriptionEnd && (
                <span className="block mt-1">
                  Renews on {new Date(subscriptionEnd).toLocaleDateString()}
                </span>
              )}
            </CardDescription>
          )}
        </CardHeader>
        {!isFounding && tier !== 'free' && (
          <CardContent>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              <Settings className="h-4 w-4 mr-2" />
              {portalLoading ? 'Loading...' : 'Manage Subscription'}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Pricing Grid - 1 column mobile, 2 columns tablet, 2 on medium desktop, 4 on large */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-4">
        {tiers.map((tierItem) => (
          <PricingCard
            key={tierItem.id}
            tierConfig={tierItem}
            currentTier={tier}
            onSelect={handleSubscribe}
            isLoading={checkoutLoading}
            includedThroughFounding={includedTier === tierItem.id}
            foundingMembershipName={foundingMembershipName}
          />
        ))}
      </div>
    </div>
  );
}
