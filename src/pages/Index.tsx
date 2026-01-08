import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SearchBar } from '@/components/home/SearchBar';
import { NeighborhoodSelector } from '@/components/home/NeighborhoodSelector';
import { SectionHeader } from '@/components/home/SectionHeader';
import { EventCard } from '@/components/cards/EventCard';
import { DealCard } from '@/components/cards/DealCard';
import { BusinessCard } from '@/components/cards/BusinessCard';
import { useEvents } from '@/hooks/useEvents';
import { useDeals } from '@/hooks/useDeals';
import { useBusinesses } from '@/hooks/useBusinesses';
import { Skeleton } from '@/components/ui/skeleton';

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

  const { data: todayEvents, isLoading: eventsLoading } = useEvents({ today: true, limit: 3 });
  const { data: deals, isLoading: dealsLoading } = useDeals({ limit: 4 });
  const { data: featuredBusinesses, isLoading: businessesLoading } = useBusinesses({ featured: true, limit: 4 });
  const { data: newBusinesses, isLoading: newBusinessesLoading } = useBusinesses({ limit: 4 });

  return (
    <>
      <Header title="Toledo Hub" showNotifications />
      
      <PageContainer className="space-y-6">
        {/* Search */}
        <div className="space-y-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <NeighborhoodSelector 
            selected={selectedNeighborhood} 
            onSelect={setSelectedNeighborhood} 
          />
        </div>

        {/* Tonight in Toledo */}
        <section>
          <SectionHeader title="Tonight in Toledo" viewAllLink="/events" />
          {eventsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : todayEvents?.length ? (
            <div className="space-y-3">
              {todayEvents.map(event => (
                <EventCard key={event.id} event={event} compact />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No events scheduled for today
            </p>
          )}
        </section>

        {/* Top Deals */}
        <section>
          <SectionHeader title="Top Deals Near You" viewAllLink="/deals" />
          {dealsLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : deals?.length ? (
            <div className="space-y-3">
              {deals.slice(0, 2).map(deal => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No deals available right now
            </p>
          )}
        </section>

        {/* Editor Picks */}
        {featuredBusinesses && featuredBusinesses.length > 0 && (
          <section>
            <SectionHeader title="Editor's Picks" />
            <div className="space-y-3">
              {featuredBusinesses.map(business => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </section>
        )}

        {/* New & Notable */}
        <section>
          <SectionHeader title="New & Notable" />
          {newBusinessesLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : newBusinesses?.length ? (
            <div className="space-y-3">
              {newBusinesses.map(business => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              New businesses coming soon
            </p>
          )}
        </section>
      </PageContainer>
    </>
  );
}
