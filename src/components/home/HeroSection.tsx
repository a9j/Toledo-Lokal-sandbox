import { useState } from 'react';
import { Search, MapPin, Calendar, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useCategories } from '@/hooks/useCategories';

interface HeroSectionProps {
  onSearch: (query: string, filters: { neighborhood?: string; category?: string }) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [query, setQuery] = useState('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const { data: neighborhoods } = useNeighborhoods();
  const { data: categories } = useCategories();

  const handleSearch = () => {
    onSearch(query, { neighborhood, category });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-toledo-coral via-primary to-toledo-gold opacity-95" />
      
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Content */}
      <div className="relative px-4 pt-12 pb-8">
        {/* Header text */}
        <div className="text-center mb-8">
          <p className="text-white/80 text-sm font-medium mb-2 tracking-wide uppercase">
            Discover Toledo, Ohio
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            Find Your Next<br />
            <span className="text-white/90">Favorite Spot</span>
          </h1>
          <p className="text-white/70 text-sm max-w-xs mx-auto">
            Explore local businesses, events, and hidden gems in the Glass City
          </p>
        </div>

        {/* Search box */}
        <div className="bg-white rounded-2xl shadow-soft-xl p-4 space-y-3 max-w-md mx-auto">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search places, events, deals..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 pl-10 pr-4 rounded-xl bg-secondary border-0 text-base"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Filters row */}
          <div className="flex gap-2">
            <Select value={neighborhood} onValueChange={setNeighborhood}>
              <SelectTrigger className="flex-1 h-11 rounded-xl border-0 bg-secondary">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <SelectValue placeholder="Neighborhood" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Neighborhoods</SelectItem>
                {neighborhoods?.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="flex-1 h-11 rounded-xl border-0 bg-secondary">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search button */}
          <Button 
            onClick={handleSearch}
            className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <Search className="h-5 w-5 mr-2" />
            Search
          </Button>
        </div>

        {/* Quick category chips */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
          {[
            { label: 'Restaurants', search: 'restaurant' },
            { label: 'Coffee', search: 'coffee' },
            { label: 'Events', path: '/events' },
            { label: 'Museums', search: 'museum' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if ('path' in item && item.path) {
                  window.location.href = item.path;
                } else if ('search' in item) {
                  onSearch(item.search, {});
                }
              }}
              className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium hover:bg-white/30 transition-colors whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
