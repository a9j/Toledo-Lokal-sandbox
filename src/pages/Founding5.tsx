import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SecureImage } from '@/components/ui/secure-image';
import { Founding5ApplyModal } from '@/components/founding5/Founding5ApplyModal';
import { FoundingMemberCard } from '@/components/founding5/FoundingMemberCard';
import { EmptySlotCard } from '@/components/founding5/EmptySlotCard';
import { FoundingMember, FOUNDING_5_TOTAL } from '@/components/founding5/types';

// TODO: swap for the real Toledo footage. The hero supports an image or a
// looping muted <video>; this placeholder uses an image for now.
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80&auto=format&fit=crop';

// TODO: replace with Anthony's real number.
const ANTHONY_PHONE = '(419) 555-0123';

// Step 3 replaces this mock with live data from Supabase.
const MOCK_MEMBERS: FoundingMember[] = [
  {
    id: 'mock-1',
    slug: 'mock-1',
    foundingNumber: 1,
    name: 'The Flying Joe',
    ownerName: 'Maria Delgado',
    ownerImageUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80&auto=format&fit=crop',
    heroImageUrl:
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&q=80&auto=format&fit=crop',
    neighborhood: 'Old West End',
    quote: 'We pour every cup like the whole city is watching.',
  },
  {
    id: 'mock-2',
    slug: 'mock-2',
    foundingNumber: 2,
    name: 'Registry Bistro',
    ownerName: 'Erika Rapp',
    ownerImageUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop',
    heroImageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&auto=format&fit=crop',
    neighborhood: 'Downtown',
    quote: 'Toledo grows the best food. We just put it on the plate.',
  },
];

const BENEFITS = [
  'Permanent No. 01 through No. 05 badge on your profile.',
  'Featured placement forever, not just at launch.',
  'Founding rate on Lokal Points, locked for life.',
  'Direct input on the platform as we build.',
  'A seat at the table for Toledo’s next decade.',
];

export default function Founding5() {
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    document.title = 'The Founding 5 - Toledo Lokal';
    window.scrollTo(0, 0);
  }, []);

  const members = useMemo(
    () => [...MOCK_MEMBERS].sort((a, b) => a.foundingNumber - b.foundingNumber),
    [],
  );

  const claimedCount = members.length;
  const claimedNumbers = useMemo(() => new Set(members.map((m) => m.foundingNumber)), [members]);
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
            {claimedCount} of {FOUNDING_5_TOTAL} claimed
          </div>

          <Button
            onClick={openApply}
            className="mt-9 h-12 rounded-full bg-white px-8 text-base font-semibold text-black hover:bg-white/90"
          >
            Apply to be next
          </Button>
        </div>

        <div className="absolute bottom-8 z-10 text-white/70">
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </div>
      </section>

      {/* ===== Section 2: The Founding Members ===== */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl">
          <p className="mb-12 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            The Founding Members
          </p>
          <div className="space-y-10">
            {members.map((member) => (
              <FoundingMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 3: Empty slots ===== */}
      <section className="px-6 pb-24 sm:pb-32">
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
