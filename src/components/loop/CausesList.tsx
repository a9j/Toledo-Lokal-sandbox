import { useState } from 'react';
import { Heart, ChevronRight, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLoopCauses, useDonatePoints, LoopCause } from '@/hooks/useLoopCauses';
import { useLoop } from '@/contexts/LoopContext';
import { cn } from '@/lib/utils';

export function CausesList() {
  const { data: causes, isLoading } = useLoopCauses();
  const { wallet } = useLoop();
  const donatePoints = useDonatePoints();
  const { toast } = useToast();
  const [selectedCause, setSelectedCause] = useState<LoopCause | null>(null);
  const [donationAmount, setDonationAmount] = useState('100');

  const handleDonate = async () => {
    if (!selectedCause) return;

    const amount = parseInt(donationAmount);
    if (isNaN(amount) || amount < 10) {
      toast({
        title: "Invalid amount",
        description: "Minimum donation is 10 points",
        variant: "destructive",
      });
      return;
    }

    if ((wallet?.points_balance || 0) < amount) {
      toast({
        title: "Insufficient points",
        description: "You don't have enough points for this donation",
        variant: "destructive",
      });
      return;
    }

    try {
      await donatePoints.mutateAsync({ causeId: selectedCause.id, points: amount });
      toast({
        title: "Thank you!",
        description: `You donated ${amount} points to ${selectedCause.name}`,
      });
      setSelectedCause(null);
      setDonationAmount('100');
    } catch (error: unknown) {
      toast({
        title: "Donation failed",
        description: error instanceof Error ? error.message : "Failed to donate points",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Support Local Causes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
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
            <Heart className="h-5 w-5" />
            Support Local Causes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!causes || causes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No causes available yet</p>
              <p className="text-sm">Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {causes.map((cause) => (
                <button
                  key={cause.id}
                  onClick={() => setSelectedCause(cause)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    "hover:border-pink-500 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                      <Heart className="h-6 w-6 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block truncate">{cause.name}</span>
                      <p className="text-sm text-muted-foreground truncate">
                        {cause.organization_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {cause.points_donated.toLocaleString()} points donated
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donation Dialog */}
      <Dialog open={!!selectedCause} onOpenChange={() => setSelectedCause(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Donate to {selectedCause?.name}</DialogTitle>
            <DialogDescription>
              {selectedCause?.description || `Support ${selectedCause?.organization_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
              <span className="text-muted-foreground">Your Balance</span>
              <span className="font-semibold">
                {wallet?.points_balance.toLocaleString()} points
              </span>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Donation Amount
              </label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="10"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="pl-10"
                  placeholder="Enter points"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum donation: 10 points
              </p>
            </div>

            <div className="flex gap-2">
              {[50, 100, 250, 500].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setDonationAmount(amount.toString())}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedCause(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleDonate}
              disabled={donatePoints.isPending}
              className="bg-pink-500 hover:bg-pink-600"
            >
              <Heart className="h-4 w-4 mr-2" />
              {donatePoints.isPending ? 'Donating...' : 'Donate Points'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
