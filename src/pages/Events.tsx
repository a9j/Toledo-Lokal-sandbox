import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { EventCard } from '@/components/cards/EventCard';
import { useEvents } from '@/hooks/useEvents';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format, isToday, isThisWeek, isWeekend, startOfDay, endOfDay, addDays } from 'date-fns';
import { SEOHead } from '@/components/seo/SEOHead';

type FilterType = 'all' | 'today' | 'weekend' | 'week';

export default function Events() {
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { data: events, isLoading } = useEvents();

  const filteredEvents = events?.filter(event => {
    const eventDate = new Date(event.start_date_time);
    
    switch (filter) {
      case 'today':
        return isToday(eventDate);
      case 'weekend':
        return isWeekend(eventDate) && isThisWeek(eventDate);
      case 'week':
        return isThisWeek(eventDate);
      default:
        return true;
    }
  });

  // Group events by date
  const groupedEvents = filteredEvents?.reduce((acc, event) => {
    const dateKey = format(new Date(event.start_date_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  return (
    <>
      <SEOHead 
        title="Events in Toledo"
        description="Discover upcoming events, concerts, festivals, and community gatherings in Toledo, Ohio. Find things to do in the Glass City."
        url="/events"
        type="website"
        keywords={['Toledo events', 'Toledo concerts', 'Toledo festivals', 'things to do in Toledo', 'Glass City events']}
      />
      <Header title="Events" />
      
      <PageContainer className="space-y-4">
        {/* Filter buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {[
            { key: 'all', label: 'All' },
            { key: 'today', label: 'Today' },
            { key: 'weekend', label: 'Weekend' },
            { key: 'week', label: 'This Week' },
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              className="rounded-full flex-shrink-0"
              onClick={() => setFilter(key as FilterType)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Events list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : groupedEvents && Object.keys(groupedEvents).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
              <section key={dateKey}>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {isToday(new Date(dateKey)) 
                    ? 'Today' 
                    : format(new Date(dateKey), 'EEEE, MMMM d')}
                </h3>
                <div className="space-y-3">
                  {dateEvents?.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No events found</p>
          </div>
        )}
      </PageContainer>
    </>
  );
}
