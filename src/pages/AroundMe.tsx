import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation, HardHat, ChevronRight, TriangleAlert, LogIn } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useMyHome } from '@/hooks/useMyCity';
import { useDevelopmentRadar, useCityFeed, developmentStatusLabel } from '@/hooks/useCityChange';
import { eventTypeLabel, entityPath } from '@/integrations/supabase/city-os';

const RADII = [0.5, 1, 3];

/**
 * Around Me: the Development Radar reduced to a list sorted by distance, with
 * everything else happening nearby mixed in underneath.
 *
 * Distance needs a home address, so this page asks for one rather than showing
 * a list that silently means nothing.
 */
export default function AroundMe() {
  const { user } = useAuth();
  const { data: home, isLoading: homeLoading } = useMyHome();
  const [radius, setRadius] = useState(1);

  const projects = useDevelopmentRadar({ radiusMiles: radius });
  const feed = useCityFeed('mile', { radiusMiles: radius, limit: 40 });

  if (!user) {
    return (
      <>
        <Header title="Around me" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Navigation className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Sign in to see what is near you</h1>
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

  if (!homeLoading && !home) {
    return (
      <>
        <Header title="Around me" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Navigation className="h-6 w-6 text-muted-foreground" />
            </div>
            <h1 className="font-heading text-lg font-semibold">Add your address first</h1>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
              Distance is measured from your front door. Nobody else can see your address.
            </p>
            <Button asChild className="mt-5">
              <Link to="/my-city">Set my address</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const loading = homeLoading || projects.isLoading || feed.isLoading;
  const failed = projects.error || feed.error;

  return (
    <>
      <SEOHead
        title="Around me | ToledoLokal"
        description="Everything happening within a short walk or drive of your address."
      />
      <Header title="Around me" showBack />
      <PageContainer>
        <div className="mb-4">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Around me</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Measured from {home?.address ?? 'your address'}.
          </p>
        </div>

        <div className="mb-5 flex gap-2">
          {RADII.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadius(r)}
              className={
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ' +
                (radius === r
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-card hover:bg-muted/40')
              }
            >
              {r < 1 ? 'Half a mile' : `${r} mile${r > 1 ? 's' : ''}`}
            </button>
          ))}
        </div>

        {failed && (
          <div className="mb-4 flex gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Could not load everything. Check your connection and try again.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <section className="mb-6">
              <h2 className="mb-2 flex items-center gap-2 font-heading text-base font-semibold">
                <HardHat className="h-4 w-4 text-muted-foreground" />
                Being built nearby
              </h2>
              {!projects.data || projects.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing within {radius < 1 ? 'half a mile' : `${radius} miles`}.{' '}
                  <Link to="/built" className="font-medium text-primary">
                    See the whole city
                  </Link>
                  .
                </p>
              ) : (
                <div className="space-y-3">
                  {projects.data.map((row) => (
                    <Link
                      key={row.id}
                      to={`/built/${row.id}`}
                      className="block rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border hover:bg-muted/40"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {developmentStatusLabel(row.status)}
                            </Badge>
                            {row.distance_miles !== null && (
                              <span className="text-[11px] text-muted-foreground">
                                {row.distance_miles} mi away
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-sm font-semibold leading-snug">{row.name}</p>
                          {row.address && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{row.address}</p>
                          )}
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-2 font-heading text-base font-semibold">Happening nearby</h2>
              {!feed.data || feed.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing else within {radius < 1 ? 'half a mile' : `${radius} miles`} right now.
                </p>
              ) : (
                <div className="space-y-3">
                  {feed.data.map((item) => {
                    const to =
                      item.source_table === 'events'
                        ? `/events/${item.source_id}`
                        : item.source_table && item.source_id
                          ? entityPath({
                              source_table: item.source_table,
                              source_id: item.source_id,
                            })
                          : null;
                    const card = (
                      <div className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {item.source === 'change' && item.kind
                              ? eventTypeLabel(item.kind)
                              : item.source}
                          </Badge>
                          {item.distance_miles !== null && (
                            <span className="text-[11px] text-muted-foreground">
                              {item.distance_miles} mi away
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm font-semibold leading-snug">{item.title}</p>
                        {item.body && (
                          <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {item.body}
                          </p>
                        )}
                      </div>
                    );
                    return (
                      <div key={`${item.source}-${item.item_id}`}>
                        {to ? (
                          <Link to={to} className="block transition-opacity hover:opacity-90">
                            {card}
                          </Link>
                        ) : (
                          card
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </PageContainer>
    </>
  );
}
