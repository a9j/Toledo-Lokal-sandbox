import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEntityId, useIsFollowing, useToggleFollow, type EntityRef } from '@/hooks/useCityOs';

interface FollowButtonProps {
  /** The source row. The graph turns this into an entity, so callers never
   *  need to know an entity id. */
  source: EntityRef;
  label?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Follow anything in the city: a business, an event, a neighborhood, a job,
 * a nonprofit, an address.
 *
 * Renders nothing when the thing is not in the graph, rather than a button
 * that would fail on click.
 */
export function FollowButton({ source, label, className, size = 'default' }: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: entityId, isLoading } = useEntityId(source);
  const { data: following } = useIsFollowing(entityId);
  const toggle = useToggleFollow();

  if (isLoading) {
    return (
      <Button variant="secondary" size={size} disabled className={className}>
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        Follow
      </Button>
    );
  }

  if (!entityId) return null;

  const onClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    toggle.mutate(
      { entityId, following: !!following },
      {
        onSuccess: (nowFollowing) =>
          toast.success(
            nowFollowing
              ? 'Following. Changes will show up in your inbox.'
              : 'Unfollowed.',
          ),
        onError: (e: Error) => toast.error(e.message || 'That did not work. Try again.'),
      },
    );
  };

  return (
    <Button
      variant={following ? 'secondary' : 'default'}
      size={size}
      className={className}
      onClick={onClick}
      disabled={toggle.isPending}
      aria-pressed={!!following}
    >
      {toggle.isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : following ? (
        <BellRing className="mr-1.5 h-4 w-4" />
      ) : (
        <Bell className="mr-1.5 h-4 w-4" />
      )}
      {following ? 'Following' : (label ?? 'Follow')}
    </Button>
  );
}
