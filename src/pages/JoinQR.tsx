import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { JoinQRCode } from '@/components/join/JoinQRCode';
import { siteUrl } from '@/lib/site-url';
import { CITY } from '@/lib/city';

// Unlisted helper page: pull this up on a phone (or print it) to show a QR
// that opens the public /join page. Points at the production URL via siteUrl
// so the code is correct even when viewed from a Vercel preview deploy.
const JOIN_URL = siteUrl('/join');

export default function JoinQR() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SEOHead title="Join QR" url="/join/qr" noindex />

      <section className="safe-area-pad-top flex min-h-[100svh] flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
          Join {`${CITY.name}Lokal`}
        </p>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Scan to learn more
        </h1>
        <p className="mt-2 max-w-sm text-sm font-light leading-relaxed text-muted-foreground">
          Point a phone camera at this code to get your business on {CITY.name}Lokal.
        </p>

        <div className="mt-8">
          <JoinQRCode url={JOIN_URL} />
        </div>

        <Link
          to="/join"
          className="mt-6 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Open the page
        </Link>
      </section>
    </div>
  );
}
