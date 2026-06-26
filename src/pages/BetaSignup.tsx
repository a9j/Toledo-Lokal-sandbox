import { useState } from 'react';
import { Check } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBetaPhase, useBetaSignupCount } from '@/hooks/useBeta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEOHead } from '@/components/seo/SEOHead';
import { LogoLoader } from '@/components/ui/logo-loader';
import { cn } from '@/lib/utils';

// Public closed-beta signup page. This is the canonical target for the shared
// link / QR code (admin -> Closed Beta -> Share the signup). It uses the
// configured Supabase client, so there is nothing to wire up by hand. Anyone
// can sign up while the beta phase is open_signup; the anon insert is gated on
// that phase server-side. The running total ticks up with every signup.
type Platform = 'apple' | 'android';
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export default function BetaSignup() {
  const queryClient = useQueryClient();
  const { data: phase, isLoading: phaseLoading } = useBetaPhase();
  const { data: count = 0, refetch: refetchCount } = useBetaSignupCount();

  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [memberNumber, setMemberNumber] = useState<number | null>(null);

  const submit = async () => {
    setError('');
    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) { setError('Enter a valid email so we can reach you.'); return; }
    if (!platform) { setError('Let us know if you are on iPhone or Android.'); return; }

    setSubmitting(true);
    // beta_signups is not in the generated types; cast like the other beta hooks.
    const { error: insertError } = await supabase
      .from('beta_signups' as never)
      .insert({ email: clean, platform, source: 'qr' } as never);
    setSubmitting(false);

    if (insertError) {
      // RLS rejects the insert once the phase flips to cohort_live.
      const code = (insertError as { code?: string }).code;
      if (code === '23505') {
        // Already signed up with this email — treat as success.
      } else if (code === '42501') {
        setError('The beta is now closed to the public. Thanks for your interest.');
        return;
      } else {
        setError('Something went wrong saving your spot. Please try again.');
        return;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['beta-signup-count'] });
    const { data: fresh } = await refetchCount();
    setMemberNumber(typeof fresh === 'number' && fresh > 0 ? fresh : count + 1);
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

          {phase === 'cohort_live' ? (
            // Public signups are closed.
            <div className="mt-8 text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                Beta is now closed to the public
              </h1>
              <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                Thanks for your interest. The founding beta is open only to our early
                members right now. Toledo Lokal opens to everyone soon.
              </p>
            </div>
          ) : memberNumber !== null ? (
            // Success.
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">You're on the list.</h1>
              <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                Your spot in the Toledo Lokal beta is saved. We'll email you the moment
                the app clears review.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-lokal-gold/10 px-4 py-2 text-sm font-semibold text-lokal-gold">
                Founding beta member #{memberNumber}
              </div>
            </div>
          ) : (
            // Signup form.
            <>
              <h1 className="mt-6 text-center font-display text-3xl font-semibold tracking-tight">
                Help build Toledo Lokal first.
              </h1>
              <p className="mt-3 text-center text-sm font-light leading-relaxed text-muted-foreground">
                Join the founding beta and get first access the day the app clears
                review, plus a private cohort to shape what gets built.
              </p>
              {count > 0 && (
                <p className="mt-2 text-center text-xs font-medium text-lokal-gold">
                  {count} {count === 1 ? 'person has' : 'people have'} joined so far
                </p>
              )}

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
                  {submitting ? 'Saving…' : 'Save my spot'}
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
