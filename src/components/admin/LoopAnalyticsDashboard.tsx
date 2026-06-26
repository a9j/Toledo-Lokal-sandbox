import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, TrendingDown, ArrowUpDown, Building2, Users, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FOUNDING_5_SUPPLY_CAP_PERCENT } from '@/lib/loop-tiers';

export function LoopAnalyticsDashboard() {
  // Total LP stats
  const { data: lpStats } = useQuery({
    queryKey: ['admin-lp-stats'],
    queryFn: async () => {
      const [wallets, transactions] = await Promise.all([
        supabase.from('loop_wallets').select('points_balance, lifetime_earned, lifetime_redeemed, lifetime_donated'),
        supabase.from('loop_transactions').select('transaction_type, points, created_at'),
      ]);
      if (wallets.error) throw wallets.error;
      if (transactions.error) throw transactions.error;

      const totalCirculating = wallets.data?.reduce((sum, w) => sum + (w.points_balance || 0), 0) || 0;
      const totalIssued = wallets.data?.reduce((sum, w) => sum + (w.lifetime_earned || 0), 0) || 0;
      const totalRedeemed = wallets.data?.reduce((sum, w) => sum + (w.lifetime_redeemed || 0), 0) || 0;
      const totalDonated = wallets.data?.reduce((sum, w) => sum + (w.lifetime_donated || 0), 0) || 0;

      // Expired = issued - circulating - redeemed - donated
      const totalExpired = Math.max(0, totalIssued - totalCirculating - totalRedeemed - totalDonated);
      const breakageRate = totalIssued > 0 ? ((totalExpired / totalIssued) * 100).toFixed(1) : '0';

      // Redemption velocity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRedemptions = transactions.data?.filter(
        t => t.transaction_type === 'redeem' && new Date(t.created_at) > thirtyDaysAgo
      ).length || 0;

      return {
        totalIssued,
        totalRedeemed,
        totalExpired,
        totalCirculating,
        totalDonated,
        breakageRate,
        redemptionVelocity: recentRedemptions,
      };
    },
  });

  // Top issuing businesses
  const { data: topIssuers } = useQuery({
    queryKey: ['admin-lp-top-issuers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_loop_settings')
        .select('points_issued_this_month, is_founding_member, is_founding_50, business:businesses(name)')
        .eq('is_active', true)
        .order('points_issued_this_month', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  // Top redeeming businesses
  const { data: topRedeemers } = useQuery({
    queryKey: ['admin-lp-top-redeemers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loop_transactions')
        .select('business_id, points, business:businesses(name)')
        .eq('transaction_type', 'redeem')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      // Aggregate by business
      const byBusiness: Record<string, { name: string; total: number }> = {};
      data?.forEach(t => {
        if (t.business_id && t.business?.name) {
          const entry = byBusiness[t.business_id] ?? { name: t.business.name, total: 0 };
          entry.total += Math.abs(t.points);
          byBusiness[t.business_id] = entry;
        }
      });
      return Object.values(byBusiness).sort((a, b) => b.total - a.total).slice(0, 5);
    },
  });

  // Supply cap check
  const { data: supplyCap } = useQuery({
    queryKey: ['admin-lp-supply-cap'],
    queryFn: async () => {
      const { data: settings, error } = await supabase
        .from('business_loop_settings')
        .select('points_issued_this_month, is_founding_member')
        .eq('is_active', true);
      if (error) throw error;

      const totalIssued = settings?.reduce((sum, s) => sum + (s.points_issued_this_month || 0), 0) || 0;
      const founding5Issued = settings?.filter(s => s.is_founding_member)
        .reduce((sum, s) => sum + (s.points_issued_this_month || 0), 0) || 0;

      const founding5Percent = totalIssued > 0 ? (founding5Issued / totalIssued) * 100 : 0;
      const isOverCap = founding5Percent > FOUNDING_5_SUPPLY_CAP_PERCENT;

      return { totalIssued, founding5Issued, founding5Percent: founding5Percent.toFixed(1), isOverCap };
    },
  });

  const stats = [
    { title: 'Total LP Issued', value: lpStats?.totalIssued?.toLocaleString() || '0', icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Total LP Redeemed', value: lpStats?.totalRedeemed?.toLocaleString() || '0', icon: TrendingDown, color: 'text-blue-500' },
    { title: 'Total LP Expired', value: lpStats?.totalExpired?.toLocaleString() || '0', icon: AlertTriangle, color: 'text-amber-500' },
    { title: 'Net Circulating', value: lpStats?.totalCirculating?.toLocaleString() || '0', icon: Coins, color: 'text-primary' },
    { title: 'Breakage Rate', value: `${lpStats?.breakageRate || 0}%`, icon: ArrowUpDown, color: 'text-muted-foreground' },
    { title: 'Redemptions (30d)', value: lpStats?.redemptionVelocity?.toString() || '0', icon: TrendingUp, color: 'text-violet-500' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Coins className="h-5 w-5 text-primary" />
        Loop Points Analytics
      </h3>

      {/* Supply Cap Warning */}
      {supplyCap?.isOverCap && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Founding 5 Supply Cap Exceeded</p>
              <p className="text-sm text-muted-foreground">
                Founding 5 issuance is at {supplyCap.founding5Percent}% of total supply (cap: {FOUNDING_5_SUPPLY_CAP_PERCENT}%).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supply Cap Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Founding 5 Supply Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Monthly LP</p>
              <p className="text-xl font-bold">{supplyCap?.totalIssued?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Founding 5 LP</p>
              <p className="text-xl font-bold">{supplyCap?.founding5Issued?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">F5 % of Supply</p>
              <p className={`text-xl font-bold ${supplyCap?.isOverCap ? 'text-destructive' : ''}`}>
                {supplyCap?.founding5Percent || 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top Issuers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Top Issuing Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topIssuers?.length ? topIssuers.map((issuer, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span className="truncate max-w-[160px]">{issuer.business?.name || 'Unknown'}</span>
                    {issuer.is_founding_member && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">F5</span>
                    )}
                    {issuer.is_founding_50 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">F25</span>
                    )}
                  </div>
                  <span className="font-mono font-medium">{issuer.points_issued_this_month?.toLocaleString() || 0} LP</span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Redeemers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Redeeming Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRedeemers?.length ? topRedeemers.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span className="truncate max-w-[180px]">{r.name}</span>
                  </div>
                  <span className="font-mono font-medium">{r.total.toLocaleString()} LP</span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
