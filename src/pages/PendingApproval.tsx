import { Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';

export default function PendingApproval() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <SEOHead title="Request under review" url="/" noindex />
      <section className="safe-area-pad-top flex min-h-[100svh] flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-full max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lokal-gold">
            Toledo Lokal
          </p>

          <div className="mt-8 flex flex-col items-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-lokal-gold/10">
              <Clock className="h-7 w-7 text-lokal-gold" strokeWidth={2} />
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Request under review
            </h1>
            <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
              Thanks for signing up. Your request is under review.
              We'll email you when you're approved.
            </p>
          </div>

          <button
            onClick={() => signOut()}
            className="mt-8 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
