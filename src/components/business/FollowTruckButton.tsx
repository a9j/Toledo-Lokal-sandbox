import { Bell, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessFollows } from '@/hooks/useBusinessFollows';

interface FollowTruckButtonProps {
  businessId: string;
  /** "Follow the Truck" for food trucks; "Follow" elsewhere. */
  label?: string;
  className?: string;
}

export function FollowTruckButton({ businessId, label = 'Follow', className }: FollowTruckButtonProps) {
  const { user } = useAuth();
  const { isFollowing, followerCount, toggleFollow } = useBusinessFollows(businessId);

  const handleClick = () => {
    if (!user) {
      toast.error('Sign in to follow and get notified about new stops.');
      return;
    }
    toggleFollow.mutate(undefined, {
      onSuccess: () =>
        toast.success(isFollowing ? 'Unfollowed.' : "You're following — we'll keep you posted."),
      onError: () => toast.error('Could not update. Please try again.'),
    });
  };

  return (
    <Button
      type="button"
      variant={isFollowing ? 'secondary' : 'default'}
      onClick={handleClick}
      disabled={toggleFollow.isPending}
      className={className}
    >
      {toggleFollow.isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <BellRing className="mr-1.5 h-4 w-4" />
      ) : (
        <Bell className="mr-1.5 h-4 w-4" />
      )}
      {isFollowing ? 'Following' : label}
      {followerCount > 0 && (
        <span className="ml-1.5 text-xs opacity-80">· {followerCount}</span>
      )}
    </Button>
  );
}
