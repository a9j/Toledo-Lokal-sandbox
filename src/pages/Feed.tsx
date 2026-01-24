import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageContainer } from '@/components/layout/PageContainer';
import { PostCard } from '@/components/cards/PostCard';
import { EventCard } from '@/components/cards/EventCard';
import { DealCard } from '@/components/cards/DealCard';
import { usePosts } from '@/hooks/usePosts';
import { useEvents } from '@/hooks/useEvents';
import { useDeals } from '@/hooks/useDeals';
import { useBusinesses } from '@/hooks/useBusinesses';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronRight, Star, Clock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SecureImage } from '@/components/ui/secure-image';
import { postSchema, validateInput, sanitizeText } from '@/lib/validation-schemas';
import { moderateTextContent } from '@/hooks/useContentModeration';

// Placeholder images
const heroImages = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800&h=600&fit=crop',
];

export default function Feed() {
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading: postsLoading } = usePosts({ limit: 10 });
  const { data: todayEvents } = useEvents({ today: true, limit: 4 });
  const { data: deals } = useDeals({ limit: 3 });
  const { data: featuredBusinesses } = useBusinesses({ featured: true, limit: 6 });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in');
      
      // Validate input with Zod
      const validation = validateInput(postSchema, { content, post_type: 'community' });
      if (!validation.success) {
        throw new Error('errors' in validation ? validation.errors[0] : 'Validation failed');
      }
      
      // Sanitize content
      const sanitizedContent = sanitizeText(validation.data.content);
      
      // Moderate text content
      const moderation = await moderateTextContent(sanitizedContent);
      if (!moderation.safe) {
        throw new Error(`Content flagged: ${moderation.flaggedReasons.join(', ')}`);
      }
      
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        content: sanitizedContent,
        post_type: validation.data.post_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPostContent('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: 'Posted!' });
    },
    onError: (error: any) => {
      const isRateLimit = error?.message?.includes('row-level security') || error?.code === '42501';
      toast({ 
        variant: 'destructive', 
        title: isRateLimit ? 'Slow down!' : 'Error', 
        description: isRateLimit ? 'You can only post 10 times per day. Please try again later.' : 'Failed to create post. Please try again.' 
      });
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <section className="relative">
        <div className="px-5 pt-12 pb-8">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground">Toledo<span className="text-lokal-amber">Lokal</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Discover the Glass City</p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search places, events, deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-12 pl-11 pr-4 rounded-full border-border bg-secondary/50 text-sm"
            />
          </div>

          {/* Featured Hero Card */}
          <Link to="/explore" className="block group">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
              <img
                src={heroImages[0]}
                alt="Featured"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 image-overlay" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <span className="inline-block px-2.5 py-1 rounded-full bg-white/90 text-xs font-medium text-foreground mb-3">
                  Editor's Pick
                </span>
                <h2 className="font-serif text-2xl text-white mb-1">
                  Best New Restaurants in Toledo
                </h2>
                <p className="text-white/80 text-sm">
                  Our curated guide to the city's hottest openings
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="px-5 py-6 border-t border-border/50">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {['Restaurants', 'Coffee', 'Bars', 'Events', 'Shopping', 'Arts'].map((cat) => (
            <Link
              key={cat}
              to={`/explore?category=${cat.toLowerCase()}`}
              className="px-4 py-2 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Places */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-8 border-t border-border/50">
          <div className="px-5 flex items-end justify-between mb-5">
            <div>
              <p className="section-label mb-1">Curated</p>
              <h2 className="font-serif text-2xl text-foreground">Featured Places</h2>
            </div>
            <Link to="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground link-underline flex items-center gap-1">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto scrollbar-hide px-5 -mx-5">
            {featuredBusinesses.slice(0, 4).map((business, i) => (
              <Link
                key={business.id}
                to={`/business/${business.id}`}
                className="flex-shrink-0 w-[280px] group"
              >
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                  <SecureImage
                    storagePath={business.photos?.[0] || heroImages[i % heroImages.length]}
                    alt={business.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="badge-open flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Open
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                      {business.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 fill-toledo-gold text-toledo-gold" />
                      <span className="font-medium">4.8</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {business.neighborhood?.name || 'Toledo'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Happening Now */}
      {todayEvents && todayEvents.length > 0 && (
        <section className="py-8 border-t border-border/50 bg-secondary/30">
          <div className="px-5 flex items-end justify-between mb-5">
            <div>
              <p className="section-label mb-1">Today</p>
              <h2 className="font-serif text-2xl text-foreground">Happening Now</h2>
            </div>
            <Link to="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground link-underline flex items-center gap-1">
              All events <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="px-5 space-y-3">
            {todayEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} compact />
            ))}
          </div>
        </section>
      )}

      {/* Deals */}
      {deals && deals.length > 0 && (
        <section className="py-8 border-t border-border/50">
          <div className="px-5 flex items-end justify-between mb-5">
            <div>
              <p className="section-label mb-1">Limited Time</p>
              <h2 className="font-serif text-2xl text-foreground">Special Offers</h2>
            </div>
            <Link to="/deals" className="text-sm font-medium text-muted-foreground hover:text-foreground link-underline flex items-center gap-1">
              See deals <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="px-5 space-y-3">
            {deals.slice(0, 2).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        </section>
      )}

      {/* Community Posts */}
      <section className="py-8 border-t border-border/50">
        <div className="px-5">
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="section-label mb-1">Community</p>
              <h2 className="font-serif text-2xl text-foreground">From the Feed</h2>
            </div>
          </div>

          {/* Create Post */}
          {user ? (
            <div className="card-elevated p-4 mb-5">
              <div className="flex gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-secondary text-foreground text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="What's happening in Toledo?"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-[60px] border-0 bg-transparent resize-none p-0 focus-visible:ring-0 text-sm"
                    maxLength={5000}
                  />
                  <div className="flex justify-end mt-2">
                    <Button 
                      size="sm"
                      disabled={!newPostContent.trim() || createPost.isPending}
                      onClick={() => createPost.mutate(newPostContent)}
                      className="rounded-full px-4"
                    >
                      {createPost.isPending ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/auth">
              <div className="card-elevated p-4 mb-5 text-center text-muted-foreground hover:bg-secondary/50 transition-colors text-sm">
                Sign in to share what's happening
              </div>
            </Link>
          )}

          {/* Posts */}
          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : posts?.length ? (
            <div className="space-y-3">
              {posts.slice(0, 5).map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-sm">
              No posts yet. Be the first to share!
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-8">
        <div className="card-elevated-lg p-6 text-center">
          <h3 className="font-serif text-xl text-foreground mb-2">Own a local business?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Join hundreds of Toledo businesses on the Hub
          </p>
          <Button 
            onClick={() => navigate('/create-business')}
            variant="outline"
            className="rounded-full"
          >
            List Your Business <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}