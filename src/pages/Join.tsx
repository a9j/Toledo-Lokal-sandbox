import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { CITY } from '@/lib/city';

// Public, unlisted landing page reached by QR code or a shared link.
// No auth: this renders for everyone and must read top-to-bottom on a phone.

const WHY = [
  {
    title: 'Locally owned, end to end',
    body: `Built in ${CITY.name} for ${CITY.name}. No outside chain takes a cut of what happens here.`,
  },
  {
    title: 'Trust over volume',
    body: 'A tight, vetted network of real neighbors beats a feed full of strangers chasing the next discount.',
  },
  {
    title: 'Hyperlocal by design',
    body: 'Businesses, residents, nonprofits, and schools, connected block by block instead of nationwide.',
  },
  {
    title: 'Money that stays home',
    body: `Every dollar spent through the network keeps circulating across ${CITY.metro} instead of leaving it.`,
  },
];

const FOUNDING_BENEFITS = [
  'Free forever core access, no monthly fee, ever.',
  'A silver Founding badge on your public presence.',
  'A permanent credit on the origin wall, your name stays in the record.',
  '50% lifetime discount on every add-on we ever build.',
  'An advisory voice in how the platform grows.',
];

const STEPS = [
  {
    n: '1',
    title: 'Create your account',
    body: 'Sign up on the web today. It takes about a minute.',
  },
  {
    n: '2',
    title: 'Claim your Founding seat',
    body: 'Tell us who you are. Seats in the First Wave are limited.',
  },
  {
    n: '3',
    title: 'Help shape what comes next',
    body: 'Your badge, your credit, and your advisory voice are locked in for good.',
  },
];

export default function Join() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SEOHead
        title="Become a Founding Partner"
        description={`Join the first wave of ${CITY.name} businesses, residents, nonprofits, and schools building local civic infrastructure that keeps community spending circulating at home.`}
        url="/join"
        noindex
      />

      {/* ===== Section 1: Hero ===== */}
      <section className="safe-area-pad-top relative flex min-h-[100svh] flex-col justify-center overflow-hidden px-6 pb-12">
        {/* Subtle paper-grain editorial wash, gold reserved for accents only */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-lokal-blue/5 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
            {CITY.name} Civic Infrastructure
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            A shared layer for {CITY.name}, owned by the people who live here.
          </h1>
          <p className="mt-5 max-w-xl text-lg font-light leading-relaxed text-muted-foreground sm:text-xl">
            This is not a coupon app. It is the connective tissue that keeps local
            spending circulating through one interconnected network of {CITY.name}{' '}
            businesses, residents, nonprofits, and schools.
          </p>

          <a href="#signup" className="mt-9 inline-block">
            <Button className="h-12 rounded-full px-8 text-base font-semibold">
              Become a Founding Partner
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* ===== Section 2: Why this is groundbreaking ===== */}
      <section className="border-t border-border/60 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Why this is groundbreaking
          </p>
          <div className="mt-10 space-y-10">
            {WHY.map((item) => (
              <div key={item.title}>
                <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  {item.title}
                </h2>
                <p className="mt-3 text-lg font-light leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 3: The Founding 25 (First Wave) ===== */}
      <section className="bg-muted/30 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
            The Founding 25 . First Wave
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-lokal-gold/40 bg-lokal-gold/10 px-3 py-1 text-sm font-medium text-lokal-gold">
            <BadgeCheck className="h-4 w-4" />
            Silver Founding badge
          </div>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            A permanent place in how {CITY.name} got built.
          </h2>
          <p className="mt-4 text-lg font-light leading-relaxed text-muted-foreground">
            The First Wave is finite. Once the seats are claimed they are gone, and
            the identity that comes with one is permanent.
          </p>

          <ul className="mt-10 space-y-5">
            {FOUNDING_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lokal-gold" />
                <span className="text-lg font-light leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Section 4: Coming soon tease ===== */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Sparkles className="h-5 w-5 shrink-0 text-lokal-gold" />
          <p className="text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
            Loop Points, civic rewards for Founding partners, are on the way.
          </p>
        </div>
      </section>

      {/* ===== Section 5: How to sign up ===== */}
      <section
        id="signup"
        className="scroll-mt-6 border-t border-border/60 px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            How to sign up
          </p>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Sign up on the web today.
          </h2>
          <p className="mt-3 text-lg font-light leading-relaxed text-muted-foreground">
            Our iOS and Android apps are on the way. You do not have to wait for
            them. Everything you need to claim a Founding seat is on the web right
            now.
          </p>

          <ol className="mt-10 space-y-8">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 font-light leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <Link to="/signup" className="mt-10 inline-block">
            <Button className="h-12 rounded-full px-8 text-base font-semibold">
              Sign up on the web
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>

          {/*
            APP STORE BUTTONS PLACEHOLDER
            The iOS app is still in App Store review and we do not link to it yet.
            On approval, render the App Store and Google Play badges here and keep
            the web sign-up button above as the secondary path. Do not add store
            links before both listings are live.
          */}
        </div>
      </section>

      {/* ===== Section 6: Footer ===== */}
      <footer className="safe-area-bottom border-t border-border/60 px-6 py-12">
        <div className="mx-auto max-w-2xl space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">MyMomentous LLC</p>
          <p>
            <a
              href="mailto:anthony@toledolokal.com"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              anthony@toledolokal.com
            </a>
          </p>
          <p>
            <Link
              to="/"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Back to home
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
