import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { SEOHead } from '@/components/seo/SEOHead';
import { PulseShareButton } from '@/components/pulse/PulseShareButton';
import { PulseShareCard } from '@/components/pulse/PulseShareCard';
import { PulseFeed } from '@/components/pulse/PulseFeed';
import { PULSE_CATEGORIES, formatTimeRemaining, PulseCategory } from '@/lib/pulse-config';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Zap, AlertTriangle, Activity, HelpCircle, Heart, 
  Clock, MapPin, ArrowLeft, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PulsePost } from '@/hooks/usePulse';
import DOMPurify from 'dompurify';

const CATEGORY_ICONS = {
  right_now: Zap,
  heads_up: AlertTriangle,
  energy_check: Activity,
  community_ask: HelpCircle,
  good_stuff: Heart,
};

export default function PulseDetail() {
  const { pulseId } = useParams<{ pulseId: string }>();
  const { user } = useAuth();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['pulse-detail', pulseId],
    queryFn: async () => {
      // Try to find by pulse_id first, then by id
      let { data, error } = await supabase
        .from('pulse_posts')
        .select(`
          *,
          business:businesses(id, name, logo_url)
        `)
        .eq('pulse_id', pulseId)
        .maybeSingle();

      if (!data) {
        // Try by regular id
        const result = await supabase
          .from('pulse_posts')
          .select(`
            *,
            business:businesses(id, name, logo_url)
          `)
          .eq('id', pulseId)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!data) throw new Error('Pulse not found');

      // Fetch author profile if user post
      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .eq('user_id', data.user_id)
          .maybeSingle();
        
        return { ...data, author: profile } as PulsePost & {
          pulse_id: string;
          headline: string | null;
          preview_text: string | null;
          full_body: string | null;
          hero_image: string | null;
          share_enabled: boolean;
          anonymous: boolean;
        };
      }

      return data as PulsePost & {
        pulse_id: string;
        headline: string | null;
        preview_text: string | null;
        full_body: string | null;
        hero_image: string | null;
        share_enabled: boolean;
        anonymous: boolean;
      };
    },
    enabled: !!pulseId,
  });

  const isExpired = post ? new Date(post.expires_at) < new Date() : false;
  const isActive = post?.status === 'active' && !isExpired;

  // Generate OG metadata
  const ogTitle = post?.headline || post?.content.substring(0, 60) || 'The Pulse';
  const ogDescription = post?.preview_text || post?.content.substring(0, 160) || 'See what\'s happening in Toledo right now';
  const ogImage = post?.hero_image || `${window.location.origin}/og-pulse-default.png`;
  const ogUrl = `${window.location.origin}/pulse/${pulseId}`;

  if (isLoading) {
    return (
      <>
        <Header />
        <PageContainer>
          <div className="max-w-2xl mx-auto py-8 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <SEOHead title="Pulse Not Found | ToledoLokal" />
        <Header />
        <PageContainer>
          <div className="max-w-2xl mx-auto py-12 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Pulse Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This pulse may have expired or been removed.
            </p>
            <Link to="/pulse">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to The Pulse
              </Button>
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const categoryConfig = PULSE_CATEGORIES[post.category as PulseCategory];
  const CategoryIcon = CATEGORY_ICONS[post.category as PulseCategory];
  const authorName = post.anonymous ? 'Anonymous' : (post.business?.name || (post as any).author?.name || 'Toledo Local');
  const authorInitial = authorName.charAt(0).toUpperCase();
  const timeRemaining = formatTimeRemaining(new Date(post.expires_at));

  return (
    <>
      <SEOHead
        title={`${ogTitle} | The Pulse - ToledoLokal`}
        description={ogDescription}
        image={ogImage}
        url={ogUrl}
        type="article"
      />
      <Header />
      <PageContainer>
        <div className="max-w-2xl mx-auto py-6 pb-24">
          {/* Back link */}
          <Link to="/pulse" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to The Pulse
          </Link>

          {/* Main content card */}
          <Card className={cn(
            "overflow-hidden",
            !isActive && "opacity-60"
          )}>
            {/* Hero image if present */}
            {post.hero_image && (
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={post.hero_image} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardContent className="p-6">
              {/* Category badge */}
              <Badge className={cn("mb-4 gap-1", categoryConfig?.bgColor, categoryConfig?.color)}>
                {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                {categoryConfig?.label}
              </Badge>

              {/* Author info */}
              <div className="flex items-center gap-3 mb-4">
                {post.business ? (
                  <SecureAvatar
                    storagePath={post.business.logo_url}
                    fallbackText={post.business.name}
                    className="h-12 w-12"
                  />
                ) : (
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={(post as any).author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground">
                      {authorInitial}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="font-medium text-foreground">{authorName}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isActive ? timeRemaining : 'Expired'}
                    </span>
                    {post.location_text && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {post.location_text}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Headline */}
              {post.headline && (
                <h1 className="text-2xl font-bold text-foreground mb-3">
                  {post.headline}
                </h1>
              )}

              {/* Content - different for logged in vs logged out */}
              {user ? (
                // Logged in: Full content
                <div className="space-y-4">
                  <p className="text-foreground leading-relaxed">
                    {post.content}
                  </p>
                  {post.full_body && (
                    <div 
                      className="prose prose-sm max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(post.full_body, {
                          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote'],
                          ALLOWED_ATTR: ['href', 'target', 'rel'],
                          FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
                          FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
                        })
                      }}
                    />
                  )}
                </div>
              ) : (
                // Logged out: Preview only
                <div className="space-y-4">
                  <p className="text-foreground leading-relaxed">
                    {post.preview_text || post.content.substring(0, 160)}
                    {post.content.length > 160 && '...'}
                  </p>

                  {/* Content gate */}
                  <Card className="bg-secondary/50 border-border">
                    <CardContent className="p-6 text-center">
                      <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground mb-2">
                        Join ToledoLokal to see the full Pulse
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sign up to see full content, join the conversation, and connect with your Toledo community.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Link to="/auth?mode=signup">
                          <Button>Sign Up Free</Button>
                        </Link>
                        <Link to="/auth?mode=login">
                          <Button variant="outline">Log In</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Share button */}
              {post.share_enabled !== false && isActive && (
                <div className="mt-6 pt-4 border-t border-border flex justify-end">
                  <PulseShareButton post={post} size="default" variant="outline" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share card preview (only show when logged in for sharing) */}
          {user && !post.hero_image && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Share Preview</h3>
              <PulseShareCard 
                headline={post.headline || post.content.substring(0, 60)}
                category={post.category as PulseCategory}
                businessName={post.business?.name}
              />
            </div>
          )}

          {/* Related pulses */}
          {user && (
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-foreground mb-4">More from The Pulse</h2>
              <PulseFeed limit={5} showFilters={false} />
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
