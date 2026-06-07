import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Ticket,
  ShoppingBag,
  Sparkles,
  Tag,
  Star,
  Crown,
  Minus,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMarketplaceRewards, LoopReward } from '@/hooks/useLoopRewards';
import { useLoop } from '@/contexts/LoopContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'exclusive_event' | 'experience' | 'discount' | 'freebie' | 'raffle_entry' | 'vip_upgrade' | 'early_access';

const FILTER_CHIPS: { label: string; value: FilterType; icon: string }[] = [
  { label: 'All', value: 'all', icon: '✦' },
  { label: 'Events', value: 'exclusive_event', icon: '🎟' },
  { label: 'Experiences', value: 'experience', icon: '✨' },
  { label: 'Deals', value: 'discount', icon: '🎁' },
  { label: 'Raffles', value: 'raffle_entry', icon: '🎲' },
  { label: 'VIP', value: 'vip_upgrade', icon: '⬆' },
];

const EVENT_TYPES = new Set(['exclusive_event', 'experience', 'early_access', 'vip_upgrade']);
const RAFFLE_TYPES = new Set(['raffle_entry']);

export function LoopMarketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshWallet } = useLoop();
  const [activeType, setActiveType] = useState<FilterType>('all');

  // Inline redeem dialog (for discount/freebie)
  const [redeemReward, setRedeemReward] = useState<LoopReward | null>(null);
  const [redeemCode, setRedeemCode] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Raffle dialog
  const [raffleReward, setRaffleReward] = useState<LoopReward | null>(null);
  const [raffleEntries, setRaffleEntries] = useState(1);
  const [raffleTickets, setRaffleTickets] = useState<string[]>([]);
  const [isEnteringRaffle, setIsEnteringRaffle] = useState(false);
  const [raffleDone, setRaffleDone] = useState(false);

  const { data: rewards, isLoading } = useMarketplaceRewards(activeType === 'all' ? undefined : activeType);

  const handleRedeemDiscount = async (reward: LoopReward) => {
    if (!user) { navigate('/auth'); return; }
    setRedeemReward(reward);
    setRedeemCode(null);
  };

  const confirmRedeem = async () => {
    if (!redeemReward || !user) return;
    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_loop_points', {
        p_reward_id: redeemReward.id,
        p_user_id: user.id,
      });
      if (error) throw error;
      const result = data as { success: boolean; redemption_code?: string; error?: string };
      if (!result.success) throw new Error(result.error || 'Redemption failed');
      setRedeemCode(result.redemption_code ?? '------');
      refreshWallet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to redeem reward';
      toast.error(msg);
      setRedeemReward(null);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleEnterRaffle = async () => {
    if (!raffleReward || !user) return;
    setIsEnteringRaffle(true);
    try {
      const { data, error } = await supabase.rpc('reserve_event_spot', {
        p_user_id: user.id,
        p_reward_id: raffleReward.id,
        p_entries: raffleEntries,
      });
      if (error) throw error;
      const result = data as { success: boolean; ticket_codes?: string[]; error?: string };
      if (!result.success) throw new Error(result.error || 'Entry failed');
      setRaffleTickets(result.ticket_codes ?? []);
      setRaffleDone(true);
      refreshWallet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to enter raffle';
      toast.error(msg);
    } finally {
      setIsEnteringRaffle(false);
    }
  };

  const closeRaffleDialog = () => {
    setRaffleReward(null);
    setRaffleEntries(1);
    setRaffleTickets([]);
    setRaffleDone(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
          ))}
        </div>
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" style={{ animationDelay: '100ms' }} />
        <Skeleton className="h-36 rounded-2xl" style={{ animationDelay: '200ms' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setActiveType(chip.value)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              activeType === chip.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Reward cards */}
      {!rewards || rewards.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <h3 className="font-semibold text-foreground mb-1">Nothing here yet</h3>
          <p className="text-sm text-muted-foreground">
            Check back soon — businesses are adding rewards.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map((reward, i) => {
            if (RAFFLE_TYPES.has(reward.reward_type ?? '')) {
              return (
                <RaffleCard
                  key={reward.id}
                  reward={reward}
                  index={i}
                  onEnter={() => { setRaffleReward(reward); setRaffleDone(false); }}
                />
              );
            }
            if (EVENT_TYPES.has(reward.reward_type ?? '')) {
              return (
                <EventCard
                  key={reward.id}
                  reward={reward}
                  index={i}
                  onClick={() => navigate(`/loop/event/${reward.id}`)}
                />
              );
            }
            // discount / freebie / default
            return (
              <DiscountCard
                key={reward.id}
                reward={reward}
                index={i}
                onRedeem={() => handleRedeemDiscount(reward)}
              />
            );
          })}
        </div>
      )}

      {/* Redeem dialog (discount/freebie) */}
      <Dialog open={!!redeemReward} onOpenChange={(open) => { if (!open) { setRedeemReward(null); setRedeemCode(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{redeemReward?.name}</DialogTitle>
            <DialogDescription>{redeemReward?.description}</DialogDescription>
          </DialogHeader>

          {redeemCode ? (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Your redemption code</p>
              <div className="text-4xl font-bold tracking-widest text-primary font-mono">
                {redeemCode}
              </div>
              <p className="text-xs text-muted-foreground">Show this to the staff member to redeem.</p>
              <Button className="w-full rounded-xl mt-2" onClick={() => { setRedeemReward(null); setRedeemCode(null); }}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="py-2 text-center">
                <p className="text-2xl font-bold text-primary">{redeemReward?.points_cost} pts</p>
                <p className="text-sm text-muted-foreground mt-1">will be deducted from your wallet</p>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl" onClick={() => setRedeemReward(null)}>
                  Cancel
                </Button>
                <Button className="rounded-xl" onClick={confirmRedeem} disabled={isRedeeming}>
                  {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Raffle dialog */}
      <Dialog open={!!raffleReward} onOpenChange={(open) => { if (!open) closeRaffleDialog(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{raffleReward?.name}</DialogTitle>
            <DialogDescription>{raffleReward?.description}</DialogDescription>
          </DialogHeader>

          {raffleDone ? (
            <div className="py-4 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-lokal-amber/10 flex items-center justify-center mx-auto">
                <Ticket className="h-8 w-8 text-lokal-amber" />
              </div>
              <h3 className="font-semibold">You're in!</h3>
              <p className="text-sm text-muted-foreground">
                You have {raffleEntries} {raffleEntries === 1 ? 'entry' : 'entries'}.
                {raffleReward?.raffle_drawing_date && (
                  <> Drawing on {format(new Date(raffleReward.raffle_drawing_date), 'MMM d, yyyy')}.</>
                )}
              </p>
              <div className="space-y-1">
                {raffleTickets.map((code) => (
                  <div key={code} className="text-lg font-bold tracking-widest text-primary font-mono">
                    {code}
                  </div>
                ))}
              </div>
              <Button className="w-full rounded-xl" onClick={closeRaffleDialog}>Done</Button>
            </div>
          ) : (
            <>
              <div className="py-2 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Number of entries</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRaffleEntries(Math.max(1, raffleEntries - 1))}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-lg font-bold w-6 text-center">{raffleEntries}</span>
                    <button
                      onClick={() => setRaffleEntries(Math.min(10, raffleEntries + 1))}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted text-sm text-center">
                  Total: {raffleEntries} × {raffleReward?.points_cost} pts ={' '}
                  <span className="font-bold text-primary">
                    {(raffleEntries * (raffleReward?.points_cost ?? 0)).toLocaleString()} pts
                  </span>
                </div>
                {raffleReward?.raffle_drawing_date && (
                  <p className="text-xs text-muted-foreground text-center">
                    Drawing: {format(new Date(raffleReward.raffle_drawing_date), 'EEE, MMM d, yyyy')}
                  </p>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" className="rounded-xl" onClick={closeRaffleDialog}>
                  Cancel
                </Button>
                <Button className="rounded-xl" onClick={handleEnterRaffle} disabled={isEnteringRaffle}>
                  {isEnteringRaffle ? 'Entering...' : `Enter Raffle — ${(raffleEntries * (raffleReward?.points_cost ?? 0)).toLocaleString()} pts`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-card components ───────────────────────────────────────────────────────

function EventCard({ reward, index, onClick }: { reward: LoopReward; index: number; onClick: () => void }) {
  const isSoldOut = reward.capacity != null && reward.spots_remaining === 0;
  const isLowInventory = reward.spots_remaining != null && reward.spots_remaining > 0 && reward.spots_remaining <= 10;
  const coverSrc = reward.image_url || reward.business?.cover_image_url;

  const typeLabel: Record<string, string> = {
    exclusive_event: 'Exclusive Event',
    experience: 'Experience',
    early_access: 'Early Access',
    vip_upgrade: 'VIP Upgrade',
  };

  return (
    <div
      className="card-elevated overflow-hidden hover-lift cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={isSoldOut ? undefined : onClick}
    >
      <div className="h-36 bg-gradient-to-br from-primary/20 to-lokal-amber/20 relative">
        {coverSrc && (
          <img src={coverSrc} alt={reward.name} className="w-full h-full object-cover" />
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-destructive text-white px-3 py-1 rounded-full text-sm font-bold">
              SOLD OUT
            </span>
          </div>
        )}
        {isLowInventory && (
          <div className="absolute top-2 right-2 bg-destructive text-white text-xs px-2 py-0.5 rounded-full font-semibold">
            {reward.spots_remaining} left!
          </div>
        )}
        {reward.reward_type && typeLabel[reward.reward_type] && (
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            {typeLabel[reward.reward_type]}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1">{reward.name}</h3>
        {reward.event_date && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(reward.event_date), 'EEE, MMM d · h:mm a')}
          </p>
        )}
        {reward.event_location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" />
            {reward.event_location}
          </p>
        )}
        {reward.capacity != null && reward.spots_remaining != null && !isSoldOut && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>{reward.spots_remaining} spots remaining</span>
              <span>{reward.capacity - reward.spots_remaining}/{reward.capacity} filled</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${((reward.capacity - reward.spots_remaining) / reward.capacity) * 100}%` }}
              />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-bold text-primary">{reward.points_cost.toLocaleString()} pts</span>
          <span className="text-xs text-muted-foreground">{reward.business?.name}</span>
        </div>
      </div>
    </div>
  );
}

function RaffleCard({ reward, index, onEnter }: { reward: LoopReward; index: number; onEnter: () => void }) {
  return (
    <div
      className="card-elevated p-4 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-lokal-amber/10 flex items-center justify-center flex-shrink-0">
          <Ticket className="h-6 w-6 text-lokal-amber" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">{reward.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{reward.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>{(reward.raffle_entries_count ?? 0).toLocaleString()} entries so far</span>
            {reward.raffle_drawing_date && (
              <span>Drawing: {format(new Date(reward.raffle_drawing_date), 'MMM d')}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{reward.business?.name}</p>
        </div>
      </div>
      <Button className="w-full mt-3 rounded-xl" onClick={onEnter}>
        Enter Raffle — {reward.points_cost} pts per entry
      </Button>
    </div>
  );
}

function DiscountCard({ reward, index, onRedeem }: { reward: LoopReward; index: number; onRedeem: () => void }) {
  const iconMap: Record<string, React.ElementType> = {
    discount: Tag,
    freebie: Sparkles,
    donation_match: Star,
  };
  const Icon = iconMap[reward.reward_type ?? ''] ?? Tag;

  return (
    <div
      className="card-elevated flex items-center gap-3 p-4 animate-fade-in-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{reward.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{reward.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{reward.business?.name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-primary">{reward.points_cost} pts</p>
        <Button size="sm" variant="outline" className="rounded-xl mt-1 text-xs h-7 px-2" onClick={onRedeem}>
          Redeem
        </Button>
      </div>
    </div>
  );
}
