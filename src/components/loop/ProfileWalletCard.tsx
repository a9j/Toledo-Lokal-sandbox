import { Link } from 'react-router-dom';
import { Coins, ChevronRight, Loader2 } from 'lucide-react';
import { useLoop } from '@/contexts/LoopContext';

export function ProfileWalletCard() {
  const { wallet, isLoading } = useLoop();

  if (isLoading) {
    return (
      <div className="card-elevated p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
        <div className="flex-1">
          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded mt-1" />
        </div>
      </div>
    );
  }

  return (
    <Link to="/loop-wallet">
      <div className="card-elevated p-4 flex items-center gap-3 hover-lift bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">Loop Points</h3>
          <p className="text-2xl font-bold text-primary">
            {wallet?.points_balance?.toLocaleString() || 0}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}
