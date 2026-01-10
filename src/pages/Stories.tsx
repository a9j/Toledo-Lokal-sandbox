import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useStories, useCreateStory, useLikeStory } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MapPin, Plus, Sparkles, MessageCircle, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { SEOHead } from '@/components/seo/SEOHead';

const storyTypeLabels: Record<string, { label: string; color: string }> = {
  tip: { label: '💡 Tip', color: 'bg-toledo-gold/20 text-toledo-gold' },
  hidden_gem: { label: '💎 Hidden Gem', color: 'bg-toledo-lavender/20 text-toledo-lavender' },
  memory: { label: '📸 Memory', color: 'bg-toledo-rose/20 text-toledo-rose' },
  recommendation: { label: '⭐ Recommendation', color: 'bg-primary/20 text-primary' },
};

export default function Stories() {
  const { data: stories, isLoading } = useStories();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-[calc(9rem+env(safe-area-inset-bottom))]">
      <SEOHead 
        title="Community Stories"
        description="Read stories from the Toledo community. Local tips, hidden gems, memories, and recommendations from Glass City residents."
        url="/stories"
        keywords={['Toledo stories', 'Toledo community', 'Toledo tips', 'Toledo hidden gems', 'Glass City memories']}
      />
      <Header title="Community Stories" />

      <div className="px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Community Stories</h1>
            <p className="text-muted-foreground text-sm">
              Local tips, hidden gems, and Toledo memories
            </p>
          </div>
          {user && (
            <Link to="/stories/create">
              <Button size="sm" className="rounded-full gap-1">
                <Plus className="h-4 w-4" />
                Share
              </Button>
            </Link>
          )}
        </div>

        {/* Stories Grid */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))
          ) : stories && stories.length > 0 ? (
            stories.map((story) => (
              <article
                key={story.id}
                className="bg-card rounded-2xl overflow-hidden border border-border"
              >
                {story.image_url && (
                  <img
                    src={story.image_url}
                    alt={story.title}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="secondary" 
                      className={storyTypeLabels[story.story_type]?.color || ''}
                    >
                      {storyTypeLabels[story.story_type]?.label || story.story_type}
                    </Badge>
                    {story.featured && (
                      <Badge className="bg-toledo-gold/20 text-toledo-gold">
                        <Sparkles className="h-3 w-3 mr-1" /> Featured
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{story.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {story.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      {story.neighborhood && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {story.neighborhood.name}
                        </span>
                      )}
                      {story.business && (
                        <span>at {story.business.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Heart className="h-4 w-4" />
                        {story.likes_count || 0}
                      </button>
                      <span>{formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-1">No Stories Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to share a Toledo story
              </p>
              {user ? (
                <Link to="/stories/create">
                  <Button className="rounded-full">Share Your Story</Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="rounded-full">Sign In to Share</Button>
                </Link>
              )}
            </div>
          )}
        </div>
       </div>
    </div>
  );
}
