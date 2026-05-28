import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Radio, Sparkles, Bookmark, Users, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileBusiness } from './profile-types';
import { ProfileCard, ActivityPill, SectionLabel } from './ProfilePrimitives';

interface PulseTabProps {
  business: ProfileBusiness;
  savedCount: number;
  isSaved: boolean;
  onSave: () => void;
}

export function PulseTab({ business, savedCount, isSaved, onSave }: PulseTabProps) {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['profile-pulse', business.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pulse_posts')
        .select('id, content, category, created_at')
        .eq('business_id', business.id)
        .eq('author_type', 'business')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!business.id,
  });

  if (isLoading) {
    return <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  }

  if (posts && posts.length > 0) {
    return (
      <div className="space-y-3">
        <SectionLabel>Latest from {business.name}</SectionLabel>
        {posts.map((post) => (
          <ProfileCard key={post.id} className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Radio className="h-3 w-3 text-primary" />
              <span className="capitalize">{post.category || 'Update'}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
            </div>
            <p className="whitespace-pre-line text-sm text-foreground">{post.content}</p>
          </ProfileCard>
        ))}
      </div>
    );
  }

  // Never a dead empty section — show useful fallback activity.
  return (
    <div className="space-y-3">
      <SectionLabel>Activity</SectionLabel>
      <div className="space-y-2">
        <ActivityPill icon={Sparkles}>Recently added to Toledo Lokal</ActivityPill>
        {savedCount > 0 && <ActivityPill icon={Bookmark}>{savedCount} {savedCount === 1 ? 'person has' : 'people have'} saved this business</ActivityPill>}
        <ActivityPill icon={Clock}>Active this week</ActivityPill>
        {business.neighborhood?.name && <ActivityPill icon={MapPin}>Popular in {business.neighborhood.name}</ActivityPill>}
        <ActivityPill icon={Users}>Locals are discovering this spot</ActivityPill>
      </div>
      <ProfileCard className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Be the first to follow for updates</p>
          <p className="text-xs text-muted-foreground">Get notified when {business.name} posts specials, events, and news.</p>
        </div>
        <Button size="sm" variant={isSaved ? 'default' : 'outline'} onClick={onSave} className="flex-shrink-0 gap-1.5 rounded-full">
          <Bookmark className={isSaved ? 'h-4 w-4 fill-current' : 'h-4 w-4'} />
          {isSaved ? 'Following' : 'Follow'}
        </Button>
      </ProfileCard>
    </div>
  );
}
