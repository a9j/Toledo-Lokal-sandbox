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

      {/* Local Spotlight */}
      <FeaturedSection
        title="Local Spotlight"
        subtitle="Hand-picked Toledo favorites"
        viewAllLink="/explore"
        businesses={featuredBusinesses}
        isLoading={featuredLoading}
        labelText="Editor's Choice"
      />

      {/* Explore by Map */}
      <section className="px-4 py-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/90 mb-3">
          Explore Toledo
        </h2>
        <button
          onClick={() => navigate('/near-me')}
          className="group relative w-full overflow-hidden rounded-3xl border border-border/60 bg-card text-left p-5 h-[180px] flex flex-col justify-between hover:border-primary/40 transition-all"
        >
          {/* Map dotted backdrop */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: `
                radial-gradient(circle at 65% 40%, hsl(var(--primary) / 0.18) 0%, transparent 45%),
                radial-gradient(circle at 30% 70%, hsl(var(--primary) / 0.10) 0%, transparent 40%)
              `,
            }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" fill="hsl(var(--muted-foreground))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          {/* Pins */}
          <div className="absolute top-6 right-10 w-3 h-4 rounded-full bg-primary shadow-glow-blue" />
          <div className="absolute top-14 right-24 w-2.5 h-3.5 rounded-full bg-primary/80" />
          <div className="absolute bottom-10 right-8 w-3 h-4 rounded-full bg-primary shadow-glow-blue" />
          <div className="absolute bottom-16 right-32 w-2 h-3 rounded-full bg-primary/70" />

          <div className="relative">
            <h3 className="text-lg font-bold text-foreground leading-tight">
              Explore local favorites
              <br />near you.
            </h3>
          </div>
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 shadow-glow-blue group-hover:brightness-110 transition">
              Open Map →
            </span>
          </div>
        </button>
      </section>

      {/* Categories (Trending Now style) */}
      <CategoryGrid />

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
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 mb-4">
              <span className="text-primary text-[11px] font-bold uppercase tracking-wider">Free Listing</span>
            </div>
            <h3 className="font-display text-xl font-bold mb-2 text-foreground">Own a business in Toledo?</h3>
            <p className="text-muted-foreground text-sm mb-5">
              Get discovered by thousands of locals. Join the ToledoLokal community.
            </p>
            <button
              onClick={() => navigate('/create-business')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:brightness-110 transition-all shadow-glow-blue"
            >
              Add Your Business →
            </button>
          </div>
        </div>
       </section>
    </div>
  );
}
