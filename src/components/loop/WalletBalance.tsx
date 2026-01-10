import { Coins, Sparkles, Gift, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoop } from '@/contexts/LoopContext';

export function WalletBalance() {
  const { wallet, isLoading } = useLoop();

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="pt-6">
          <Skeleton className="h-12 w-32 bg-primary-foreground/20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <CardHeader className="relative z-10 pb-2">
        <CardTitle className="text-primary-foreground/80 text-sm font-medium flex items-center gap-2">
          <Coins className="h-4 w-4" />
          Your Community Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-4xl font-bold mb-4 flex items-center gap-2">
          {wallet?.points_balance.toLocaleString() || 0}
          <span className="text-lg font-normal text-primary-foreground/70">points</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-primary-foreground/20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary-foreground/70 mb-1">
              <Sparkles className="h-3 w-3" />
              <span className="text-xs">Bonus</span>
            </div>
            <div className="font-semibold">{wallet?.lifetime_earned.toLocaleString() || 0}</div>
          </div>
          <div className="text-center border-x border-primary-foreground/20">
            <div className="flex items-center justify-center gap-1 text-primary-foreground/70 mb-1">
              <Gift className="h-3 w-3" />
              <span className="text-xs">Redeemed</span>
            </div>
            <div className="font-semibold">{wallet?.lifetime_redeemed.toLocaleString() || 0}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary-foreground/70 mb-1">
              <Heart className="h-3 w-3" />
              <span className="text-xs">Given</span>
            </div>
            <div className="font-semibold">{wallet?.lifetime_donated.toLocaleString() || 0}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
