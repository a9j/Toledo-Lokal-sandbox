import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal, UtensilsCrossed, Coffee, PartyPopper, Palette, ShoppingBag, Sparkles } from 'lucide-react';
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
import tlLogo from '@/assets/tl-logo.png';

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
    <div className="relative overflow-hidden min-h-[440px]">
      {/* Deep midnight gradient with amber accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-lokal-midnight via-primary to-lokal-midnight" />
      
      {/* Amber glow accents */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-lokal-amber/20 rounded-full filter blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-lokal-forest/15 rounded-full filter blur-[80px] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-lokal-amber/10 rounded-full filter blur-[60px] -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      {/* Geometric pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.04]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
        }} 
      />
      
      {/* Content */}
      <div className="relative px-4 pt-14 pb-10">
        {/* Brand badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-lokal-amber" />
            <span className="text-white/90 text-xs font-semibold tracking-wider uppercase">The Glass City</span>
          </div>
        </div>
        
        {/* Header text */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={tlLogo} alt="ToledoLokal" className="h-16 w-16 rounded-2xl shadow-lg" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-[1.1] tracking-tight">
            Toledo<span className="text-lokal-amber">Lokal</span>
          </h1>
          <p className="text-white/70 text-base max-w-sm mx-auto leading-relaxed">
            Discover local businesses, events, and the best of Toledo
          </p>
        </div>

        {/* Search box */}
        <div className="bg-white rounded-2xl shadow-soft-xl p-5 space-y-4 max-w-md mx-auto">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search places, events, deals..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 pl-12 pr-4 rounded-xl bg-muted/50 border-0 text-base placeholder:text-muted-foreground/60 focus-visible:ring-lokal-amber"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Filters row */}
          <div className="flex gap-3">
            <Select value={neighborhood} onValueChange={setNeighborhood}>
              <SelectTrigger className="flex-1 h-12 rounded-xl border-border bg-muted/50 hover:bg-muted transition-colors">
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
              <SelectTrigger className="flex-1 h-12 rounded-xl border-border bg-muted/50 hover:bg-muted transition-colors">
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
            className="w-full h-14 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-lg hover:shadow-xl"
          >
            <Search className="h-5 w-5 mr-2" />
            Explore Toledo
          </Button>
        </div>

        {/* Quick category chips */}
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-lokal-amber/20 hover:border-lokal-amber/40 hover:scale-105 transition-all duration-200 whitespace-nowrap"
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
