import { format } from 'date-fns';
import { Calendar, MapPin, Gift, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface EmptyDailyDropProps {
  date: Date;
}

export function EmptyDailyDrop({ date }: EmptyDailyDropProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['daily-drop-fallback'],
    queryFn: async () => {
      const [events, deals, businesses] = await Promise.all([
        supabase
          .from('events')
          .select('id, title, start_date_time')
          .eq('status', 'approved')
          .gt('start_date_time', new Date().toISOString())
          .order('start_date_time', { ascending: true })
          .limit(3),
        supabase
          .from('deals')
          .select('id, title, business:businesses!inner(name)')
          .eq('status', 'active')
          .limit(3),
        supabase
          .from('businesses')
          .select('id, name, slug')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(4),
      ]);
      return {
        events: events.data ?? [],
        deals: deals.data ?? [],
        businesses: businesses.data ?? [],
      };
    },
  });

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border/60 bg-card p-7 text-center">
        <p className="text-sm font-semibold text-foreground">
          Here's what's happening around the city
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {(data?.events?.length ?? 0) > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Events</h3>
                <Link to="/events" className="text-xs text-primary flex items-center gap-0.5">
                  All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {data!.events.map((e: { id: string; title: string; start_date_time: string }) => (
                  <Link
                    key={e.id}
                    to={`/events/${e.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 hover:border-primary/40 transition-colors"
                  >
                    <Calendar className="h-4 w-4 text-primary shrink-0" strokeWidth={1.8} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                      <p className="text-[11px] text-muted-foreground">{format(new Date(e.start_date_time), 'MMM d, h:mm a')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(data?.deals?.length ?? 0) > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Deals</h3>
                <Link to="/deals" className="text-xs text-primary flex items-center gap-0.5">
                  All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-2">
                {data!.deals.map((d: { id: string; title: string; business: { name: string } }) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
                  >
                    <Gift className="h-4 w-4 text-primary shrink-0" strokeWidth={1.8} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                      <p className="text-[11px] text-muted-foreground">{d.business?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(data?.businesses?.length ?? 0) > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New on Lokal</h3>
                <Link to="/discover" className="text-xs text-primary flex items-center gap-0.5">
                  All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {data!.businesses.map((b: { id: string; name: string; slug: string }) => (
                  <Link
                    key={b.id}
                    to={`/business/${b.id}`}
                    className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card p-3 hover:border-primary/40 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-primary shrink-0" strokeWidth={1.8} />
                    <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
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
