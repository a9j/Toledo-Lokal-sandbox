import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SearchBar } from '@/components/home/SearchBar';
import { BusinessCard } from '@/components/cards/BusinessCard';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useCategories } from '@/hooks/useCategories';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useBusinessesSavedCounts } from '@/hooks/useDiscoverySignals';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, X, Briefcase, ChevronRight, Search, Truck, Newspaper, Sparkles } from 'lucide-react';
import { resolveIcon } from '@/lib/icon-resolver';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/seo/SEOHead';
import { cn } from '@/lib/utils';
import { TODAY_TAB_ENABLED } from '@/lib/flags';

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  
  const { data: businesses, isLoading } = useBusinesses({ 
    categoryId: selectedCategory || undefined,
    neighborhoodId: selectedNeighborhood || undefined 
  });
  const { data: categories } = useCategories();
  const { data: neighborhoods } = useNeighborhoods();

  // Get saved counts for businesses
  const businessIds = useMemo(() => businesses?.map(b => b.id) || [], [businesses]);
  const { data: savedCounts = {} } = useBusinessesSavedCounts(businessIds);

  const filteredBusinesses = businesses?.filter(biz => {
    if (!searchQuery) return true;
    return biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           biz.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getIcon = (iconName: string) => resolveIcon(iconName, Building2);

  return (
    <>
      <SEOHead 
        title="Discover | ToledoLokal"
        description="Discover the best local businesses in Toledo, Ohio. Browse restaurants, shops, services, and more."
        url="/discover"
        keywords={['Toledo businesses', 'local businesses Toledo', 'Toledo restaurants', 'Glass City directory']}
      />
      <Header title="Discover" showSearch />
      
      <PageContainer className="space-y-6">
        {/* Search */}
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Search businesses..."
        />

        {/* Category Selection */}
        {!selectedCategory && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Browse Categories
              </h2>
              <span className="text-xs text-muted-foreground">
                {categories?.length || 0} categories
              </span>
            </div>
            <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {categories?.map((category, index) => {
                const Icon = getIcon(category.icon || 'building2');
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 p-4 rounded-2xl",
                      "bg-card border border-border/40",
                      "hover:border-primary/30 hover:bg-primary/5",
                      "transition-all duration-200 group",
                      "animate-fade-in-up"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-200">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs text-center font-medium text-foreground line-clamp-1">
                      {category.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Active Filters */}
        {(selectedCategory || selectedNeighborhood) && (
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-0 h-9 px-4"
                onClick={() => setSelectedCategory(null)}
              >
                {categories?.find(c => c.id === selectedCategory)?.name}
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
            {selectedNeighborhood && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-1.5 h-9 px-4"
                onClick={() => setSelectedNeighborhood(null)}
              >
                {neighborhoods?.find(n => n.id === selectedNeighborhood)?.name}
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* Neighborhood Filter */}
        {selectedCategory && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Button
              variant={selectedNeighborhood === null ? "default" : "outline"}
              size="sm"
              className="rounded-full flex-shrink-0 h-9"
              onClick={() => setSelectedNeighborhood(null)}
            >
              All Areas
            </Button>
            {neighborhoods?.map(n => (
              <Button
                key={n.id}
                variant={selectedNeighborhood === n.id ? "default" : "outline"}
                size="sm"
                className="rounded-full flex-shrink-0 h-9"
                onClick={() => setSelectedNeighborhood(n.id)}
              >
                {n.name}
              </Button>
            ))}
          </div>
        )}

        {/* Quick-access: Today + Featured */}
        {!selectedCategory && (
          <div className="grid grid-cols-2 gap-3">
            {TODAY_TAB_ENABLED && (
              <Link
                to="/"
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Newspaper className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Today</p>
                  <p className="text-xs text-muted-foreground">Daily picks</p>
                </div>
              </Link>
            )}
            <Link
              to="/founding-5"
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Featured</p>
                <p className="text-xs text-muted-foreground">Founding partners</p>
              </div>
            </Link>
          </div>
        )}

        {/* Jobs Banner */}
        <Link
          to="/jobs"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Local Jobs</p>
            <p className="text-xs text-muted-foreground">Browse open positions at Toledo businesses</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Link>

        {/* Food Trucks Banner — entry point into the existing trucks screen */}
        <Link
          to="/food-today"
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-secondary/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Food Trucks</p>
            <p className="text-xs text-muted-foreground">Find where Toledo's trucks are serving today</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Link>

        {/* Business List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : filteredBusinesses?.length ? (
          <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
            {filteredBusinesses.map((business, index) => (
              <div
                key={business.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <BusinessCard
                  business={business}
                  savedCount={savedCounts[business.id] || 0}
                />
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
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
                className="rounded-full"
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}