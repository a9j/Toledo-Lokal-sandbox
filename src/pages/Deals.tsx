import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SearchBar } from '@/components/home/SearchBar';
import { DealCard } from '@/components/cards/DealCard';
import { useDeals } from '@/hooks/useDeals';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Deals() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: deals, isLoading } = useDeals();
  const { data: categories } = useCategories();

  const filteredDeals = deals?.filter(deal => {
    const matchesSearch = !searchQuery || 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.business?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      deal.business?.category?.name === categories?.find(c => c.id === selectedCategory)?.name;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Header title="Deals" />
      
      <PageContainer className="space-y-4">
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Search deals..."
        />

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            className="rounded-full flex-shrink-0"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories?.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              className="rounded-full flex-shrink-0"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Deals list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filteredDeals?.length ? (
          <div className="space-y-3">
            {filteredDeals.map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No deals found</p>
          </div>
        )}
      </PageContainer>
    </>
  );
}
