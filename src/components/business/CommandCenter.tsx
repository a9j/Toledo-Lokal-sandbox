import { Link } from 'react-router-dom';
import { RefreshCw, Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCommandCenter,
  useBusinessInsights,
  useRefreshInsights,
} from '@/hooks/useEconomy';

interface CommandCenterProps {
  businessId: string;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <p className="text-lg font-semibold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Business Command Center.
 *
 * The numbers come from tables the business already generates: analytics
 * events, passport check ins, deal redemptions, follows. The advice is derived
 * from those same numbers, and each line names the number it is built on so an
 * owner can check it rather than take it on faith.
 */
export function CommandCenter({ businessId }: CommandCenterProps) {
  const { data: stats, isLoading, error } = useCommandCenter(businessId);
  const { data: insights } = useBusinessInsights(businessId);
  const refresh = useRefreshInsights();

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  // The dashboard has plenty else on it. A failed read here should not take the
  // page down or claim the numbers are zero.
  if (error || !stats) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">Last 30 days</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            refresh.mutate(businessId, {
              onSuccess: (count) =>
                toast.success(
                  count === 0 ? 'Nothing to flag. Good.' : `${count} things worth a look.`,
                ),
              onError: () => toast.error('Could not refresh that.'),
            })
          }
          disabled={refresh.isPending}
        >
          {refresh.isPending ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Check my setup
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <Stat value={stats.profile_views} label="Profile views" />
        <Stat value={stats.checkins} label="Check ins" />
        <Stat value={stats.deal_redemptions} label="Deals used" />
        <Stat value={stats.followers} label="Followers" />
        <Stat value={stats.active_deals} label="Live deals" />
        <Stat value={stats.upcoming_events} label="Events coming" />
        <Stat value={stats.open_jobs} label="Open jobs" />
        <Stat value={stats.local_suppliers} label="Local suppliers" />
      </div>

      {insights && insights.length > 0 && (
        <div className="mt-4 space-y-2">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="flex gap-3 rounded-xl border border-border/60 bg-card p-4"
            >
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold leading-snug">{insight.headline}</p>
                  {insight.priority === 1 && (
                    <Badge variant="secondary" className="text-[10px]">
                      Do this first
                    </Badge>
                  )}
                </div>
                {insight.detail && (
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    {insight.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        <Link to="/economy" className="font-medium text-primary">
          See the local loop
        </Link>{' '}
        to tag who you buy from.
      </p>
    </section>
  );
}
