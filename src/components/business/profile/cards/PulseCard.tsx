import { MessageSquare, Clock, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { FlipCard } from '../FlipCard';
import { SecureImage } from '@/components/ui/secure-image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PULSE_CATEGORIES, type PulseCategory } from '@/lib/pulse-config';

interface PulseCardProps {
  businessId: string;
  businessName: string;
}

export function PulseCard({ businessId, businessName }: PulseCardProps) {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['business-pulse-flip', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pulse_posts')
        .select('*')
        .eq('business_id', businessId)
        .eq('author_type', 'business')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  // Fetch community activity summary
  const { data: favoriteCount } = useQuery({
    queryKey: ['business-favorites-count', businessId],
    queryFn: async () => {
      const { count } = await supabase
        .from('saved_items')
        .select('*', { count: 'exact', head: true })
        .eq('item_id', businessId)
        .eq('item_type', 'business');
      
      return count || 0;
    },
    enabled: !!businessId,
  });

  if (isLoading) {
    return (
      <FlipCard title="Business Pulse">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </FlipCard>
    );
  }

  const hasPosts = posts && posts.length > 0;

  return (
    <FlipCard title="Business Pulse">
      <div className="flex flex-col h-full">
        {/* Community Activity Summary */}
        {favoriteCount != null && favoriteCount > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              <strong className="text-foreground">{favoriteCount}</strong> locals have this saved
            </span>
          </div>
        )}

        {hasPosts ? (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {posts.map((post) => {
              const categoryConfig = PULSE_CATEGORIES[post.category as PulseCategory];
              
              return (
                <div 
                  key={post.id}
                  className="p-4 rounded-2xl bg-card border border-border/50 shadow-sm"
                >
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {categoryConfig?.label || post.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-foreground text-sm line-clamp-3">
                    {post.content}
                  </p>

                  {/* Image */}
                  {post.hero_image && (
                    <div className="mt-3 rounded-xl overflow-hidden aspect-video">
                      <SecureImage
                        storagePath={post.hero_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No Updates Yet</h3>
            <p className="text-sm text-muted-foreground">
              {businessName} hasn't posted any updates recently
            </p>
          </div>
        )}
      </div>
    </FlipCard>
  );
}
