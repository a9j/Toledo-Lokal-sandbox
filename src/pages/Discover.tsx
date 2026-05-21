import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '@/components/home/SearchBar';
import { BusinessCard } from '@/components/cards/BusinessCard';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useCategories } from '@/hooks/useCategories';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useBusinessesSavedCounts } from '@/hooks/useDiscoverySignals';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  Heart,
  Users,
  MapPin,
  Flame,
  HeartHandshake,
  Calendar,
  Tag,
  UserCircle,
  LogIn,
  Shield,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/tl-logo.png';
import heroSkyline from '@/assets/hero-toledo-skyline.jpg';

const TRENDING_PILLS = [
  { id: 'popular', label: 'Popular Businesses', Icon: Flame },
  { id: 'nonprofits', label: 'Top Nonprofits', Icon: HeartHandshake },
  { id: 'weekend', label: 'This Weekend', Icon: Calendar },
  { id: 'deals', label: 'Best Deals', Icon: Tag },
];

export default function Discover() {
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeTrending, setActiveTrending] = useState<string>('popular');

  const { data: businesses, isLoading } = useBusinesses({
    categoryId: selectedCategory || undefined,
    neighborhoodId: selectedNeighborhood || undefined,
  });
  const { data: categories } = useCategories();
  const { data: neighborhoods } = useNeighborhoods();

  const businessIds = useMemo(() => businesses?.map((b) => b.id) || [], [businesses]);
  const { data: savedCounts = {} } = useBusinessesSavedCounts(businessIds);

  const filteredBusinesses = businesses?.filter((biz) => {
    if (!searchQuery) return true;
    return (
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const featuredBusinesses = useMemo(
    () => (businesses || []).filter((b) => b.featured).slice(0, 6),
    [businesses]
  );

  const getIcon = (iconName: string) => {
    const name =
      iconName.charAt(0).toUpperCase() +
      iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    return (LucideIcons as Record<string, any>)[name] || LucideIcons.Building2;
  };

  const visibleCategories = showAllCategories ? categories : categories?.slice(0, 12);

  return (
    <div className="min-h-screen bg-background pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <SEOHead
        title="Discover | ToledoLokal"
        description="Discover the best local businesses in Toledo, Ohio. Browse restaurants, shops, services, and more."
        url="/discover"
        keywords={['Toledo businesses', 'local businesses Toledo', 'Toledo restaurants', 'Glass City directory']}
      />

      <div className="px-4 pt-safe-top">
        {/* Brand header */}
        <header className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-0">
            <img src={logoImage} alt="ToledoLokal" className="w-[60px] h-[60px] rounded-2xl object-contain" />
            <div className="-ml-1.5">
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-none">
                Toledo<span className="text-primary">Lokal</span>
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium mt-1">The Glass City</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              aria-label="Search"
              className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground/70 hover:border-primary/40 hover:text-primary transition-all"
            >
              <Search className="h-4 w-4" />
            </button>
            {isAdmin && (
              <Link
                to="/admin"
                className="h-10 px-4 rounded-full bg-card border border-border flex items-center gap-1.5 text-xs font-semibold text-foreground/80 hover:border-primary/40 hover:text-primary transition-all"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
            {user ? (
              <Link
                to="/profile"
                aria-label="Profile"
                className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-foreground/70 hover:border-primary/40 hover:text-primary transition-all"
              >
                <UserCircle className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="text-xs rounded-full h-10 px-4 gap-1.5">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Cinematic hero */}
        <section className="pb-5">
          <div className="relative w-full overflow-hidden rounded-3xl border border-border shadow-soft-xl h-[320px]">
            <img
              src={heroSkyline}
              alt="Downtown Toledo"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, hsl(220 40% 6% / 0.35) 0%, hsl(220 40% 6% / 0.55) 55%, hsl(220 40% 6% / 0.92) 100%)`,
              }}
            />

            <div className="relative h-full flex flex-col justify-end p-4">
              <p className="text-[10px] font-bold tracking-[0.22em] text-primary/95 uppercase mb-1.5">
                Toledo is
              </p>
              <h2
                className="font-black uppercase text-white"
                style={{
                  fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif",
                  fontSize: 'clamp(2.25rem, 11vw, 3.5rem)',
                  lineHeight: 0.88,
                  letterSpacing: '-0.01em',
                }}
              >
                <span className="block">Built</span>
                <span className="relative inline-block text-primary">
                  Together.
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 8 Q 50 2, 100 6 T 198 4"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h2>
              <p className="mt-3 text-white/90 text-[12.5px] leading-relaxed max-w-[62%]">
                Discover local businesses, nonprofits, events and people making{' '}
                <span className="text-primary font-semibold">Toledo</span> better.
              </p>
              <Link
                to="/discover"
                className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-[13px] pl-4 pr-3 py-2.5 shadow-glow-blue hover:brightness-110 transition-all"
              >
                Explore Toledo
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Floating glass cards */}
            <div className="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col gap-2 w-[42%] max-w-[170px]">
              <div className="rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl px-3 py-2.5 shadow-lg">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                    <Heart className="h-3.5 w-3.5 text-primary fill-primary/40" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight">Love Local</p>
                    <p className="text-[9.5px] text-white/70 leading-snug mt-0.5">Support people who support Toledo.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl px-3 py-2.5 shadow-lg">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight">Stronger Together</p>
                    <p className="text-[9.5px] text-white/70 leading-snug mt-0.5">Every connection makes an impact.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Carousel dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </section>

        {/* Search with filter */}
        <section className="pb-6">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search businesses, nonprofits, events..."
                className="w-full h-12 pl-11 pr-4 rounded-full bg-card border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <button
              aria-label="Filters"
              className="w-12 h-12 shrink-0 rounded-full bg-card border border-border flex items-center justify-center text-foreground/70 hover:border-primary/40 hover:text-primary transition-all"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Browse Categories */}
        <section className="pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Browse Categories</h2>
            <button
              onClick={() => setShowAllCategories((v) => !v)}
              className="flex items-center gap-0.5 text-[13px] font-semibold text-primary hover:underline"
            >
              {showAllCategories ? 'Show less' : `View all ${categories?.length || 0}`}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {visibleCategories?.map((category, index) => {
              const Icon = getIcon(category.icon || 'building2');
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(isActive ? null : category.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-2xl border transition-all duration-200 animate-fade-in-up',
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'bg-card border-border hover:border-primary/40 hover:bg-primary/5'
                  )}
                  style={{ animationDelay: `${index * 20}ms` }}
                >
                  <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={1.8} />
                  <span className="text-[10px] font-semibold text-foreground/85 line-clamp-1">
                    {category.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

        </section>

        {/* Featured in Toledo */}
        {featuredBusinesses.length > 0 && (
          <section className="pb-6">
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Featured in Toledo</h2>
              <Link to="/explore" className="flex items-center gap-0.5 text-[13px] font-semibold text-primary hover:underline">
                Handpicked favorites
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide snap-x snap-mandatory">
              {featuredBusinesses.map((biz) => {
                const cover =
                  biz.cover_image_url ||
                  (Array.isArray(biz.photos) && biz.photos[0]) ||
                  biz.editor_pick_image ||
                  heroSkyline;
                const categoryLabel =
                  (biz.category as any)?.name?.toUpperCase() || 'BUSINESS';
                return (
                  <Link
                    key={biz.id}
                    to={`/business/${biz.id}`}
                    className="snap-start shrink-0 w-[68%] rounded-3xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all group"
                  >
                    <div className="relative h-44 bg-muted overflow-hidden">
                      <img
                        src={cover as string}
                        alt={biz.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-wide uppercase">
                        {categoryLabel}
                      </span>
                      <button
                        aria-label="Save"
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/85 backdrop-blur flex items-center justify-center text-foreground/70 hover:text-primary"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[15px] text-foreground leading-tight line-clamp-2">
                        {biz.name}
                      </h3>
                      {biz.description && (
                        <p className="mt-1 text-[12px] text-muted-foreground leading-snug line-clamp-2">
                          {biz.description}
                        </p>
                      )}
                      {(biz.neighborhood as any)?.name && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {(biz.neighborhood as any).name}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Explore by Map */}
        <section className="pb-6">
          <Link
            to="/near-me"
            className="block relative overflow-hidden rounded-3xl border border-border bg-card hover:border-primary/40 transition-all group"
          >
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background: `
                  radial-gradient(circle at 70% 50%, hsl(var(--primary) / 0.18), transparent 55%),
                  radial-gradient(circle at 30% 80%, hsl(var(--primary) / 0.10), transparent 50%),
                  linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)
                `,
              }}
            />
            <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 200" fill="none" aria-hidden>
              <path d="M50 100 Q150 60 200 100 T350 100" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" />
              <path d="M80 140 Q180 100 250 140 T380 140" stroke="hsl(var(--primary))" strokeWidth="0.5" opacity="0.3" />
            </svg>
            <div className="relative p-5 flex items-center gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground tracking-tight">Explore by Map</h3>
                <p className="mt-1 text-[13px] text-muted-foreground leading-snug max-w-[200px]">
                  Find local favorites near you.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-[13px] pl-4 pr-3 py-2 shadow-glow-blue">
                  Open Map
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="relative w-[42%] h-[120px] shrink-0">
                <MapPin className="absolute top-2 left-6 h-4 w-4 text-primary/60 fill-primary/30" />
                <MapPin className="absolute top-5 right-2 h-4 w-4 text-primary/60 fill-primary/30" />
                <MapPin className="absolute bottom-4 left-2 h-4 w-4 text-primary/60 fill-primary/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                    <div className="relative w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-glow-blue">
                      <Heart className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>

        {/* Trending Now */}
        <section className="pb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Trending Now</h2>
            <Link to="/explore" className="flex items-center gap-0.5 text-[13px] font-semibold text-primary hover:underline">
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 scrollbar-hide">
            {TRENDING_PILLS.map(({ id, label, Icon }) => {
              const isActive = activeTrending === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTrending(id)}
                  className={cn(
                    'flex items-center gap-1.5 h-9 px-4 rounded-full text-[12.5px] font-semibold whitespace-nowrap border transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-glow-blue'
                      : 'bg-card text-foreground/80 border-border hover:border-primary/40'
                  )}
                >
                  <Icon className={cn('h-3.5 w-3.5', isActive ? '' : 'text-primary')} />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Filters */}
        {(selectedCategory || selectedNeighborhood) && (
          <div className="flex flex-wrap gap-2 pb-4">
            {selectedCategory && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-0 h-9 px-4"
                onClick={() => setSelectedCategory(null)}
              >
                {categories?.find((c) => c.id === selectedCategory)?.name}
                <LucideIcons.X className="h-3.5 w-3.5" />
              </Button>
            )}
            {selectedNeighborhood && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-1.5 h-9 px-4"
                onClick={() => setSelectedNeighborhood(null)}
              >
                {neighborhoods?.find((n) => n.id === selectedNeighborhood)?.name}
                <LucideIcons.X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* Business List */}
        <section>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : filteredBusinesses?.length ? (
            <div className="space-y-3">
              {filteredBusinesses.map((business, index) => (
                <div
                  key={business.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <BusinessCard business={business} savedCount={savedCounts[business.id] || 0} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">No businesses found</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Try adjusting your filters</p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-full">
                  Clear search
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
