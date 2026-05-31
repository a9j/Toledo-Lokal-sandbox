import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Store, Clock3, Users, UserPlus, Radio, Coins, QrCode, HeartHandshake,
  CheckCircle2, Plus, Megaphone, Star, Gift, ShieldAlert, CalendarPlus, ChevronRight, Activity,
  Shield, Crown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const startOfTodayISO = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); };

async function countOf(query: PromiseLike<{ count: number | null }>): Promise<number> {
  try { const { count } = await query; return count ?? 0; } catch { return 0; }
}

function useCityMetrics() {
  return useQuery({
    queryKey: ['admin-city-overview'],
    queryFn: async () => {
      const today = startOfTodayISO();

      const [activeBusinesses, pendingBusinesses, residents, signupsToday, pulseToday, nonprofits, pendingDeals, pendingEvents] = await Promise.all([
        countOf(supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'approved')),
        countOf(supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
        countOf(supabase.from('profiles').select('id', { count: 'exact', head: true })),
        countOf(supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today)),
        countOf(supabase.from('pulse_posts').select('id', { count: 'exact', head: true }).gte('created_at', today)),
        countOf(supabase.from('nonprofits').select('id', { count: 'exact', head: true })),
        countOf(supabase.from('deals').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
        countOf(supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'pending')),
      ]);

      let pointsToday = 0;
      let checkinsToday = 0;
      try {
        const { data: tx } = await supabase
          .from('loop_transactions')
          .select('points')
          .eq('transaction_type', 'earn')
          .gte('created_at', today);
        pointsToday = tx?.reduce((s, t) => s + (t.points || 0), 0) ?? 0;
        checkinsToday = tx?.length ?? 0;
      } catch { /* ignore */ }

      const pendingList = (await supabase
        .from('businesses')
        .select('id, name, created_at, category:categories!category_id(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(6)).data ?? [];

      const recent = (await supabase
        .from('businesses')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(6)).data ?? [];

      return {
        metrics: { activeBusinesses, pendingBusinesses, residents, signupsToday, pulseToday, nonprofits, pointsToday, checkinsToday, pendingDeals, pendingEvents },
        pendingList,
        recent,
      };
    },
    staleTime: 60_000,
  });
}

function MetricCard({ icon: Icon, label, value, tone = 'default', to }: { icon: LucideIcon; label: string; value: number | string; tone?: 'default' | 'primary' | 'warning'; to?: string }) {
  const tones = { default: 'text-foreground', primary: 'text-primary', warning: 'text-lokal-amber' } as const;
  const content = (
    <>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={cn('h-4 w-4', tones[tone])} />
      </div>
      <p className={cn('font-display text-2xl font-bold tracking-tight', tones[tone])}>{value}</p>
    </>
  );
  if (to) {
    return (
      <Link to={to} className="block rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5">
        {content}
      </Link>
    );
  }
  return <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">{content}</div>;
}

const QUICK_ACTIONS: { label: string; icon: LucideIcon; to: string }[] = [
  { label: 'Approve business', icon: CheckCircle2, to: '/admin/classic?tab=businesses' },
  { label: 'Add business', icon: Plus, to: '/create-business' },
  { label: 'Feature a business', icon: Star, to: '/admin/classic?tab=manage' },
  { label: 'Add event', icon: CalendarPlus, to: '/admin/classic?tab=events' },
  { label: 'Add nonprofit', icon: HeartHandshake, to: '/admin/classic?tab=nonprofits' },
  { label: 'Create reward', icon: Gift, to: '/dashboard/rewards' },
  { label: 'Assign Founding 5', icon: Crown, to: '/admin/businesses?tier=founding_5' },
  { label: 'Assign Founding 50', icon: Shield, to: '/admin/businesses?tier=founding_50' },
];

export function CityOverview() {
  const { data, isLoading } = useCityMetrics();

  if (isLoading || !data) {
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  }

  const m = data.metrics;
  const pendingTotal = m.pendingBusinesses + m.pendingDeals + m.pendingEvents;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <MetricCard icon={Store} label="Active businesses" value={m.activeBusinesses} to="/admin/businesses" />
        <MetricCard icon={Users} label="Residents" value={m.residents} to="/admin/classic?tab=users" />
        <MetricCard icon={UserPlus} label="New signups today" value={m.signupsToday} tone="primary" to="/admin/classic?tab=users" />
        <MetricCard icon={Clock3} label="Pending approvals" value={pendingTotal} tone="warning" to="/admin/classic?tab=businesses" />
        <MetricCard icon={Coins} label="Loop Points today" value={m.pointsToday} tone="primary" to="/admin/classic?tab=manage" />
        <MetricCard icon={QrCode} label="Check-ins today" value={m.checkinsToday} to="/admin/classic?tab=manage" />
        <MetricCard icon={Radio} label="Pulse posts today" value={m.pulseToday} to="/admin/classic?tab=manage" />
        <MetricCard icon={HeartHandshake} label="Nonprofits" value={m.nonprofits} to="/admin/classic?tab=nonprofits" />
      </div>

      {/* Quick actions */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick actions</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.label} to={a.to} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm font-medium shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5">
              <a.icon className="h-4 w-4 flex-shrink-0 text-primary" />
              <span className="truncate">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pending approvals */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pending approvals</h3>
            <Link to="/admin/classic?tab=businesses" className="text-xs font-medium text-primary hover:underline">Review all</Link>
          </div>
          {data.pendingList.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing waiting — the city's all caught up.</p>
          ) : (
            <div className="space-y-1.5">
              {data.pendingList.map((b) => (
                <Link key={b.id} to="/admin/classic?tab=businesses" className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-secondary">
                  <Clock3 className="h-4 w-4 flex-shrink-0 text-lokal-amber" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{(b.category as { name: string } | null)?.name || 'Uncategorized'} · {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Activity className="h-4 w-4 text-primary" /> Recent activity</h3>
          {data.recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-1.5">
              {data.recent.map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                  <Store className="h-4 w-4 flex-shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground capitalize">{b.status} · joined {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
