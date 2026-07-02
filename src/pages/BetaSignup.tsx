import { useState } from 'react';
import { Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBetaPhase, useBetaSignupCounts } from '@/hooks/useBeta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEOHead } from '@/components/seo/SEOHead';
import { LogoLoader } from '@/components/ui/logo-loader';
import { cn } from '@/lib/utils';

type Platform = 'apple' | 'android';
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function BetaSignup() {
  const [searchParams] = useSearchParams();
  const { data: phase, isLoading: phaseLoading } = useBetaPhase();
  const queryClient = useQueryClient();
  const { data: counts } = useBetaSignupCounts();

  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    setError('');
    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) { setError('Enter a valid email so we can reach you.'); return; }
    if (!platform) { setError('Let us know if you are on iPhone or Android.'); return; }

    setSubmitting(true);
    const source = searchParams.get('source') || 'facebook_local';
    const { error: insertError } = await supabase
      .from('beta_signups' as never)
      .insert({ email: clean, platform, source } as never);

    if (insertError) {
      const code = (insertError as { code?: string }).code;
      if (code === '23505') {
        // Already signed up -- still show confirmation.
      } else if (code === '42501') {
        setSubmitting(false);
        setError('The beta is full. Thanks for your interest!');
        return;
      } else {
        setSubmitting(false);
        setError('Something went wrong saving your spot. Please try again.');
        return;
      }
    }

    setSubmitting(false);
    setSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ['beta-signup-counts'] });
  };

  if (phaseLoading) {
    return <div className="flex min-h-screen items-center justify-center"><LogoLoader size="lg" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SEOHead title="Join the Toledo Lokal beta" url="/beta" noindex />
      <section className="safe-area-pad-top flex min-h-[100svh] flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
            Toledo Lokal
          </p>

          {phase === 'cohort_live' && counts && counts.spots_left <= 0 ? (
            <div className="mt-8 text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                Beta is full
              </h1>
              <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                Thanks for your interest. All 100 spots have been claimed.
                Toledo Lokal opens to everyone soon.
              </p>
            </div>
          ) : submitted ? (
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">You're on the list.</h1>
              {counts && (
                <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
                  You're #{counts.total} of 100.
                  {counts.spots_left > 0
                    ? ` ${counts.spots_left} ${counts.spots_left === 1 ? 'spot' : 'spots'} left.`
                    : ' All spots are claimed!'}
                </p>
              )}

              <div className="mt-8 w-full rounded-2xl border border-lokal-gold/30 bg-lokal-gold/5 p-5">
                <h2 className="font-display text-lg font-semibold">What happens next</h2>
                <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                  We'll email you a download link as soon as your spot opens.
                  Keep an eye on your inbox.
                </p>
              </div>

              <p className="mt-4 text-xs font-light text-muted-foreground">
                No spam, ever. We'll only email you about the beta.
              </p>
            </div>
          ) : (
            <>
              <h1 className="mt-6 text-center font-display text-3xl font-semibold tracking-tight">
                Help build Toledo Lokal first.
              </h1>
              <p className="mt-3 text-center text-sm font-light leading-relaxed text-muted-foreground">
                Join the founding beta and get first access the day the app clears
                review, plus a private group to shape what gets built.
              </p>

              <div className="mt-6 space-y-4">
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@email.com"
                  className="h-12 rounded-full text-center"
                />

                <div className="grid grid-cols-2 gap-3">
                  {(['apple', 'android'] as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPlatform(p); setError(''); }}
                      className={cn(
                        'rounded-2xl border p-3 text-sm font-semibold transition-colors',
                        platform === p
                          ? 'border-lokal-gold bg-lokal-gold/10 text-lokal-gold'
                          : 'border-border text-foreground hover:border-lokal-gold/50',
                      )}
                      aria-pressed={platform === p}
                    >
                      {p === 'apple' ? 'iPhone' : 'Android'}
                      <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                        {p === 'apple' ? 'Apple / iOS' : 'Samsung, Pixel, etc.'}
                      </span>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={submit}
                  disabled={submitting}
                  className="h-12 w-full rounded-full text-base"
                >
                  {submitting ? 'Saving...' : 'Save my spot'}
                </Button>

                {error && (
                  <p className="rounded-xl bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                    {error}
                  </p>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  We'll only email you about the beta. No spam, ever.
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
