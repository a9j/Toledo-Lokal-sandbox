import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';

// Shown during the beta window to anyone who isn't beta-eligible. Calm and
// on-message — this is "opening soon", not an error. Email capture reuses the
// existing today_waitlist table (source 'beta_window').
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function BetaWaitlist() {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email.trim())) {
      toast.error('Please enter a real email.');
      return;
    }
    setSubmitting(true);
    // Cast: today_waitlist is not in the generated Supabase types.
    const { error } = await supabase
      .from('today_waitlist' as never)
      .insert({ email: email.trim(), source: 'beta_window' } as never);
    setSubmitting(false);
    if (error) {
      toast.error('Something went wrong. Please try again.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SEOHead title="Opening soon" url="/" noindex />
      <section className="safe-area-pad-top flex min-h-[100svh] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
            Toledo Lokal
          </p>

          {submitted ? (
            <div className="mt-8 flex flex-col items-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-7 w-7 text-emerald-500" strokeWidth={2.5} />
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                You're on the list.
              </h1>
              <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                We'll let you know the moment Toledo Lokal opens to everyone.
              </p>
            </div>
          ) : (
            <>
              <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">
                Toledo Lokal opens to everyone soon
              </h1>
              <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                We're in a short founding window with our Charter 100 residents
                and founding local businesses. Leave your email and you'll be
                first through the door.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="h-12 rounded-full text-center"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-full text-base"
                >
                  {submitting ? 'Saving…' : 'Notify me'}
                </Button>
              </form>
            </>
          )}

          {user ? (
            <button
              onClick={() => signOut()}
              className="mt-8 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="mt-8 inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Already a member or founding business? Sign in
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
