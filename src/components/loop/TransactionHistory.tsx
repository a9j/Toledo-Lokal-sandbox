import { format } from 'date-fns';
import { ArrowUpCircle, ArrowDownCircle, Gift, Heart, RefreshCw, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoop } from '@/contexts/LoopContext';
import { cn } from '@/lib/utils';

const transactionIcons = {
  earn: ArrowUpCircle,
  redeem: Gift,
  donate: Heart,
  bonus: Award,
  refund: RefreshCw,
  expire: ArrowDownCircle,
};

const transactionColors = {
  earn: 'text-success',
  redeem: 'text-primary',
  donate: 'text-pink-500',
  bonus: 'text-amber-500',
  refund: 'text-blue-500',
  expire: 'text-muted-foreground',
};

export function TransactionHistory() {
  const { transactions, isLoading } = useLoop();

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
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Start earning points at local businesses!</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const Icon = transactionIcons[transaction.transaction_type];
                const color = transactionColors[transaction.transaction_type];
                const isPositive = transaction.points > 0;

                return (
                  <div key={transaction.id} className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full bg-secondary", color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {transaction.description || transaction.business?.name || 'Loop Points'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    <div className={cn(
                      "font-semibold",
                      isPositive ? "text-success" : "text-foreground"
                    )}>
                      {isPositive ? '+' : ''}{transaction.points}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
