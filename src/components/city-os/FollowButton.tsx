import { Bell, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEntityFollow, useEntityId, type EntityRef } from '@/hooks/useEntityFollow';

interface FollowButtonProps {
  /** The CityGraph entity id, when the caller already has one. */
  entityId?: string | null;
  /** Or the source row, and the entity id gets looked up. */
  source?: EntityRef;
  /** Button label when not following. */
  label?: string;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/**
 * One follow button for everything in the city.
 *
 * Following an entity is what routes its changes into your Civic Inbox, so the
 * copy says that rather than promising notifications we do not send yet.
 */
export function FollowButton({
  entityId,
  source,
  label = 'Follow',
  variant,
  size = 'default',
  className,
}: FollowButtonProps) {
  const { user } = useAuth();
  const resolved = useEntityId(entityId ? undefined : source);
  const id = entityId ?? resolved.data ?? null;

  const { isFollowing, followerCount, toggleFollow } = useEntityFollow(id);

  // An entity that is not in the registry yet cannot be followed. Rather than
  // show a button that always fails, show nothing.
  if (!id && !resolved.isLoading && !entityId) return null;

  const handleClick = () => {
    if (!user) {
      toast.error('Sign in to follow this and get updates in your inbox.');
      return;
    }
    toggleFollow.mutate(undefined, {
      onSuccess: () =>
        toast.success(
          isFollowing ? 'Unfollowed.' : 'Following. Changes will show up in your inbox.',
        ),
      onError: () => toast.error('Could not update. Please try again.'),
    });
  };

  const busy = toggleFollow.isPending || resolved.isLoading;

  return (
    <Button
      type="button"
      variant={variant ?? (isFollowing ? 'secondary' : 'default')}
      size={size}
      onClick={handleClick}
      disabled={busy || !id}
      className={className}
      aria-pressed={isFollowing}
    >
      {busy ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <BellRing className="mr-1.5 h-4 w-4" />
      ) : (
        <Bell className="mr-1.5 h-4 w-4" />
      )}
      {isFollowing ? 'Following' : label}
      {followerCount > 0 && <span className="ml-1.5 text-xs opacity-80">· {followerCount}</span>}
    </Button>
  );
}
