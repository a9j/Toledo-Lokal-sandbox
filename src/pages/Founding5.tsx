import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { SecureImage } from '@/components/ui/secure-image';
import { Founding5ApplyModal } from '@/components/founding5/Founding5ApplyModal';
import { FoundingMemberCard } from '@/components/founding5/FoundingMemberCard';
import { EmptySlotCard } from '@/components/founding5/EmptySlotCard';
import { FOUNDING_5_TOTAL } from '@/components/founding5/types';
import { useFoundingMembers } from '@/hooks/useFoundingMembers';
import { celebrate } from '@/lib/celebrate';

const FOUNDING_50_TOTAL = 50;

// TODO: swap for the real Toledo footage. The hero supports an image or a
// looping muted <video>; this placeholder uses an image for now.
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80&auto=format&fit=crop';

// TODO: replace with Anthony's real number.
const ANTHONY_PHONE = '(419) 555-0123';

const BENEFITS = [
  'Permanent No. 01 through No. 05 badge on your profile.',
  'Featured placement forever, not just at launch.',
  'Founding rate on Lokal Points, locked for life.',
  'Direct input on the platform as we build.',
  'A seat at the table for Toledo’s next decade.',
];

// Animate a number toward its target with an ease-out curve.
function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

export default function Founding5() {
  const [applyOpen, setApplyOpen] = useState(false);
  const { data, isLoading } = useFoundingMembers();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = 'The Founding 5 - Toledo Lokal';
    window.scrollTo(0, 0);
  }, []);

  // Live updates: any change to businesses refetches the founding lists.
  useEffect(() => {
    const channel = supabase
      .channel('founding-5-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => queryClient.invalidateQueries({ queryKey: ['founding-members'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // When a brand newly joins a founding tier, welcome it with a toast and
  // confetti. The first load just records a baseline (no celebration).
  const knownFoundingIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!data) return;
    const all = [...data.founding5, ...data.founding50];

    if (knownFoundingIds.current === null) {
      knownFoundingIds.current = new Set(all.map((m) => m.id));
      return;
    }

    const newcomers = all.filter((m) => !knownFoundingIds.current!.has(m.id));
    if (newcomers.length > 0) {
      newcomers.forEach((m) => {
        const tier = data.founding5.some((f) => f.id === m.id) ? 'Founding 5' : 'Founding 50';
        toast.success(`Welcome ${m.name} to the ${tier}`);
      });
      celebrate();
    }
    knownFoundingIds.current = new Set(all.map((m) => m.id));
  }, [data]);

  const members = useMemo(() => data?.founding5 ?? [], [data]);
  const claimedCount = members.length;
  const founding50Count = data?.founding50.length ?? 0;

  const claimedDisplay = useCountUp(claimedCount);
  const founding50Display = useCountUp(founding50Count);

  const claimedNumbers = useMemo(
    () => new Set(members.map((m) => m.foundingNumber)),
    [members],
  );
  const emptySlots = useMemo(
    () =>
      Array.from({ length: FOUNDING_5_TOTAL }, (_, i) => i + 1).filter(
        (n) => !claimedNumbers.has(n),
      ),
    [claimedNumbers],
  );

  const openApply = () => setApplyOpen(true);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ===== Section 1: Hero ===== */}
      <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="absolute inset-0">
          <SecureImage
            storagePath={HERO_IMAGE}
            alt=""
            priority
            blurUp={false}
            imgClassName="object-cover"
            className="h-full w-full"
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex flex-col items-center text-white">
          <h1 className="font-display text-5xl font-bold tracking-tight sm:text-7xl">
            The Founding 5
          </h1>
          <p className="mt-5 max-w-md text-lg font-light leading-relaxed text-white/85 sm:text-xl">
            Five Toledo originals building the city&rsquo;s operating layer.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            {isLoading ? '…' : claimedDisplay} of {FOUNDING_5_TOTAL} claimed
          </div>

          <Button
            onClick={openApply}
            className="mt-9 h-12 rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-white/90"
          >
            Apply to be next
          </Button>
        </div>

        <div className="absolute bottom-24 z-10 text-white/70">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </div>
      </section>

      {/* ===== Section 2: The Founding Members ===== */}
      {(isLoading || members.length > 0) && (
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl">
            <p className="mb-12 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              The Founding Members
            </p>
            <div className="space-y-10">
              {isLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/3] w-full rounded-3xl" />
                  ))
                : members.map((member) => (
                    <FoundingMemberCard key={member.id} member={member} />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Section 3: Empty slots ===== */}
      {!isLoading && emptySlots.length > 0 && (
        <section className={members.length > 0 ? 'px-6 pb-24 sm:pb-32' : 'px-6 py-24 sm:py-32'}>
          <div className="mx-auto max-w-2xl">
            <p className="mx-auto mb-12 max-w-lg text-center text-xl font-light leading-relaxed text-muted-foreground sm:text-2xl">
              We&rsquo;re choosing three more. One per category: morning, evening, retail, or
              experience.
            </p>
            <div className="space-y-8">
              {emptySlots.map((n) => (
                <EmptySlotCard key={n} slotNumber={n} onApply={openApply} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Founding 50 progress ===== */}
      <section className="px-6 pb-24 sm:pb-28">
        <div className="mx-auto max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            The Founding 50
          </p>
          <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
            {founding50Display} of {FOUNDING_50_TOTAL} claimed
          </p>
          <Progress
            value={(founding50Count / FOUNDING_50_TOTAL) * 100}
            className="mt-5 h-2"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            After the first five, the next fifty help shape what comes next.
          </p>
        </div>
      </section>

      {/* ===== Section 4: What Founding 5 gets ===== */}
      <section className="bg-muted/30 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            What it means to be Founding 5
          </h2>
          <div className="mt-12 space-y-8">
            {BENEFITS.map((line) => (
              <p key={line} className="text-xl font-light leading-relaxed sm:text-2xl">
                {line}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 5: The ask ===== */}
      <section className="flex min-h-[80svh] items-center px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            If you&rsquo;re building something real in Toledo, we want you in the first five.
          </h2>
          <Button
            onClick={openApply}
            className="mt-10 h-12 rounded-full px-10 text-base font-semibold"
          >
            Apply now
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">
            Or text Anthony directly:{' '}
            <a
              href={`sms:${ANTHONY_PHONE.replace(/[^\d+]/g, '')}`}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {ANTHONY_PHONE}
            </a>
          </p>
        </div>
      </section>

      <Founding5ApplyModal open={applyOpen} onOpenChange={setApplyOpen} />
    </div>
  );
}
