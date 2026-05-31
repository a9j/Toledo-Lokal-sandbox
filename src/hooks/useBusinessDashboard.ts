import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  profileViews: number;
  saves: number;
  websiteClicks: number;
  phoneClicks: number;
  directionRequests: number;
  checkins: number;
  eventViews: number;
  dealViews: number;
  jobViews: number;
  followers: number;
}

export function useBusinessDashboard(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-dashboard-stats', businessId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!businessId) throw new Error('No business ID');

      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('event_type')
        .eq('business_id', businessId);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const e of events ?? []) {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
      }

      const { count: followerCount } = await supabase
        .from('business_follows')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId);

      return {
        profileViews: counts['profile_view'] || 0,
        saves: counts['profile_save'] || 0,
        websiteClicks: counts['website_click'] || 0,
        phoneClicks: counts['phone_click'] || 0,
        directionRequests: counts['direction_request'] || 0,
        checkins: counts['checkin'] || 0,
        eventViews: counts['event_view'] || 0,
        dealViews: counts['deal_view'] || 0,
        jobViews: counts['job_view'] || 0,
        followers: followerCount || 0,
      };
    },
    enabled: !!businessId,
    staleTime: 30_000,
  });
}
