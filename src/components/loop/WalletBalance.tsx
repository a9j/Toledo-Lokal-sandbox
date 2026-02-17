import { Coins, Sparkles, Gift, Heart, AlertTriangle, QrCode, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoop } from '@/contexts/LoopContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function WalletBalance() {
  const { wallet, isLoading } = useLoop();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="pt-6">
          <Skeleton className="h-12 w-32 bg-primary-foreground/20" />
        </CardContent>
      </Card>
    );
  }

  const balance = wallet?.points_balance || 0;
  const lifetimeEarned = wallet?.lifetime_earned || 0;
  // Visual ring: show progress toward next reward milestone (every 500 pts)
  const nextMilestone = Math.ceil((balance + 1) / 500) * 500;
  const ringProgress = nextMilestone > 0 ? (balance / nextMilestone) * 100 : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (ringProgress / 100) * circumference;

  return (
    <div className="space-y-3">
      <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/75 text-primary-foreground overflow-hidden relative">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <CardContent className="relative z-10 pt-5 pb-5">
          <div className="flex items-center gap-5">
            {/* Balance Ring */}
            <div className="relative flex-shrink-0">
              <svg width="96" height="96" viewBox="0 0 96 96" className="transform -rotate-90">
                <circle
                  cx="48" cy="48" r="42"
                  fill="none"
                  stroke="hsl(var(--primary-foreground) / 0.15)"
                  strokeWidth="5"
                />
                <circle
                  cx="48" cy="48" r="42"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Coins className="h-4 w-4 text-primary-foreground/70 mb-0.5" />
                <span className="text-xl font-bold leading-none">{balance.toLocaleString()}</span>
                <span className="text-[9px] text-primary-foreground/60 uppercase tracking-wider mt-0.5">points</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs text-primary-foreground/60 uppercase tracking-wide">Community Balance</p>
                <p className="text-sm text-primary-foreground/80 mt-0.5">
                  {nextMilestone - balance > 0
                    ? `${(nextMilestone - balance).toLocaleString()} pts to next milestone`
                    : 'Milestone reached!'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatPill icon={Sparkles} label="Earned" value={lifetimeEarned} />
                <StatPill icon={Gift} label="Used" value={wallet?.lifetime_redeemed || 0} />
                <StatPill icon={Heart} label="Given" value={wallet?.lifetime_donated || 0} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiration Warning */}
      <ExpirationWarning />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <QuickAction
          icon={QrCode}
          label="Scan"
          onClick={() => navigate('/scanner-mode')}
        />
        <QuickAction
          icon={Gift}
          label="Redeem"
          onClick={() => {
            // Scroll to rewards tab
            const el = document.querySelector('[data-value="rewards"]') as HTMLElement;
            el?.click();
          }}
        />
        <QuickAction
          icon={Heart}
          label="Give"
          onClick={() => {
            const el = document.querySelector('[data-value="causes"]') as HTMLElement;
            el?.click();
          }}
        />
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="text-center bg-primary-foreground/10 rounded-lg py-1.5 px-1">
      <Icon className="h-3 w-3 mx-auto text-primary-foreground/60 mb-0.5" />
      <p className="text-xs font-semibold">{value.toLocaleString()}</p>
      <p className="text-[9px] text-primary-foreground/50">{label}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      className="flex flex-col gap-1 h-auto py-3 bg-card hover:bg-accent/10 border-border"
      onClick={onClick}
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Button>
  );
}

function ExpirationWarning() {
  // Points expire after 90 days of inactivity
  const { wallet, transactions } = useLoop();
  if (!wallet || wallet.points_balance === 0) return null;

  // Check last earn/redeem transaction
  const lastActivity = transactions.find(
    t => t.transaction_type === 'earn' || t.transaction_type === 'redeem'
  );

  if (!lastActivity) return null;

  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivity < 60) return null;

  const daysRemaining = 90 - daysSinceActivity;

  if (daysRemaining <= 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border text-sm",
      daysRemaining <= 14
        ? "bg-destructive/10 border-destructive/20 text-destructive"
        : "bg-warning/10 border-warning/20 text-warning-foreground"
    )}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">
          {daysRemaining <= 14 ? 'Points expiring soon!' : 'Earn or redeem to keep your points'}
        </p>
        <p className="text-xs opacity-80">
          {daysRemaining} days until your {wallet.points_balance.toLocaleString()} points expire
        </p>
      </div>
      <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-60" />
    </div>
  );
}
