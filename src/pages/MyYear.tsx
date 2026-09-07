import { Link } from 'react-router-dom';
import { Sparkles, LogIn, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useToledoYear } from '@/hooks/usePlatform';

const KIND_LABEL: Record<string, string> = {
  organization: 'businesses and nonprofits',
  place: 'places',
  event: 'events',
  resource: 'jobs and help',
  issue: 'reports',
  person: 'people',
  transaction: 'transactions',
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="font-heading text-2xl font-semibold leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * My Toledo Year.
 *
 * The numbers are the caller's own and the function takes no user id. The plan
 * asks for a shareable card image; rendering one is a separate job with its own
 * decisions about what a card gives away, so this shows the figures and stops
 * there rather than shipping half an image pipeline.
 */
export default function MyYear() {
  const { user } = useAuth();
  const { data: year, isLoading, error } = useToledoYear();

  if (!user) {
    return (
      <>
        <Header title="My year" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Sign in to see your year</h1>
            <Button asChild className="mt-5">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" />
                Sign in
              </Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const quiet =
    year &&
    year.follows === 0 &&
    year.checkins === 0 &&
    year.issues_reported === 0 &&
    year.memories_added === 0;

  return (
    <>
      <SEOHead title="My Toledo year | ToledoLokal" description="Your year in the city." />
      <Header title="My year" showBack />
      <PageContainer>
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Your {year?.year ?? ''} in Toledo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Only you can see this. Nobody else can ask for it.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Could not load your year. Check your connection and try again.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Stat value={year?.following_now ?? 0} label="Things you follow" />
              <Stat value={year?.checkins ?? 0} label="Check ins" />
              <Stat value={year?.issues_reported ?? 0} label="Things you reported" />
              <Stat value={year?.memories_added ?? 0} label="Memories you added" />
              <Stat value={year?.inbox_items ?? 0} label="Updates you got" />
              <Stat value={year?.neighborhoods_followed ?? 0} label="Neighborhoods" />
            </div>

            {(year?.top_kinds?.length ?? 0) > 0 && (
              <section className="mt-6">
                <h2 className="mb-2 text-sm font-semibold">What you follow most</h2>
                <div className="space-y-2">
                  {year!.top_kinds.map((k) => (
                    <div
                      key={k.kind}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3"
                    >
                      <span className="text-sm">{KIND_LABEL[k.kind] ?? k.kind}</span>
                      <span className="text-sm font-semibold tabular-nums">{k.count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {quiet && (
              <div className="mt-6 rounded-xl border border-border/60 bg-card p-4">
                <p className="text-sm font-semibold">A quiet year so far</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Follow a place, report something broken, or add a memory and this fills up.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/built">See what is being built</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/fix">Report something</Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}
