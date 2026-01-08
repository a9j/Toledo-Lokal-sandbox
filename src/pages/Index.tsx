import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { EventsCarousel } from '@/components/home/EventsCarousel';
import { DealsSection } from '@/components/home/DealsSection';
import { NeighborhoodHighlight } from '@/components/home/NeighborhoodHighlight';
import { NonprofitsSection } from '@/components/home/NonprofitsSection';
import { HappeningNow } from '@/components/home/HappeningNow';
import { BottomNav } from '@/components/layout/BottomNav';
import { FirstVisitOnboarding } from '@/components/onboarding/FirstVisitOnboarding';
import { useEvents } from '@/hooks/useEvents';
import { useDeals } from '@/hooks/useDeals';
import { useBusinesses } from '@/hooks/useBusinesses';

export default function Index() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { data: upcomingEvents, isLoading: eventsLoading } = useEvents({ limit: 6 });
  const { data: deals, isLoading: dealsLoading } = useDeals({ limit: 4 });
  const { data: featuredBusinesses, isLoading: featuredLoading } = useBusinesses({ featured: true, limit: 4 });
  const { data: newBusinesses, isLoading: newLoading } = useBusinesses({ limit: 6 });

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboarding-completed');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleSearch = (query: string, filters: { neighborhood?: string; category?: string }) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.neighborhood && filters.neighborhood !== 'all') params.set('neighborhood', filters.neighborhood);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    navigate(`/explore?${params.toString()}`);
  };

  if (showOnboarding) {
    return <FirstVisitOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section with Search */}
      <HeroSection onSearch={handleSearch} />

      {/* Category Grid */}
      <CategoryGrid />

      {/* Featured Places */}
      <FeaturedSection
        title="Featured Places"
        subtitle="Hand-picked local favorites"
        viewAllLink="/explore"
        businesses={featuredBusinesses}
        isLoading={featuredLoading}
        labelText="Editor's Choice"
      />

      {/* Events Carousel */}
      <EventsCarousel
        title="This Week in Toledo"
        subtitle="Concerts, shows, markets & more"
        events={upcomingEvents}
        isLoading={eventsLoading}
        viewAllLink="/events"
      />

      {/* Deals Section */}
      <DealsSection deals={deals} isLoading={dealsLoading} />

      {/* Happening Now - Real-time Activity */}
      <HappeningNow />

      {/* Nonprofits Section */}
      <NonprofitsSection />

      {/* Neighborhood Highlight */}
      <NeighborhoodHighlight />

      {/* New Listings */}
      <FeaturedSection
        title="New & Notable"
        subtitle="Recently added to Toledo Hub"
        viewAllLink="/explore?sort=newest"
        businesses={newBusinesses}
        isLoading={newLoading}
        showLabel={true}
        labelText="Just Added"
      />

      {/* CTA Section */}
      <section className="px-4 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-toledo-teal to-accent p-6 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h3 className="text-xl font-bold mb-2">Own a business in Toledo?</h3>
            <p className="text-white/80 text-sm mb-4">
              Get discovered by thousands of locals. List your business for free.
            </p>
            <button 
              onClick={() => navigate('/create-business')}
              className="px-5 py-2.5 bg-white text-toledo-teal rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              Add Your Business →
            </button>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
