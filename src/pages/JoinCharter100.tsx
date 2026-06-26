import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Sparkles, Clock, KeyRound, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useJoinCohort, type JoinResult } from '@/hooks/useJoinCohort';

// Server-validated front door to Charter 100. The token in the URL is only a
// convenience — the join-cohort function decides every outcome. This page just
// renders the result in-voice. Reached by scanning a tokenized QR or link.
//
// Signed-out resume: we stash the full join URL and route through /auth, which
// honors `post_auth_redirect` and lands the user right back here, token intact.
const RESUME_KEY = 'post_auth_redirect';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SEOHead title="Charter 100" url="/join/charter-100" noindex />
      <section className="safe-area-pad-top flex min-h-[100svh] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </div>
  );
}

function Eyebrow() {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
      Charter 100 · Founding cohort
    </p>
  );
}

export default function JoinCharter100() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const { user, isLoading } = useAuth();
  const { join, loading, result } = useJoinCohort();
  const navigate = useNavigate();
  const attempted = useRef(false);

  // Run the join exactly once, only when signed in with a token in hand.
  useEffect(() => {
    if (isLoading || attempted.current) return;
    if (!user || !token) return;
    attempted.current = true;
    void join(token);
  }, [isLoading, user, token, join]);

  // ── No token at all ──────────────────────────────────────────────────────
  if (!token) {
    return (
      <Shell>
        <Eyebrow />
        <KeyRound className="mx-auto mt-6 h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          This invite isn't active
        </h1>
        <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
          Charter 100 is invite-only. Scan a current Charter 100 code, or ask a
          founder for a fresh link.
        </p>
      </Shell>
    );
  }

  // ── Still resolving auth ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Shell>
        <Eyebrow />
        <p className="mt-6 text-sm text-muted-foreground">Checking your seat…</p>
      </Shell>
    );
  }

  // ── Signed out → route to /auth, resume back here with the token intact ──
  if (!user) {
    return (
      <Shell>
        <Eyebrow />
        <LogIn className="mx-auto mt-6 h-10 w-10 text-lokal-gold" />
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          Claim your seat
        </h1>
        <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
          Sign in or create your account to take your place in the founding 100.
          We'll bring you right back.
        </p>
        <Button
          className="mt-6 w-full"
          onClick={() => {
            sessionStorage.setItem(RESUME_KEY, `/join/charter-100?token=${encodeURIComponent(token)}`);
            localStorage.setItem(RESUME_KEY, `/join/charter-100?token=${encodeURIComponent(token)}`);
            navigate('/auth');
          }}
        >
          Sign in to continue <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </Shell>
    );
  }

  // ── Joining ──────────────────────────────────────────────────────────────
  if (loading || !result) {
    return (
      <Shell>
        <Eyebrow />
        <p className="mt-6 text-sm text-muted-foreground">Taking your seat…</p>
      </Shell>
    );
  }

  return <JoinOutcome result={result} />;
}

function JoinOutcome({ result }: { result: JoinResult }) {
  switch (result.status) {
    case 'success':
      return (
        <Shell>
          <Eyebrow />
          <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-lokal-gold/15">
            <BadgeCheck className="h-9 w-9 text-lokal-gold" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
            You're in.
          </h1>
          {typeof result.position === 'number' && (
            <p className="mt-3 font-display text-4xl font-semibold text-lokal-gold">
              You're #{result.position}
            </p>
          )}
          <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
            The Charter 100 badge is yours — permanently. You'll get new features
            first, and a real channel to shape what we build.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/charter-100">
              Enter Charter 100 <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Shell>
      );

    case 'already_member':
      return (
        <Shell>
          <Eyebrow />
          <BadgeCheck className="mx-auto mt-6 h-10 w-10 text-lokal-gold" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            You're already in
          </h1>
          {typeof result.position === 'number' && (
            <p className="mt-2 text-sm text-muted-foreground">
              Seat #{result.position} is yours.
            </p>
          )}
          <Button asChild className="mt-6 w-full">
            <Link to="/charter-100">
              Enter Charter 100 <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </Shell>
      );

    case 'full':
      return (
        <Shell>
          <Eyebrow />
          <Sparkles className="mx-auto mt-6 h-10 w-10 text-lokal-gold" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            The first 100 are in
          </h1>
          <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
            Charter 100 is full. Join the waitlist and you'll be first to know
            when Toledo Lokal opens to everyone.
          </p>
          <Button asChild variant="secondary" className="mt-6 w-full">
            <Link to="/">Join the waitlist</Link>
          </Button>
        </Shell>
      );

    case 'invalid_token':
      return (
        <Shell>
          <Eyebrow />
          <Clock className="mx-auto mt-6 h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            This invite isn't active
          </h1>
          <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
            It may have expired or already been used. Ask a founder for a current
            Charter 100 code.
          </p>
        </Shell>
      );

    // no_profile / error — honest, no apology, points forward.
    default:
      return (
        <Shell>
          <Eyebrow />
          <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight">
            We couldn't finish that
          </h1>
          <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
            Something interrupted the join. Reopen your invite link to try again.
          </p>
        </Shell>
      );
  }
}
