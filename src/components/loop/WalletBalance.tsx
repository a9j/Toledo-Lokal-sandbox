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
      {/* Civic membership card — embossed warm card, not neon/tech */}
      <Card className="relative overflow-hidden border-border/50 bg-card">
        {/* Warm embossed wash */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 90% 10%, hsl(36 66% 32% / 0.35) 0%, transparent 55%), radial-gradient(80% 60% at 10% 100%, hsl(208 75% 22% / 0.28) 0%, transparent 60%)',
          }}
        />
        {/* Subtle map iconography */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.6'%3E%3Cpath d='M0 40 L80 40 M40 0 L40 80 M0 0 L80 80 M80 0 L0 80'/%3E%3Ccircle cx='40' cy='40' r='12'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <CardContent className="relative z-10 pt-6 pb-6">
          <div className="flex items-center gap-5">
            {/* Balance Ring — lake blue, civic */}
            <div className="relative flex-shrink-0">
              <svg width="104" height="104" viewBox="0 0 104 104" className="transform -rotate-90">
                <circle cx="52" cy="52" r="46" fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="4" />
                <circle
                  cx="52" cy="52" r="46"
                  fill="none"
                  stroke="hsl(var(--toledo-teal))"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={(2 * Math.PI * 46) - (ringProgress / 100) * (2 * Math.PI * 46)}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="font-normal leading-none text-foreground"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: '1.6rem', letterSpacing: '-0.02em' }}
                >
                  {balance.toLocaleString()}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] mt-1">Loop</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="eyebrow">Your Membership</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {nextMilestone - balance > 0
                    ? `${(nextMilestone - balance).toLocaleString()} to next milestone`
                    : 'Milestone reached'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
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
    <div className="text-center bg-foreground/[0.04] border border-border/40 rounded-xl py-2 px-1">
      <Icon className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
      <p className="text-sm font-semibold text-foreground">{value.toLocaleString()}</p>
      <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
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
