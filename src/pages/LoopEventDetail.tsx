import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLoop } from '@/contexts/LoopContext';
import { toast } from 'sonner';
import type { LoopReward } from '@/hooks/useLoopRewards';

export default function LoopEventDetail() {
  const { rewardId } = useParams<{ rewardId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet, refreshWallet } = useLoop();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [reserveError, setReserveError] = useState<string | null>(null);

  const { data: reward, isLoading } = useQuery({
    queryKey: ['loop-reward-detail', rewardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loop_rewards')
        .select(`
          *,
          business:businesses(id, name, logo_url, cover_image_url, neighborhood:neighborhoods(name))
        `)
        .eq('id', rewardId!)
        .single();
      if (error) throw error;
      return data as LoopReward;
    },
    enabled: !!rewardId,
  });

  // Check if user is already registered
  const { data: existingRegistration } = useQuery({
    queryKey: ['event-registration', rewardId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('loop_event_attendees')
        .select('ticket_code, status')
        .eq('reward_id', rewardId!)
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .maybeSingle();
      return data;
    },
    enabled: !!rewardId && !!user,
  });

  const isSoldOut = reward?.capacity != null && reward.spots_remaining === 0;
  const pointsBalance = wallet?.points_balance ?? 0;
  const canAfford = !reward || pointsBalance >= reward.points_cost;

  const handleReserve = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!reward) return;
    setIsProcessing(true);
    setReserveError(null);
    try {
      const { data, error } = await supabase.rpc('reserve_event_spot', {
        p_user_id: user.id,
        p_reward_id: reward.id,
        p_entries: 1,
      });
      if (error) throw error;
      const result = data as { success: boolean; ticket_code?: string; error?: string };
      if (!result.success) {
        setReserveError(result.error ?? 'Reservation failed');
        setShowConfirm(false);
        return;
      }
      setTicketCode(result.ticket_code ?? null);
      setShowConfirm(false);
      refreshWallet();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setReserveError(msg);
      setShowConfirm(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 pt-safe-top pb-4">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <Skeleton className="h-48 w-full" />
        <div className="px-4 pt-4 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!reward) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <p className="font-semibold mb-2">Event not found</p>
          <Button onClick={() => navigate('/loop')}>Back to Loop</Button>
        </div>
      </div>
    );
  }

  const coverSrc = reward.image_url || reward.business?.cover_image_url;

  return (
    <>
      <SEOHead title={`${reward.name} | Loop Marketplace`} description={reward.description ?? ''} />

      <div className="min-h-screen bg-background pb-32">
        {/* Back button */}
        <div className="px-4 pt-safe-top pb-2">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* Cover image */}
        <div className="h-48 bg-gradient-to-br from-primary/20 to-lokal-amber/20 relative">
          {coverSrc && (
            <img src={coverSrc} alt={reward.name} className="w-full h-full object-cover" />
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-destructive text-white px-4 py-2 rounded-full font-bold text-lg">
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        <div className="px-4 max-w-lg mx-auto">
          {/* Title + type badge */}
          <div className="pt-5 mb-4">
            <h1 className="text-2xl font-bold text-foreground">{reward.name}</h1>
            {reward.reward_type && (
              <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {reward.reward_type.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Meta info */}
          <div className="space-y-2 mb-4">
            {reward.event_date && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{format(new Date(reward.event_date), 'EEEE, MMMM d, yyyy · h:mm a')}</span>
              </div>
            )}
            {reward.event_location && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{reward.event_location}</span>
              </div>
            )}
            {reward.business && (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Hosted by {reward.business.name}</span>
              </div>
            )}
          </div>

          {/* Capacity bar */}
          {reward.capacity != null && reward.spots_remaining != null && !isSoldOut && (
            <div className="mb-4 p-3 rounded-xl bg-muted">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-foreground">
                  {reward.spots_remaining} spot{reward.spots_remaining !== 1 ? 's' : ''} remaining
                </span>
                <span className="text-muted-foreground">
                  {reward.capacity - reward.spots_remaining}/{reward.capacity} filled
                </span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((reward.capacity - reward.spots_remaining) / reward.capacity) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Description */}
          {reward.description && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-2">
                About This Event
              </h2>
              <p className="text-sm text-foreground leading-relaxed">{reward.description}</p>
            </div>
          )}

          {/* Already registered */}
          {existingRegistration && (
            <div className="card-elevated p-4 flex items-start gap-3 mb-4 border-lokal-forest/20">
              <CheckCircle2 className="h-5 w-5 text-lokal-forest flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">You're already registered!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ticket code:{' '}
                  <span className="font-mono font-bold tracking-widest text-primary">
                    {existingRegistration.ticket_code}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {reserveError && (
            <div className="card-elevated p-4 flex items-start gap-3 mb-4 border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{reserveError}</p>
            </div>
          )}

          {/* Ticket success screen */}
          {ticketCode && (
            <div className="card-elevated p-6 text-center mb-4 border-lokal-forest/20">
              <CheckCircle2 className="h-12 w-12 text-lokal-forest mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-1">Spot Reserved!</h3>
              <p className="text-sm text-muted-foreground mb-4">Show this at the door</p>
              <div className="text-4xl font-bold tracking-widest text-primary font-mono mb-4">
                {ticketCode}
              </div>
              <p className="text-xs text-muted-foreground">
                {reward.points_cost.toLocaleString()} points deducted from your wallet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      {!ticketCode && !existingRegistration && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur border-t border-border p-4 pb-safe-bottom">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div>
              <p className="text-xl font-bold text-primary">{reward.points_cost.toLocaleString()} pts</p>
              {!canAfford && (
                <p className="text-xs text-destructive">
                  Need {(reward.points_cost - pointsBalance).toLocaleString()} more pts
                </p>
              )}
            </div>
            <Button
              className="flex-1 h-12 rounded-xl text-base font-medium"
              disabled={isSoldOut || !canAfford || isProcessing}
              onClick={() => {
                if (!user) { navigate('/auth'); return; }
                setShowConfirm(true);
              }}
            >
              {isSoldOut
                ? 'Sold Out'
                : !canAfford
                ? 'Not Enough Points'
                : isProcessing
                ? 'Processing...'
                : 'Reserve Your Spot →'}
            </Button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Reservation</DialogTitle>
            <DialogDescription>
              Reserve a spot at <strong>{reward.name}</strong> for{' '}
              <strong>{reward.points_cost.toLocaleString()} points</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={handleReserve} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Reserve Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
