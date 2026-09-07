import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Store, CalendarDays, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/city-os/FollowButton';
import { RecentChanges } from '@/components/city-os/RecentChanges';
import { AskToledoPanel } from '@/components/city-os/AskToledoPanel';
import { CityMemory } from '@/components/city-os/CityMemory';

/**
 * Neighborhood page.
 *
 * Minimal on purpose. Phase 1 needs somewhere to hang the follow button and the
 * change log; Phase 2 turns this into My Neighborhood and Phase 3 adds
 * "Ask [Neighborhood]".
 */
export default function NeighborhoodDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: neighborhood, isLoading, error } = useQuery({
    queryKey: ['neighborhood', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('id, name')
        .eq('id', id as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: businesses } = useQuery({
    queryKey: ['neighborhood-businesses', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category')
        .eq('neighborhood_id', id as string)
        .eq('status', 'approved')
        .order('name')
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <>
        <Header title="Neighborhood" showBack />
        <PageContainer>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-4 h-10 w-full" />
          <Skeleton className="mt-4 h-32 w-full" />
        </PageContainer>
      </>
    );
  }

  // A failed request is not the same as a neighborhood that does not exist.
  // Saying "not found" on a dropped connection sends people looking for a
  // problem that is not there.
  if (error || !neighborhood) {
    return (
      <>
        <Header title="Neighborhood" showBack />
        <PageContainer>
          <div className="py-16 text-center">
            <h1 className="font-heading text-lg font-semibold">
              {error ? 'Could not load this neighborhood' : 'Neighborhood not found'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {error
                ? 'Check your connection and try again.'
                : 'This one may have been renamed or removed.'}
            </p>
            <Button asChild variant="secondary" className="mt-5">
              <Link to="/discover">Browse Toledo</Link>
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title={neighborhood.name} showBack />
      <PageContainer>
        <div className="mb-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Neighborhood</span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight">
            {neighborhood.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Follow this to get closures, permits and openings here in your inbox.
          </p>
        </div>

        <FollowButton
          source={{ table: 'neighborhoods', id: neighborhood.id }}
          label={`Follow ${neighborhood.name}`}
          className="w-full"
        />

        <div className="mt-6 space-y-6">
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              Ask {neighborhood.name}
            </h2>
            {/* Same engine as Ask Toledo, pinned to this neighborhood so the
                answers only come from here. */}
            <AskToledoPanel
              compact
              neighborhoodId={neighborhood.id}
              neighborhoodName={neighborhood.name}
              suggestions={[
                `What is on in ${neighborhood.name}`,
                `Places to eat in ${neighborhood.name}`,
                `What changed in ${neighborhood.name}`,
              ]}
            />
          </section>

          <RecentChanges source={{ table: 'neighborhoods', id: neighborhood.id }} />

          <CityMemory
            source={{ table: 'neighborhoods', id: neighborhood.id }}
            title="What used to be here"
          />

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Store className="h-4 w-4 text-muted-foreground" />
              Businesses here
            </h2>
            {businesses && businesses.length > 0 ? (
              <div className="space-y-2">
                {businesses.map((business) => (
                  <Link
                    key={business.id}
                    to={`/business/${business.id}`}
                    className="block rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-border hover:bg-muted/40"
                  >
                    <p className="text-sm font-medium">{business.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {String(business.category).replace(/_/g, ' ')}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No businesses listed here yet.
              </p>
            )}
          </section>

          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              What is on
            </h2>
            <Button asChild variant="secondary" className="w-full">
              <Link to="/events">See all Toledo events</Link>
            </Button>
          </section>
        </div>
      </PageContainer>
    </>
  );
}
