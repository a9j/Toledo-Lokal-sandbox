import { useState, useMemo } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Gift, Heart, RefreshCw, Award, Filter, RotateCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoop } from '@/contexts/LoopContext';
import { cn } from '@/lib/utils';

type TransactionType = 'earn' | 'redeem' | 'donate' | 'bonus' | 'refund' | 'expire';

const transactionIcons: Record<TransactionType, any> = {
  earn: ArrowUpCircle,
  redeem: Gift,
  donate: Heart,
  bonus: Award,
  refund: RefreshCw,
  expire: ArrowDownCircle,
};

const transactionColors: Record<TransactionType, string> = {
  earn: 'text-success',
  redeem: 'text-primary',
  donate: 'text-pink-500',
  bonus: 'text-amber-500',
  refund: 'text-blue-500',
  expire: 'text-muted-foreground',
};

const filterLabels: Record<string, string> = {
  all: 'All',
  earn: 'Earned',
  redeem: 'Redeemed',
  donate: 'Donated',
  bonus: 'Bonus',
};

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isThisWeek(d)) return 'This Week';
  return format(d, 'MMMM yyyy');
}

export function TransactionHistory() {
  const { transactions, isLoading, refreshTransactions } = useLoop();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return transactions;
    return transactions.filter(t => t.transaction_type === activeFilter);
  }, [transactions, activeFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof filtered }[] = [];
    let currentGroup = '';
    
    for (const tx of filtered) {
      const group = getDateGroup(tx.created_at);
      if (group !== currentGroup) {
        currentGroup = group;
        groups.push({ label: group, items: [] });
      }
      groups[groups.length - 1].items.push(tx);
    }
    return groups;
  }, [filtered]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshTransactions();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RotateCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pt-1 pb-0.5 -mx-1 px-1">
          {Object.entries(filterLabels).map(([key, label]) => (
            <Badge
              key={key}
              variant={activeFilter === key ? "default" : "outline"}
              className={cn(
                "cursor-pointer whitespace-nowrap text-xs px-2.5 py-1 transition-colors",
                activeFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
              onClick={() => setActiveFilter(key)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{activeFilter === 'all' ? 'No transactions yet' : `No ${filterLabels[activeFilter]?.toLowerCase()} transactions`}</p>
            <p className="text-sm">Start earning points at local businesses!</p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-1">
              {grouped.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-2 sticky top-0 bg-card z-10">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((transaction) => {
                      const Icon = transactionIcons[transaction.transaction_type];
                      const color = transactionColors[transaction.transaction_type];
                      const isPositive = transaction.points > 0;

                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className={cn("p-2 rounded-full bg-secondary", color)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {transaction.description || transaction.business?.name || 'Loop Points'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transaction.created_at), 'h:mm a')}
                            </p>
                          </div>
                          <div className={cn(
                            "font-semibold text-sm",
                            isPositive ? "text-success" : "text-foreground"
                          )}>
                            {isPositive ? '+' : ''}{transaction.points}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
