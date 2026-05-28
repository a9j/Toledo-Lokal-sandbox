import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Store, HeartHandshake, CalendarDays, ChevronRight } from 'lucide-react';
import { NeighborhoodEnergy } from './NeighborhoodEnergy';

// Pulse should NEVER feel dead. When the live feed is quiet, surface real local
// discovery: active neighborhoods, local spots, nonprofits, and upcoming events.
export function PulseEmptyState() {
  const { data, isLoading } = useQuery({
    queryKey: ['pulse-empty-state'],
    queryFn: async () => {
      const [businesses, nonprofits, events] = await Promise.all([
        supabase.from('businesses').select('id, name, logo_url').eq('status', 'approved').limit(6),
        supabase.from('nonprofits').select('id, name, slug').eq('status', 'active').limit(4),
        supabase
          .from('events')
          .select('id, title, start_date_time')
          .eq('status', 'approved')
          .gt('start_date_time', new Date().toISOString())
          .order('start_date_time', { ascending: true })
          .limit(4),
      ]);
      return {
        businesses: businesses.data || [],
        nonprofits: nonprofits.data || [],
        events: events.data || [],
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/[0.05] to-transparent p-5 text-center">
        <p className="text-sm font-semibold text-foreground">Toledo is just warming up here</p>
        <p className="mt-1 text-xs text-muted-foreground">
          It's quiet on this view right now — here's what's worth checking out around the city.
        </p>
      </div>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Neighborhood energy</h3>
        <NeighborhoodEnergy />
      </section>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {!!data?.businesses.length && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Store className="h-3.5 w-3.5" /> Local spots to explore
              </h3>
              <div className="-mx-1 flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-1">
                {data.businesses.map((b: { id: string; name: string; logo_url: string | null }) => (
                  <Link
                    key={b.id}
                    to={`/business/${b.id}`}
                    className="flex w-24 shrink-0 flex-col items-center gap-1.5 text-center"
                  >
                    <SecureAvatar storagePath={b.logo_url} fallbackText={b.name} className="h-14 w-14" />
                    <span className="line-clamp-2 text-xs font-medium text-foreground">{b.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!!data?.nonprofits.length && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <HeartHandshake className="h-3.5 w-3.5" /> Nonprofits to support
              </h3>
              <div className="space-y-2">
                {data.nonprofits.map((n: { id: string; name: string; slug: string | null }) => (
                  <Link
                    key={n.id}
                    to={`/community/${n.slug || n.id}`}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-3 py-2.5 hover:border-border"
                  >
                    <span className="text-sm font-medium text-foreground">{n.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!!data?.events.length && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" /> Upcoming events
              </h3>
              <div className="space-y-2">
                {data.events.map((e: { id: string; title: string; start_date_time: string }) => (
                  <Link
                    key={e.id}
                    to={`/events/${e.id}`}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-3 py-2.5 hover:border-border"
                  >
                    <span className="text-sm font-medium text-foreground">{e.title}</span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {new Date(e.start_date_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
