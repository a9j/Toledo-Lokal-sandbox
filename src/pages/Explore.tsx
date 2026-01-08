import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SearchBar } from '@/components/home/SearchBar';
import { BusinessCard } from '@/components/cards/BusinessCard';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useCategories } from '@/hooks/useCategories';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import * as LucideIcons from 'lucide-react';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  
  const { data: businesses, isLoading } = useBusinesses({ 
    categoryId: selectedCategory || undefined,
    neighborhoodId: selectedNeighborhood || undefined 
  });
  const { data: categories } = useCategories();
  const { data: neighborhoods } = useNeighborhoods();

  const filteredBusinesses = businesses?.filter(biz => {
    if (!searchQuery) return true;
    return biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           biz.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getIcon = (iconName: string) => {
    const name = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
    return (LucideIcons as Record<string, any>)[name] || LucideIcons.Building2;
  };

  return (
    <>
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
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Categories</h2>
            <div className="grid grid-cols-4 gap-2">
              {categories?.map(category => {
                const Icon = getIcon(category.icon || 'building2');
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
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

        {/* Active filters */}
        {(selectedCategory || selectedNeighborhood) && (
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-1"
                onClick={() => setSelectedCategory(null)}
              >
                {categories?.find(c => c.id === selectedCategory)?.name}
                <LucideIcons.X className="h-3 w-3" />
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
                <LucideIcons.X className="h-3 w-3" />
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
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
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
