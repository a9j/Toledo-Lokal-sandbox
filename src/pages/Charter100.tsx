import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MessageSquarePlus, Lightbulb, Megaphone, QrCode } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCohort, useCohortPinned } from '@/hooks/useCohort';
import { SeatCounter } from '@/components/charter100/SeatCounter';
import { Charter100Badge } from '@/components/charter100/Charter100Badge';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { LogoLoader } from '@/components/ui/logo-loader';
import { useToast } from '@/hooks/use-toast';

const SLUG = 'charter-100';

// Static, admin-authored "What's coming" content for Phase 1 — the channel for
// telling this cohort about new features first. (Admin editing lands with the
// admin-cohort-controls work; no backend needed here.)
const WHATS_COMING = {
  title: 'What\'s coming',
  body:
    'You\'ll see new features here before anyone else, and your feedback shapes what ships next. First up: early access to the Today daily digest.',
};

function FeedbackComposer({ onSubmitted }: { onSubmitted: () => void }) {
  const { toast } = useToast();
  const [kind, setKind] = useState<'feedback' | 'idea'>('feedback');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.rpc('submit_cohort_feedback' as never, {
      p_slug: SLUG,
      p_kind: kind,
      p_body: body.trim(),
    } as never);
    setSubmitting(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Could not send', description: 'Please try again.' });
      return;
    }
    setBody('');
    toast({ title: kind === 'idea' ? 'Idea sent' : 'Feedback sent', description: 'Thank you — we read every one.' });
    onSubmitted();
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquarePlus className="h-5 w-5 text-lokal-gold" />
        <h2 className="font-display text-lg font-semibold">Your voice shapes this</h2>
      </div>
      <div className="mb-3 flex gap-2">
        <Button variant={kind === 'feedback' ? 'default' : 'outline'} size="sm" onClick={() => setKind('feedback')}>
          Share feedback
        </Button>
        <Button variant={kind === 'idea' ? 'default' : 'outline'} size="sm" onClick={() => setKind('idea')}>
          <Lightbulb className="mr-1 h-4 w-4" /> Suggest an idea
        </Button>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder={kind === 'idea' ? 'What should we build?' : 'What\'s working, what isn\'t?'}
        className="w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button className="mt-3" onClick={submit} disabled={submitting || !body.trim()}>
        {submitting ? 'Sending…' : 'Send'}
      </Button>
    </div>
  );
}

export default function Charter100() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { cohort, seats, membership, isLoading, refetchSeats } = useCohort(SLUG);

  const { data: filled } = useQuery({
    queryKey: ['charter-100-count'],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('charter_100_count' as never);
      if (error) throw error;
      return (data as unknown as number) ?? 0;
    },
  });
  const signupCount = filled ?? 0;
  const spotsLeft = Math.max(0, 100 - signupCount);

  useEffect(() => {
    const channel = supabase
      .channel('charter-100-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'beta_signups' },
        () => queryClient.invalidateQueries({ queryKey: ['charter-100-count'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: pinned } = useCohortPinned(SLUG);
  const whatsComing = pinned ?? WHATS_COMING;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased safe-area-top-lg">
      <SEOHead title="Charter 100" url="/charter-100" />
      <div className="mx-auto max-w-2xl px-6 pt-12 pb-10">
        {/* ── Cover / framing ─────────────────────────────────────────── */}
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
            Founding cohort · 100 seats
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {cohort?.name ?? 'Charter 100'}
          </h1>
          {cohort?.mission && (
            <p className="mx-auto mt-3 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
              {cohort.mission}
            </p>
          )}
        </header>

        {/* ── Live seat counter ───────────────────────────────────────── */}
        <section className="mt-10">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <LogoLoader size="md" />
            </div>
          ) : (
            <SeatCounter joined={signupCount} cap={seats.cap} />
          )}
        </section>

        {/* ── Your seat ───────────────────────────────────────────────── */}
        {membership ? (
          <section className="mt-8 flex flex-col items-center gap-2 text-center">
            <Charter100Badge variant="full" />
            <p className="font-display text-lg font-semibold">You're #{membership.position}</p>
          </section>
        ) : (
          !isLoading && (
            <section className="mt-8 rounded-2xl border border-dashed border-border/60 p-4 text-center text-sm text-muted-foreground">
              <QrCode className="mx-auto mb-2 h-5 w-5" />
              {user
                ? 'Have a Charter 100 invite? Scan your code to claim a seat.'
                : 'Charter 100 is invite-only. Scan a current code to join.'}
            </section>
          )
        )}

        {/* ── What's coming (static pinned) ───────────────────────────── */}
        <section className="mt-10 rounded-2xl border border-lokal-gold/30 bg-lokal-gold/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-lokal-gold" />
            <h2 className="font-display text-lg font-semibold">{whatsComing.title}</h2>
          </div>
          <p className="whitespace-pre-line text-sm font-light leading-relaxed text-muted-foreground">{whatsComing.body}</p>
        </section>

        {/* ── Feedback (members only) ─────────────────────────────────── */}
        {membership && (
          <section className="mt-6">
            <FeedbackComposer onSubmitted={() => void refetchSeats()} />
          </section>
        )}

        {signupCount >= seats.cap && !membership && (
          <section className="mt-10 text-center">
            <Sparkles className="mx-auto mb-2 h-6 w-6 text-lokal-gold" />
            <Button asChild variant="secondary">
              <Link to="/">Join the waitlist</Link>
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
