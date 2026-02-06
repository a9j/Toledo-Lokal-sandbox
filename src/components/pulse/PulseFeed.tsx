import { usePulse } from '@/hooks/usePulse';
import { PulsePostCard } from './PulsePostCard';
import { PULSE_CATEGORIES, PulseCategory } from '@/lib/pulse-config';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, AlertTriangle, Activity, HelpCircle, Heart, Radio, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const CATEGORY_ICONS = {
  right_now: Zap,
  heads_up: AlertTriangle,
  energy_check: Activity,
  community_ask: HelpCircle,
  good_stuff: Heart,
};

type AuthorFilter = 'all' | 'business' | 'user';

interface PulseFeedProps {
  limit?: number;
  showFilters?: boolean;
}

export function PulseFeed({ limit, showFilters = true }: PulseFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState<PulseCategory | null>(null);
  const [authorFilter, setAuthorFilter] = useState<AuthorFilter>('all');
  const { data: posts, isLoading, error } = usePulse({ 
    category: selectedCategory || undefined,
    limit 
  });

  // Filter posts by author type
  const filteredPosts = posts?.filter(post => {
    if (authorFilter === 'all') return true;
    return post.author_type === authorFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Error loading The Pulse</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Author type filter */}
      {showFilters && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setAuthorFilter('all')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
              authorFilter === 'all' 
                ? "border-primary bg-primary text-primary-foreground" 
                : "border-border hover:bg-secondary"
            )}
          >
            <Radio className="h-3.5 w-3.5" />
            All
          </button>
          <button
            onClick={() => setAuthorFilter('business')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
              authorFilter === 'business' 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-border hover:bg-secondary"
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            Businesses
          </button>
          <button
            onClick={() => setAuthorFilter('user')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
              authorFilter === 'user' 
                ? "border-muted-foreground bg-secondary text-foreground" 
                : "border-border hover:bg-secondary"
            )}
          >
            <User className="h-3.5 w-3.5" />
            Residents
          </button>
        </div>
      )}

      {/* Category filters */}
      {showFilters && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
              !selectedCategory 
                ? "border-primary bg-primary text-primary-foreground" 
                : "border-border hover:bg-secondary"
            )}
          >
            All Categories
          </button>
          {Object.values(PULSE_CATEGORIES).map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all",
                  isSelected 
                    ? cn(cat.bgColor, cat.color, "border-current") 
                    : "border-border hover:bg-secondary"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Posts */}
      {filteredPosts && filteredPosts.length > 0 ? (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <PulsePostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-foreground mb-1">Nothing on The Pulse</h3>
          <p className="text-sm text-muted-foreground">
            {authorFilter !== 'all' 
              ? `No ${authorFilter === 'business' ? 'business' : 'resident'} posts right now`
              : 'Be the first to share what\'s happening in Toledo'
            }
          </p>
        </div>
      )}
    </div>
  );
}
