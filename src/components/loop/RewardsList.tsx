import { useState } from 'react';
import { Gift, Store, Coins, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLoopRewards, LoopReward } from '@/hooks/useLoopRewards';
import { useLoop } from '@/contexts/LoopContext';
import { cn } from '@/lib/utils';

const categoryLabels = {
  perk: 'Perk',
  experience: 'Experience',
  service_credit: 'Service Credit',
};

const categoryColors = {
  perk: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  experience: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  service_credit: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export function RewardsList() {
  const { data: rewards, isLoading } = useLoopRewards({ limit: 20 });
  const { wallet, redeemReward } = useLoop();
  const { toast } = useToast();
  const [selectedReward, setSelectedReward] = useState<LoopReward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);

  const handleRedeem = async () => {
    if (!selectedReward) return;

    setIsRedeeming(true);
    const result = await redeemReward(selectedReward.id);
    setIsRedeeming(false);

    if (result.success) {
      setRedemptionCode(result.redemptionCode || null);
      toast({
        title: "Reward redeemed!",
        description: `Show code ${result.redemptionCode} at ${selectedReward.business?.name}`,
      });
    } else {
      toast({
        title: "Redemption failed",
        description: result.error,
        variant: "destructive",
      });
      setSelectedReward(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Redeem Your Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Redeem Your Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!rewards || rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>New rewards coming soon</p>
              <p className="text-sm">Keep earning — more options are on the way!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => {
                const canAfford = (wallet?.points_balance || 0) >= reward.points_cost;
                const isSoldOut = reward.quantity_available !== null && 
                  reward.quantity_redeemed >= reward.quantity_available;

                return (
                  <button
                    key={reward.id}
                    onClick={() => setSelectedReward(reward)}
                    disabled={isSoldOut}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      "hover:border-primary hover:shadow-md",
                      isSoldOut && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{reward.name}</span>
                          <Badge className={cn("text-[10px]", categoryColors[reward.category])}>
                            {categoryLabels[reward.category]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {reward.business?.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={cn(
                          "font-semibold flex items-center gap-1",
                          canAfford ? "text-primary" : "text-muted-foreground"
                        )}>
                          <Coins className="h-4 w-4" />
                          {reward.points_cost}
                        </div>
                        {isSoldOut && (
                          <span className="text-xs text-destructive">Sold out</span>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redemption Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => {
        setSelectedReward(null);
        setRedemptionCode(null);
      }}>
        <DialogContent>
          {redemptionCode ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">🎉 Reward Redeemed!</DialogTitle>
                <DialogDescription className="text-center">
                  Show this code at {selectedReward?.business?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="text-center py-8">
                <div className="text-4xl font-mono font-bold tracking-wider bg-secondary px-6 py-4 rounded-xl inline-block">
                  {redemptionCode}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  This code is one-time use only
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setSelectedReward(null);
                  setRedemptionCode(null);
                }} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{selectedReward?.name}</DialogTitle>
                <DialogDescription>
                  {selectedReward?.description || `Redeem at ${selectedReward?.business?.name}`}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Coins className="h-4 w-4 text-primary" />
                    {selectedReward?.points_cost} points
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 mt-2 bg-secondary rounded-xl">
                  <span className="text-muted-foreground">Your Balance</span>
                  <span className="font-semibold">
                    {wallet?.points_balance.toLocaleString()} points
                  </span>
                </div>
                {wallet && selectedReward && wallet.points_balance < selectedReward.points_cost && (
                  <p className="text-sm text-destructive mt-3 text-center">
                    You need {selectedReward.points_cost - wallet.points_balance} more points
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedReward(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRedeem}
                  disabled={
                    isRedeeming || 
                    !wallet || 
                    !selectedReward ||
                    wallet.points_balance < selectedReward.points_cost
                  }
                >
                  {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
