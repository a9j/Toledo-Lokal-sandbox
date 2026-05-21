import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedCarousel } from '@/components/home/FeaturedCarousel';
import { TrendingPills } from '@/components/home/TrendingPills';
import { EventsCarousel } from '@/components/home/EventsCarousel';
import { DealsSection } from '@/components/home/DealsSection';
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
  const [searchQuery, setSearchQuery] = useState('');
  const { data: upcomingEvents, isLoading: eventsLoading } = useEvents({ limit: 6 });
  const { data: deals, isLoading: dealsLoading } = useDeals({ limit: 4 });
  const { data: featuredBusinesses, isLoading: featuredLoading } = useBusinesses({ featured: true, limit: 6 });

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

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
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

      {/* Hero */}
      <HeroSection onSearch={handleSearch} />

      {/* Search row */}
      <form onSubmit={submitSearch} className="px-4 pt-5 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search businesses, nonprofits, events..."
            className="w-full h-12 pl-11 pr-4 rounded-full bg-card border border-border/60 text-sm placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none transition-all"
          />
        </div>
        <button
          type="button"
          onClick={() => navigate('/explore')}
          aria-label="Filters"
          className="h-12 w-12 shrink-0 rounded-full bg-card border border-border/60 flex items-center justify-center text-foreground/80 hover:border-primary/40 hover:text-primary transition-all"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </form>

      {/* Browse Categories */}
      <CategoryGrid />

      {/* Featured in Toledo — horizontal carousel */}
      <FeaturedCarousel
        businesses={featuredBusinesses}
        isLoading={featuredLoading}
        viewAllLink="/explore"
      />

      {/* Explore by Map */}
      <section className="px-4 py-2">
        <button
          onClick={() => navigate('/near-me')}
          className="group relative w-full overflow-hidden rounded-3xl border border-border/60 bg-card text-left p-5 h-[170px] flex flex-col justify-between hover:border-primary/40 transition-all"
        >
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: `
                radial-gradient(circle at 60% 50%, hsl(var(--primary) / 0.20) 0%, transparent 50%),
                radial-gradient(circle at 25% 75%, hsl(var(--primary) / 0.10) 0%, transparent 45%)
              `,
            }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" fill="hsl(var(--muted-foreground))" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          {/* Pins clustered right */}
          <div className="absolute top-8 right-12 w-3 h-4 rounded-full bg-primary shadow-glow-blue" />
          <div className="absolute top-16 right-28 w-2.5 h-3.5 rounded-full bg-primary/80" />
          <div className="absolute bottom-10 right-10 w-3 h-4 rounded-full bg-primary shadow-glow-blue" />
          <div className="absolute bottom-20 right-32 w-2 h-3 rounded-full bg-primary/70" />
          {/* Center "heart" pin */}
          <div className="absolute top-1/2 right-20 -translate-y-1/2 h-9 w-9 rounded-full bg-primary flex items-center justify-center shadow-glow-blue">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>

          <div className="relative max-w-[55%]">
            <h3 className="text-lg font-bold text-foreground leading-tight">Explore by Map</h3>
            <p className="text-xs text-muted-foreground mt-1">Find local favorites near you.</p>
          </div>
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 shadow-glow-blue group-hover:brightness-110 transition">
              Open Map →
            </span>
          </div>
        </button>
      </section>

      {/* Trending pills */}
      <TrendingPills />

      {/* Below-the-fold content (kept) */}
      <EventsCarousel
        title="This Week in Toledo"
        subtitle="Concerts, shows, markets & more"
        events={upcomingEvents}
        isLoading={eventsLoading}
        viewAllLink="/events"
      />
      <DealsSection deals={deals} isLoading={dealsLoading} />
      <HappeningNow />
      <NonprofitsSection />

      {/* CTA */}
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
