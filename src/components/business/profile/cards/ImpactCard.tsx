import { TrendingUp, Users, Heart, Calendar, DollarSign, Award, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FlipCard } from '../FlipCard';

interface ImpactCardProps {
  businessId: string;
}

interface ImpactMetric {
  label: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
}

export function ImpactCard({ businessId }: ImpactCardProps) {
  // Fetch Loop transaction stats
  const { data: loopStats, isLoading: isLoadingLoop } = useQuery({
    queryKey: ['business-loop-stats-flip', businessId],
    queryFn: async () => {
      const { data: transactions } = await supabase
        .from('loop_transactions')
        .select('points')
        .eq('business_id', businessId)
        .eq('transaction_type', 'earn');

      const totalPoints = transactions?.reduce((sum, t) => sum + t.points, 0) || 0;

      const { data: qrCodes } = await supabase
        .from('loop_qr_codes')
        .select('total_scans')
        .eq('business_id', businessId);

      const totalScans = qrCodes?.reduce((sum, q) => sum + (q.total_scans || 0), 0) || 0;

      return { totalPoints, totalScans };
    },
    enabled: !!businessId,
  });

  // Fetch event count
  const { data: eventCount, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['business-event-count-flip', businessId],
    queryFn: async () => {
      const { count } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'approved');

      return count || 0;
    },
    enabled: !!businessId,
  });

  const isLoading = isLoadingLoop || isLoadingEvents;
  const hasData = loopStats && (loopStats.totalPoints > 0 || loopStats.totalScans > 0 || (eventCount && eventCount > 0));

  const metrics: ImpactMetric[] = [];

  if (loopStats?.totalPoints && loopStats.totalPoints > 0) {
    metrics.push({
      label: 'Loop Points Given',
      value: loopStats.totalPoints.toLocaleString(),
      icon: TrendingUp,
      description: 'Rewarding local customers'
    });
  }

  if (loopStats?.totalScans && loopStats.totalScans > 0) {
    metrics.push({
      label: 'Customer Check-ins',
      value: loopStats.totalScans,
      icon: Users,
      description: 'Locals who visited'
    });
  }

  if (eventCount && eventCount > 0) {
    metrics.push({
      label: 'Events Hosted',
      value: eventCount,
      icon: Calendar,
      description: 'Community gatherings'
    });
  }

  return (
    <FlipCard title="Community Impact">
      <div className="flex flex-col h-full justify-center">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : hasData ? (
          <div className="space-y-4">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-5 rounded-2xl bg-card border border-border/50 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <metric.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-sm font-medium text-foreground">{metric.label}</p>
                  {metric.description && (
                    <p className="text-xs text-muted-foreground">{metric.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-muted/50 border border-dashed border-border">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Impact Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              We're tracking the local impact of this business. Check back soon to see their community contributions.
            </p>
          </div>
        )}
      </div>
    </FlipCard>
  );
}
