import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getJobsLimit, getJobExpirationDays } from '@/lib/subscription-tiers';

interface JobLimits {
  maxJobs: number;
  activeJobsCount: number;
  canPostJob: boolean;
  remainingSlots: number;
  expirationDays: number;
  hasJobBadge: boolean;
  hasJobAnalytics: boolean;
}

export function useJobLimits(businessId: string | undefined) {
  const { tier, tierConfig } = useSubscription();

  const { data: activeJobsCount = 0, isLoading } = useQuery({
    queryKey: ['active-jobs-count', businessId],
    queryFn: async () => {
      if (!businessId) return 0;
      
      const { count, error } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['pending', 'approved']);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!businessId,
  });

  const maxJobs = getJobsLimit(tier);
  const expirationDays = getJobExpirationDays(tier);
  const isUnlimited = maxJobs === -1;
  const remainingSlots = isUnlimited ? Infinity : Math.max(0, maxJobs - activeJobsCount);
  const canPostJob = isUnlimited || activeJobsCount < maxJobs;

  const limits: JobLimits = {
    maxJobs: isUnlimited ? Infinity : maxJobs,
    activeJobsCount,
    canPostJob,
    remainingSlots,
    expirationDays,
    hasJobBadge: tierConfig.limits.jobBadge,
    hasJobAnalytics: tierConfig.limits.jobAnalytics,
  };

  return {
    ...limits,
    isLoading,
  };
}
