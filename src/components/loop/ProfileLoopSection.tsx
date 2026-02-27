import { useRef, useEffect, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Coins, Gift, Sparkles, ArrowUpCircle, ArrowDownCircle,
  Heart, Award, RefreshCw, Loader2, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoop } from '@/contexts/LoopContext';
import { useLoopRewards } from '@/hooks/useLoopRewards';
import { useLoopTransactionsPaginated } from '@/hooks/useLoopTransactionsPaginated';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type TxType = 'earn' | 'redeem' | 'donate' | 'bonus' | 'refund' | 'expire';

const txIcons: Record<TxType, React.ElementType> = {
  earn: ArrowUpCircle,
  redeem: Gift,
  donate: Heart,
  bonus: Award,
  refund: RefreshCw,
  expire: ArrowDownCircle,
};

const txColors: Record<TxType, string> = {
  earn: 'text-success',
  redeem: 'text-primary',
  donate: 'text-pink-500',
  bonus: 'text-lokal-amber',
  refund: 'text-blue-500',
  expire: 'text-muted-foreground',
};

function formatTxTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

export function ProfileLoopSection() {
  const { wallet, isLoading: walletLoading } = useLoop();
  const navigate = useNavigate();

  // Animated balance
  const [displayBalance, setDisplayBalance] = useState(0);
  const prevBalance = useRef(0);

  useEffect(() => {
    if (!wallet) return;
    const target = wallet.points_balance;
    const start = prevBalance.current;
    const startTime = performance.now();
    const duration = 700;
    const animate = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayBalance(Math.round(start + (target - start) * eased));
      if (p < 1) {
        requestAnimationFrame(animate);
      } else {
        prevBalance.current = target;
      }
    };
    requestAnimationFrame(animate);
  }, [wallet?.points_balance]);

  // Progress toward cheapest reward
  const { data: rewards } = useLoopRewards({ limit: 1 });
  const cheapestReward = rewards?.[0];
  const balance = wallet?.points_balance ?? 0;
  const progressTarget = cheapestReward?.points_cost ?? (Math.ceil((balance + 1) / 500) * 500);
  const progressLabel = cheapestReward ? cheapestReward.name : 'next milestone';
  const progressPct = Math.min((balance / progressTarget) * 100, 100);
  const ptsToGo = Math.max(0, progressTarget - balance);

  // Paginated transactions
  const {
    data: txPages,
    isLoading: txLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useLoopTransactionsPaginated(wallet?.id);

  const allTx = txPages?.pages.flat() ?? [];

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="card-elevated overflow-hidden animate-fade-in-up">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-lokal-amber" />
          <h3 className="font-semibold text-foreground">Loop Points</h3>
        </div>
        <Link
          to="/loop-wallet"
          className="flex items-center gap-0.5 text-xs font-medium text-primary"
        >
          View All
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Balance + progress band */}
      <div className="mx-4 mb-3 rounded-xl bg-gradient-to-br from-primary/10 to-lokal-amber/10 px-4 py-4">
        {walletLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1.5 mb-3">
              <Sparkles className="h-5 w-5 text-lokal-amber mb-0.5" />
              <span className="text-3xl font-bold text-foreground leading-none">
                {displayBalance.toLocaleString()}
              </span>
              <span className="text-sm font-medium text-muted-foreground mb-0.5">LP</span>
            </div>
            <Progress value={progressPct} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {ptsToGo > 0
                ? `${ptsToGo.toLocaleString()} pts to ${progressLabel}`
                : `Enough to redeem ${progressLabel}!`}
            </p>
          </>
        )}
      </div>

      {/* Lifetime stat */}
      {!walletLoading && wallet && (
        <div className="px-4 mb-3">
          <p className="text-xs text-muted-foreground">
            Lifetime Earned:{' '}
            <span className="font-semibold text-foreground">
              {wallet.lifetime_earned.toLocaleString()} LP
            </span>
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 mb-4">
        <Button
          className="w-full gap-2 rounded-xl h-10"
          onClick={() => navigate('/loop-wallet')}
        >
          <Gift className="h-4 w-4" />
          Redeem Points
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 px-4 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
          Recent Activity
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Transaction list */}
      <div className="px-4 pb-4 space-y-1">
        {txLoading && allTx.length === 0 ? (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
                <Skeleton className="h-4 w-10 rounded" />
              </div>
            ))}
          </>
        ) : allTx.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Gift className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-0.5">Scan a QR code to earn your first points!</p>
          </div>
        ) : (
          <>
            {allTx.map((tx) => {
              const type = tx.transaction_type as TxType;
              const Icon = txIcons[type] ?? ArrowUpCircle;
              const color = txColors[type] ?? 'text-muted-foreground';
              const isPositive = tx.points > 0;
              const desc = tx.description || tx.business?.name || 'Loop Points';

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 py-2 rounded-lg hover:bg-muted/50 transition-colors -mx-1 px-1"
                >
                  <div className={cn('p-2 rounded-full bg-secondary flex-shrink-0', color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{desc}</p>
                    <p className="text-xs text-muted-foreground">{formatTxTime(tx.created_at)}</p>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold flex-shrink-0',
                      isPositive ? 'text-success' : 'text-muted-foreground'
                    )}
                  >
                    {isPositive ? '+' : ''}
                    {tx.points}
                  </span>
                </div>
              );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
