import { useState, useEffect } from 'react';
import { useCity } from '@/contexts/CityContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Radio, 
  Compass, 
  ChevronRight, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Flame, 
  TrendingUp,
  Star,
  Clock,
  ArrowRight,
  Zap,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PulseFeed } from '@/components/pulse/PulseFeed';
import { PulseCreateForm } from '@/components/pulse/PulseCreateForm';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { EventsCarousel } from '@/components/home/EventsCarousel';
import { DealsSection } from '@/components/home/DealsSection';
import { FeaturedListingCard } from '@/components/cards/FeaturedListingCard';
import { FirstVisitOnboarding } from '@/components/onboarding/FirstVisitOnboarding';
import { SEOHead, createWebsiteJsonLd, createOrganizationJsonLd } from '@/components/seo/SEOHead';
import { useEvents } from '@/hooks/useEvents';
import { useDeals } from '@/hooks/useDeals';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type ViewMode = 'pulse' | 'discover';

export default function Home() {
  const { city } = useCity();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('pulse');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: upcomingEvents, isLoading: eventsLoading } = useEvents({ limit: 6 });
  const { data: deals, isLoading: dealsLoading } = useDeals({ limit: 4 });
  const { data: featuredBusinesses, isLoading: featuredLoading } = useBusinesses({ featured: true, limit: 4 });

  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      localStorage.setItem('onboarding-completed', 'true');
      setShowOnboarding(false);
    } else {
      const hasSeenOnboarding = localStorage.getItem('onboarding-completed');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user, authLoading]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (showOnboarding) {
    return <FirstVisitOnboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <SEOHead 
        url="/"
        keywords={[`${city.name} local businesses`, `${city.name} events`, `${city.name} restaurants`]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@graph': [createWebsiteJsonLd(), createOrganizationJsonLd()]
        }}
      />

      {/* Hero Section - Sleek Modern Design */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        {/* Subtle animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative px-4 pt-12 pb-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-toledo-rose animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Toledo<span className="text-primary">Lokal</span>
                </h1>
                <p className="text-xs text-muted-foreground">The Glass City</p>
              </div>
            </div>
            
            {/* Quick Search */}
            <Button 
              variant="outline" 
              size="icon"
              className="rounded-full h-10 w-10 border-border/50 bg-background/80 backdrop-blur-sm"
              onClick={() => navigate('/explore')}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted/50 rounded-2xl mb-6 backdrop-blur-sm">
            <button
              onClick={() => setViewMode('pulse')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                viewMode === 'pulse'
                  ? "bg-background text-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Radio className={cn("h-4 w-4", viewMode === 'pulse' && "text-primary")} />
              The Pulse
              {viewMode === 'pulse' && (
                <span className="w-1.5 h-1.5 rounded-full bg-toledo-rose animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setViewMode('discover')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
                viewMode === 'discover'
                  ? "bg-background text-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Compass className={cn("h-4 w-4", viewMode === 'discover' && "text-primary")} />
              Discover
            </button>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            <Link 
              to="/events" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-sm font-medium whitespace-nowrap hover:bg-primary/15 transition-colors"
            >
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-foreground">{upcomingEvents?.length || 0} Events</span>
            </Link>
            <Link 
              to="/deals" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-toledo-rose/10 border border-toledo-rose/20 text-sm font-medium whitespace-nowrap hover:bg-toledo-rose/15 transition-colors"
            >
              <Flame className="h-4 w-4 text-toledo-rose" />
              <span className="text-foreground">{deals?.length || 0} Deals</span>
            </Link>
            <Link 
              to="/explore" 
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-sm font-medium whitespace-nowrap hover:bg-accent/15 transition-colors"
            >
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-foreground">Explore</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content Based on View Mode */}
      {viewMode === 'pulse' ? (
        <PulseView />
      ) : (
        <DiscoverView 
          featuredBusinesses={featuredBusinesses}
          featuredLoading={featuredLoading}
          upcomingEvents={upcomingEvents}
          eventsLoading={eventsLoading}
          deals={deals}
          dealsLoading={dealsLoading}
        />
      )}
    </div>
  );
}

function PulseView() {
  return (
    <div className="px-4 space-y-6">
      {/* What's Happening Header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-toledo-rose/10 border border-toledo-rose/20">
          <span className="w-2 h-2 rounded-full bg-toledo-rose animate-pulse" />
          <span className="text-xs font-semibold text-toledo-rose uppercase tracking-wider">Live</span>
        </div>
        <span className="text-sm text-muted-foreground">What's happening in {city.name} right now</span>
      </div>

      {/* Create Pulse */}
      <PulseCreateForm />

      {/* Pulse Feed */}
      <PulseFeed limit={10} showFilters={true} />

      {/* View More */}
      <Link 
        to="/pulse" 
        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        View full Pulse feed
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

interface DiscoverViewProps {
  featuredBusinesses: ReturnType<typeof useBusinesses>['data'];
  featuredLoading: boolean;
  upcomingEvents: ReturnType<typeof useEvents>['data'];
  eventsLoading: boolean;
  deals: ReturnType<typeof useDeals>['data'];
  dealsLoading: boolean;
}

function DiscoverView({ 
  featuredBusinesses, 
  featuredLoading, 
  upcomingEvents, 
  eventsLoading,
  deals,
  dealsLoading 
}: DiscoverViewProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      {/* Categories */}
      <CategoryGrid />

      {/* Featured Places */}
      <section className="py-6">
        <div className="flex items-center justify-between mb-4 px-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="h-4 w-4 text-primary" />
              <span className="section-label">Editor's Choice</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">Featured Places</h2>
          </div>
          <Link 
            to="/explore" 
            className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {featuredLoading ? (
          <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="w-72 h-64 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        ) : featuredBusinesses?.length ? (
          <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2">
            {featuredBusinesses.map((business) => (
              <FeaturedListingCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="px-4">
            <div className="card-elevated p-8 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Featured businesses coming soon</p>
            </div>
          </div>
        )}
      </section>

      {/* Events Carousel */}
      <EventsCarousel
        title={`This Week in ${city.name}`}
        subtitle="Concerts, shows, markets & more"
        events={upcomingEvents}
        isLoading={eventsLoading}
        viewAllLink="/events"
      />

      {/* Deals Section */}
      <DealsSection deals={deals} isLoading={dealsLoading} />

      {/* CTA Section */}
      <section className="px-4 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-primary-foreground">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 mb-4">
              <Zap className="h-3 w-3" />
              <span className="text-xs font-semibold">FREE LISTING</span>
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Own a business in {city.name}?</h3>
            <p className="text-primary-foreground/70 text-sm mb-5">
              Get discovered by thousands of locals. Join the ToledoLokal community.
            </p>
            <Button 
              onClick={() => navigate('/create-business')}
              variant="secondary"
              className="font-semibold"
            >
              Add Your Business
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
