import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionTier, SUBSCRIPTION_TIERS, canAccessFeature, TierConfig } from '@/lib/subscription-tiers';

interface SubscriptionContextType {
  tier: SubscriptionTier;
  tierConfig: TierConfig;
  isLoading: boolean;
  subscriptionEnd: string | null;
  refreshSubscription: () => Promise<void>;
  canAccess: (feature: keyof TierConfig['limits']) => boolean;
  isSubscribed: boolean;
  ensureLoaded: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const loadedForUser = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setTier('free');
      setSubscriptionEnd(null);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!error && data) {
        setTier(data.tier as SubscriptionTier || 'free');
        setSubscriptionEnd(data.subscription_end);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const ensureLoaded = useCallback(() => {
    if (!user) return;
    if (loadedForUser.current === user.id) return;
    loadedForUser.current = user.id;
    refreshSubscription();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(refreshSubscription, 60000);
  }, [user, refreshSubscription]);

  // Reset on user change
  useEffect(() => {
    if (!user) {
      loadedForUser.current = null;
      setTier('free');
      setSubscriptionEnd(null);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    } else {
      loadedForUser.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally depend on user?.id rather than the full user object to reset state only on user identity changes
  }, [user?.id]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const canAccess = useCallback((feature: keyof TierConfig['limits']) => canAccessFeature(tier, feature), [tier]);
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  const isSubscribed = tier !== 'free';

  return (
    <SubscriptionContext.Provider value={{ tier, tierConfig, isLoading, subscriptionEnd, refreshSubscription, canAccess, isSubscribed, ensureLoaded }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    return {
      tier: 'free' as const,
      tierConfig: SUBSCRIPTION_TIERS['free'],
      isLoading: true,
      subscriptionEnd: null,
      refreshSubscription: async () => {},
      canAccess: () => false,
      isSubscribed: false,
      ensureLoaded: () => {},
    };
  }
  return context;
}
