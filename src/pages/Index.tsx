import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { QuickLinksBar } from '@/components/home/QuickLinksBar';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { EventsCarousel } from '@/components/home/EventsCarousel';
import { DealsSection } from '@/components/home/DealsSection';
import { NeighborhoodHighlight } from '@/components/home/NeighborhoodHighlight';
import { NonprofitsSection } from '@/components/home/NonprofitsSection';
import { HappeningNow } from '@/components/home/HappeningNow';
import { FirstVisitOnboarding } from '@/components/onboarding/FirstVisitOnboarding';
import { useEvents } from '@/hooks/useEvents';
import { useDeals } from '@/hooks/useDeals';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead, createWebsiteJsonLd, createOrganizationJsonLd } from '@/components/seo/SEOHead';

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding-completed');
  });
  const { data: upcomingEvents, isLoading: eventsLoading } = useEvents({ limit: 6 });
  const { data: deals, isLoading: dealsLoading } = useDeals({ limit: 4 });
  const { data: featuredBusinesses, isLoading: featuredLoading } = useBusinesses({ featured: true, limit: 4 });
  const { data: newBusinesses, isLoading: newLoading } = useBusinesses({ limit: 6 });

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      localStorage.setItem('onboarding-completed', 'true');
      setShowOnboarding(false);
    }
  }, [user, authLoading]);

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
    <div className="min-h-screen bg-background pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <SEOHead 
        url="/"
        keywords={['Toledo local businesses', 'Toledo events calendar', 'Glass City guide', 'Toledo restaurants', 'Toledo shopping']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [createWebsiteJsonLd(), createOrganizationJsonLd()]
        }}
      />
      {/* Hero Section with Search */}
      <HeroSection onSearch={handleSearch} />

      {/* Quick Links Bar */}
      <QuickLinksBar />

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
        subtitle="Recently added to ToledoLokal"
        viewAllLink="/explore?sort=newest"
        businesses={newBusinesses}
        isLoading={newLoading}
        showLabel={true}
        labelText="Just Added"
      />

      {/* CTA Section */}
      <section className="px-4 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-lokal-midnight to-primary p-6 text-white">
          {/* Amber accent glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-lokal-amber/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-lokal-forest/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lokal-amber/20 border border-lokal-amber/30 mb-4">
              <span className="text-lokal-amber text-xs font-semibold">FREE LISTING</span>
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Own a business in Toledo?</h3>
            <p className="text-white/70 text-sm mb-5">
              Get discovered by thousands of locals. Join the ToledoLokal community.
            </p>
            <button 
              onClick={() => navigate('/create-business')}
              className="px-6 py-3 bg-lokal-amber text-lokal-midnight rounded-xl font-semibold text-sm hover:bg-lokal-amber/90 transition-all hover:shadow-glow-amber"
            >
              Add Your Business →
            </button>
          </div>
        </div>
       </section>
    </div>
  );
}
