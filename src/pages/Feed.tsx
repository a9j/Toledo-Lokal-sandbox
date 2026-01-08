import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SearchBar } from '@/components/home/SearchBar';
import { NeighborhoodSelector } from '@/components/home/NeighborhoodSelector';
import { SectionHeader } from '@/components/home/SectionHeader';
import { PostCard } from '@/components/cards/PostCard';
import { EventCard } from '@/components/cards/EventCard';
import { DealCard } from '@/components/cards/DealCard';
import { usePosts } from '@/hooks/usePosts';
import { useEvents } from '@/hooks/useEvents';
import { useDeals } from '@/hooks/useDeals';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

export default function Feed() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading: postsLoading } = usePosts({ limit: 20 });
  const { data: todayEvents } = useEvents({ today: true, limit: 3 });
  const { data: deals } = useDeals({ limit: 3 });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase.from('posts').insert({
        author_id: user.id,
        content,
        post_type: 'community',
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPostContent('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({ title: 'Posted!' });
    },
    onError: (error) => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error.message 
      });
    },
  });

  return (
    <>
      <Header title="Toledo Hub" showNotifications />
      
      <PageContainer className="space-y-5">
        {/* Search & Location */}
        <div className="space-y-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <NeighborhoodSelector 
            selected={selectedNeighborhood} 
            onSelect={setSelectedNeighborhood} 
          />
        </div>

        {/* Create Post */}
        {user ? (
          <div className="card-elevated p-4">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="What's happening in Toledo?"
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="min-h-[60px] border-0 bg-transparent resize-none p-0 focus-visible:ring-0"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm"
                    disabled={!newPostContent.trim() || createPost.isPending}
                    onClick={() => createPost.mutate(newPostContent)}
                  >
                    {createPost.isPending ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Link to="/auth">
            <div className="card-elevated p-4 text-center text-muted-foreground hover:bg-secondary/50 transition-colors">
              Sign in to share what's happening
            </div>
          </Link>
        )}

        {/* Feed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
            <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
            <TabsTrigger value="deals" className="flex-1">Deals</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-4">
            {/* Tonight */}
            {todayEvents && todayEvents.length > 0 && (
              <section>
                <SectionHeader title="Tonight in Toledo" viewAllLink="/events" />
                <div className="space-y-2">
                  {todayEvents.map(event => (
                    <EventCard key={event.id} event={event} compact />
                  ))}
                </div>
              </section>
            )}

            {/* Deals */}
            {deals && deals.length > 0 && (
              <section>
                <SectionHeader title="Hot Deals" viewAllLink="/deals" />
                <div className="space-y-2">
                  {deals.slice(0, 2).map(deal => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              </section>
            )}

            {/* Posts */}
            <section>
              <SectionHeader title="Community" />
              {postsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 rounded-2xl" />
                  ))}
                </div>
              ) : posts?.length ? (
                <div className="space-y-3">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No posts yet. Be the first to share!
                </p>
              )}
            </section>
          </TabsContent>

          <TabsContent value="posts" className="mt-4">
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            ) : posts?.length ? (
              <div className="space-y-3">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No posts yet
              </p>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {todayEvents?.length ? (
              <div className="space-y-3">
                {todayEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No events today
              </p>
            )}
            <Link to="/events" className="block mt-4">
              <Button variant="outline" className="w-full">View All Events</Button>
            </Link>
          </TabsContent>

          <TabsContent value="deals" className="mt-4">
            {deals?.length ? (
              <div className="space-y-3">
                {deals.map(deal => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No deals available
              </p>
            )}
            <Link to="/deals" className="block mt-4">
              <Button variant="outline" className="w-full">View All Deals</Button>
            </Link>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
