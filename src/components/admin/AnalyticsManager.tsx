import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatCard } from '@/components/admin/StatCard';
import {
  Loader2,
  Eye,
  Bookmark,
  Globe,
  Phone,
  MapPin,
  CalendarDays,
  Tag,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsManagerProps {
  businessId: string;
}

interface TimeSeriesPoint {
  date: string;
  count: number;
}

interface AnalyticsData {
  totals: Record<string, number>;
  recentByDay: TimeSeriesPoint[];
  topEvents: { type: string; count: number }[];
}

const EVENT_LABELS: Record<string, { label: string; icon: typeof Eye }> = {
  profile_view: { label: 'Profile views', icon: Eye },
  profile_save: { label: 'Saves', icon: Bookmark },
  website_click: { label: 'Website clicks', icon: Globe },
  phone_click: { label: 'Phone calls', icon: Phone },
  direction_request: { label: 'Direction requests', icon: MapPin },
  checkin: { label: 'Check-ins', icon: MapPin },
  event_view: { label: 'Event views', icon: CalendarDays },
  deal_view: { label: 'Deal views', icon: Tag },
  job_view: { label: 'Job views', icon: Briefcase },
};

const STAT_COLORS = [
  'text-primary',
  'text-emerald-600',
  'text-amber-600',
  'text-blue-600',
  'text-rose-600',
  'text-purple-600',
  'text-orange-600',
  'text-teal-600',
  'text-indigo-600',
];

function useAnalytics(businessId: string) {
  return useQuery({
    queryKey: ['admin-analytics', businessId],
    queryFn: async (): Promise<AnalyticsData> => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .eq('business_id', businessId);

      if (error) throw error;

      const rows = (data || []) as { event_type: string; created_at: string }[];

      const totals: Record<string, number> = {};
      const dailyCounts: Record<string, number> = {};

      for (const row of rows) {
        totals[row.event_type] = (totals[row.event_type] || 0) + 1;
        const day = row.created_at.split('T')[0];
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      }

      const last30 = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().split('T')[0];
      });

      const recentByDay = last30.map((date) => ({
        date,
        count: dailyCounts[date] || 0,
      }));

      const topEvents = Object.entries(totals)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      return { totals, recentByDay, topEvents };
    },
    enabled: !!businessId,
    staleTime: 60_000,
  });
}

export function AnalyticsManager({ businessId }: AnalyticsManagerProps) {
  const { data, isLoading } = useAnalytics(businessId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalAll = data ? Object.values(data.totals).reduce((a, b) => a + b, 0) : 0;
  const maxDay = data ? Math.max(...data.recentByDay.map((d) => d.count), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Track how people discover and interact with your business.
        </p>
      </div>

      {/* Total stat */}
      <div className="card-elevated p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{totalAll.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total interactions (all time)</p>
        </div>
      </div>

      {/* 30-day activity bar chart */}
      {data && (
        <div className="card-elevated p-5 space-y-3">
          <h3 className="font-semibold text-sm">Last 30 days</h3>
          <div className="flex items-end gap-[2px] h-24">
            {data.recentByDay.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col justify-end" title={`${d.date}: ${d.count}`}>
                <div
                  className="bg-primary/70 rounded-t-sm min-h-[2px]"
                  style={{ height: `${Math.max((d.count / maxDay) * 100, 2)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{data.recentByDay[0]?.date.slice(5)}</span>
            <span>{data.recentByDay[data.recentByDay.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}

      {/* Breakdown by event type */}
      {data && data.topEvents.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.topEvents.map((ev, i) => {
            const meta = EVENT_LABELS[ev.type];
            const Icon = meta?.icon || Eye;
            return (
              <StatCard
                key={ev.type}
                icon={Icon}
                label={meta?.label || ev.type.replace(/_/g, ' ')}
                value={ev.count}
                iconColor={STAT_COLORS[i % STAT_COLORS.length]}
              />
            );
          })}
        </div>
      ) : (
        <div className="card-elevated p-8 text-center">
          <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No analytics data yet. Interactions will appear here as people view and engage with your business.
          </p>
        </div>
      )}
    </div>
  );
}
