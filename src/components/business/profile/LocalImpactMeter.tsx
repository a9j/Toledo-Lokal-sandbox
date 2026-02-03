import { TrendingUp, Users, Heart, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CollapsibleSection } from './CollapsibleSection';

interface LocalImpactMeterProps {
  businessId: string;
}

interface ImpactMetric {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export function LocalImpactMeter({ businessId }: LocalImpactMeterProps) {
  // Fetch Loop transaction stats
  const { data: loopStats } = useQuery({
    queryKey: ['business-loop-stats', businessId],
    queryFn: async () => {
      // Get total points issued
      const { data: transactions } = await supabase
        .from('loop_transactions')
        .select('points')
        .eq('business_id', businessId)
        .eq('transaction_type', 'earn');

      const totalPoints = transactions?.reduce((sum, t) => sum + t.points, 0) || 0;
      const uniqueVisitors = transactions?.length || 0;

      // Get QR scan count
      const { data: qrCodes } = await supabase
        .from('loop_qr_codes')
        .select('total_scans')
        .eq('business_id', businessId);

      const totalScans = qrCodes?.reduce((sum, q) => sum + (q.total_scans || 0), 0) || 0;

      return {
        totalPoints,
        uniqueVisitors,
        totalScans,
      };
    },
    enabled: !!businessId,
  });

  // Fetch event count
  const { data: eventCount } = useQuery({
    queryKey: ['business-event-count', businessId],
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

  const hasStats = loopStats && (loopStats.totalPoints > 0 || loopStats.totalScans > 0);
  const hasEvents = eventCount && eventCount > 0;

  if (!hasStats && !hasEvents) return null;

  const metrics: ImpactMetric[] = [];

  if (loopStats?.totalPoints && loopStats.totalPoints > 0) {
    metrics.push({
      label: 'Loop Points Given',
      value: loopStats.totalPoints.toLocaleString(),
      icon: TrendingUp,
      color: 'text-lokal-amber',
    });
  }

  if (loopStats?.totalScans && loopStats.totalScans > 0) {
    metrics.push({
      label: 'Check-ins',
      value: loopStats.totalScans,
      icon: Users,
      color: 'text-lokal-forest',
    });
  }

  if (eventCount && eventCount > 0) {
    metrics.push({
      label: 'Events Hosted',
      value: eventCount,
      icon: Calendar,
      color: 'text-lokal-terracotta',
    });
  }

  if (metrics.length === 0) return null;

  return (
    <CollapsibleSection title="Local Impact" icon={Heart}>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
          >
            <div className={`w-10 h-10 rounded-xl bg-card flex items-center justify-center ${metric.color}`}>
              <metric.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
