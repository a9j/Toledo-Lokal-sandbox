import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SearchBar } from '@/components/home/SearchBar';
import { BusinessCard } from '@/components/cards/BusinessCard';
import { CategoryCard } from '@/components/home/CategoryCard';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryCounts } from '@/hooks/useCategoryCounts';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { LogoLoader } from '@/components/ui/logo-loader';
import { Button } from '@/components/ui/button';
import {
  Utensils,
  ShoppingBag,
  Building2,
  Car,
  Calendar,
  Home,
  HeartHandshake,
  HeartPulse,
  Palette,
  GraduationCap,
  Sparkles,
  Briefcase,
  Baby,
  Mountain,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const iconMap: Record<string, LucideIcon> = {
  'utensils': Utensils,
  'shopping-bag': ShoppingBag,
  'building-2': Building2,
  'sparkles': Sparkles,
  'car': Car,
  'calendar': Calendar,
  'home': Home,
  'heart-handshake': HeartHandshake,
  'heart-pulse': HeartPulse,
  'palette': Palette,
  'graduation-cap': GraduationCap,
  'briefcase': Briefcase,
  'baby': Baby,
  'mountain': Mountain,
  'wrench': Wrench,
};

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);

  // Keep state in sync when the URL ?category= changes (e.g. deep links from the
  // home Browse Categories grid).
  useEffect(() => {
    setSelectedCategory(searchParams.get('category'));
  }, [searchParams]);

  // Reflect the active category back into the URL so it's shareable/back-able.
  const selectCategory = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (categoryId) next.set('category', categoryId);
        else next.delete('category');
        return next;
      },
      { replace: true }
    );
  };

  const { data: businesses, isLoading } = useBusinesses({ 
    categoryId: selectedCategory || undefined,
    neighborhoodId: selectedNeighborhood || undefined 
  });
  const { data: categories } = useCategories();
  const { data: counts } = useCategoryCounts();
  const { data: neighborhoods } = useNeighborhoods();

  const filteredBusinesses = businesses?.filter(biz => {
    if (!searchQuery) return true;
    return biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           biz.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <SEOHead 
        title="Explore Local Businesses"
        description="Discover the best local businesses in Toledo, Ohio. Browse restaurants, shops, services, and more in the Glass City."
        url="/explore"
        keywords={['Toledo businesses', 'local businesses Toledo', 'Toledo restaurants', 'Toledo shops', 'Glass City directory']}
      />
      <Header title="Explore" showSearch />
      
      <PageContainer className="space-y-5">
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Search businesses..."
        />

        {/* Categories Grid */}
        {!selectedCategory && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Categories{categories?.length ? ` · ${categories.length}` : ''}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {categories?.map(category => {
                const Icon = iconMap[category.icon || ''] || Building2;
                return (
                  <CategoryCard
                    key={category.id}
                    id={category.id}
                    name={category.name}
                    icon={Icon}
                    count={counts?.[category.id]}
                    onClick={() => selectCategory(category.id)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Active filters */}
        {(selectedCategory || selectedNeighborhood) && (
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-1"
                onClick={() => selectCategory(null)}
              >
                {categories?.find(c => c.id === selectedCategory)?.name}
                <X className="h-3 w-3" />
              </Button>
            )}
            {selectedNeighborhood && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-1"
                onClick={() => setSelectedNeighborhood(null)}
              >
                {neighborhoods?.find(n => n.id === selectedNeighborhood)?.name}
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Neighborhood filter */}
        {selectedCategory && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Button
              variant={selectedNeighborhood === null ? "default" : "outline"}
              size="sm"
              className="rounded-full flex-shrink-0"
              onClick={() => setSelectedNeighborhood(null)}
            >
              All Areas
            </Button>
            {neighborhoods?.map(n => (
              <Button
                key={n.id}
                variant={selectedNeighborhood === n.id ? "default" : "outline"}
                size="sm"
                className="rounded-full flex-shrink-0"
                onClick={() => setSelectedNeighborhood(n.id)}
              >
                {n.name}
              </Button>
            ))}
          </div>
        )}

        {/* Businesses list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LogoLoader size="lg" text="Finding local businesses..." />
          </div>
        ) : filteredBusinesses?.length ? (
          <div className="space-y-3">
            {filteredBusinesses.map(business => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No businesses found</p>
          </div>
        )}
      </PageContainer>
    </>
  );
}
