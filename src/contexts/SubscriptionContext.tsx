import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionTier, SUBSCRIPTION_TIERS, getTierByProductId, canAccessFeature, TierConfig } from '@/lib/subscription-tiers';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  tierConfig: TierConfig;
  isLoading: boolean;
  subscriptionEnd: string | null;
  refreshSubscription: () => Promise<void>;
  canAccess: (feature: keyof TierConfig['limits']) => boolean;
  isSubscribed: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setTier('free');
      setSubscriptionEnd(null);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data) {
        const newTier = data.tier as SubscriptionTier || 'free';
        setTier(newTier);
        setSubscriptionEnd(data.subscription_end);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user) {
      refreshSubscription();
    } else {
      setTier('free');
      setSubscriptionEnd(null);
    }
  }, [user, refreshSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [user, refreshSubscription]);

  const canAccess = useCallback((feature: keyof TierConfig['limits']) => {
    return canAccessFeature(tier, feature);
  }, [tier]);

  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const isSubscribed = tier !== 'free';

  return (
    <SubscriptionContext.Provider value={{
      tier,
      tierConfig,
      isLoading,
      subscriptionEnd,
      refreshSubscription,
      canAccess,
      isSubscribed,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
