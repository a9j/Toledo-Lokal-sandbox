import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, UtensilsCrossed, Coffee, PartyPopper, Palette, ShoppingBag } from 'lucide-react';
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
    <div className="relative overflow-hidden min-h-[420px]">
      {/* Soft pastel gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-toledo-sage via-toledo-lavender to-toledo-rose opacity-90" />
      
      {/* Soft animated blobs */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-toledo-cream rounded-full mix-blend-overlay filter blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-toledo-lavender-light rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      {/* Content */}
      <div className="relative px-4 pt-14 pb-10">
        {/* Brand badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-medium tracking-wider uppercase">Toledo, Ohio</span>
          </div>
        </div>
        
        {/* Header text */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-[1.1] tracking-tight drop-shadow-sm">
            Toledo<span className="text-toledo-cream">Connect</span>
          </h1>
          <p className="text-white/70 text-base max-w-sm mx-auto leading-relaxed">
            Discover local businesses, events, and the best of the Glass City
          </p>
        </div>

        {/* Search box - modernized */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-5 space-y-4 max-w-md mx-auto border border-white/50">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search places, events, deals..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 pl-12 pr-4 rounded-2xl bg-secondary/50 border-0 text-base placeholder:text-muted-foreground/60"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Filters row */}
          <div className="flex gap-3">
            <Select value={neighborhood} onValueChange={setNeighborhood}>
              <SelectTrigger className="flex-1 h-12 rounded-xl border-0 bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <SelectValue placeholder="Area" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {neighborhoods?.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="flex-1 h-12 rounded-xl border-0 bg-secondary/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
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
            className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-toledo-lavender text-white hover:opacity-90 transition-opacity shadow-lg"
          >
            <Search className="h-5 w-5 mr-2" />
            Explore Toledo
          </Button>
        </div>

        {/* Quick category chips - modernized */}
        <div className="flex gap-2 mt-8 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
          {[
            { label: 'Restaurants', search: 'restaurant', icon: UtensilsCrossed },
            { label: 'Coffee', search: 'coffee', icon: Coffee },
            { label: 'Events', path: '/events', icon: PartyPopper },
            { label: 'Arts', search: 'arts', icon: Palette },
            { label: 'Shopping', search: 'shopping', icon: ShoppingBag },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if ('path' in item && item.path) {
                    window.location.href = item.path;
                  } else if ('search' in item) {
                    onSearch(item.search, {});
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium hover:bg-white/30 hover:scale-105 transition-all duration-200 whitespace-nowrap"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
