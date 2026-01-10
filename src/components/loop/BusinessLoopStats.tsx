import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Coins, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { getLoopTierById, isLoopParticipant } from '@/lib/loop-tiers';

interface BusinessLoopStatsProps {
  businessId: string;
}

export function BusinessLoopStats({ businessId }: BusinessLoopStatsProps) {
  // Fetch business loop settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['business-loop-settings-by-id', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_loop_settings')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!businessId,
  });

  // Fetch points issued stats
  const { data: stats } = useQuery({
    queryKey: ['business-loop-stats', businessId],
    queryFn: async () => {
      // Get total points issued via transactions
      const { data: transactions, error } = await supabase
        .from('loop_transactions')
        .select('points')
        .eq('business_id', businessId)
        .eq('transaction_type', 'earn');

      if (error) throw error;

      const totalIssued = transactions?.reduce((sum, t) => sum + t.points, 0) || 0;

      // Get redemptions at this business
      const { data: redemptions } = await supabase
        .from('loop_transactions')
        .select('points')
        .eq('business_id', businessId)
        .eq('transaction_type', 'redeem');

      const totalRedeemed = redemptions?.reduce((sum, t) => sum + Math.abs(t.points), 0) || 0;

      // Get active rewards count
      const { count: rewardsCount } = await supabase
        .from('loop_rewards')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('is_active', true);

      return {
        totalIssued,
        totalRedeemed,
        activeRewards: rewardsCount || 0,
      };
    },
    enabled: !!businessId && !!settings?.is_active,
  });

  if (settingsLoading) {
    return (
      <div className="card-elevated p-4 animate-pulse">
        <div className="h-20 bg-secondary rounded-xl" />
      </div>
    );
  }

  const tier = getLoopTierById(settings?.loop_tier_id || null);
  const isParticipating = settings?.is_active && isLoopParticipant(settings?.loop_tier_id);

  // Not participating in Loop
  if (!isParticipating) {
    return (
      <Link to="/dashboard/subscription">
        <div className="card-elevated p-4 flex items-center gap-3 border-dashed border-2 hover-lift">
          <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center">
            <Coins className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">Join Loop Lokal</h3>
            <p className="text-sm text-muted-foreground">
              Issue & accept points, join missions
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Link>
    );
  }

  const monthlyUsage = settings?.points_issued_this_month || 0;
  const monthlyLimit = tier.pointsCap;
  const usagePercent = monthlyLimit > 0 ? (monthlyUsage / monthlyLimit) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Loop Status Header */}
      <Link to="/dashboard/loop">
        <div className="card-elevated p-4 hover-lift bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-semibold">Loop Lokal</span>
              <Badge variant="secondary" className="text-xs">
                {tier.name}
              </Badge>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold text-primary">{stats?.totalIssued?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">Points Issued</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold text-primary">{stats?.totalRedeemed?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">Redeemed</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/50">
              <p className="text-lg font-bold text-primary">{stats?.activeRewards || 0}</p>
              <p className="text-xs text-muted-foreground">Rewards</p>
            </div>
          </div>

          {/* Monthly Cap Progress */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Monthly Points Cap</span>
              <span className="font-medium">{monthlyUsage.toLocaleString()} / {monthlyLimit.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-background/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-destructive' : usagePercent >= 70 ? 'bg-warning' : 'bg-primary'}`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
