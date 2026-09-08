import { FollowButton } from '@/components/city-os/FollowButton';

interface FollowTruckButtonProps {
  businessId: string;
  /** "Follow the Truck" for food trucks; "Follow" elsewhere. */
  label?: string;
  className?: string;
}

/**
 * @deprecated Use `<FollowButton />` directly. Kept so any caller still holding
 * a business id keeps working; it now writes to `entity_follows` like every
 * other follow in the app, and the database bridges that back to
 * `business_follows` for the dashboard and admin counts.
 */
export function FollowTruckButton({ businessId, label = 'Follow', className }: FollowTruckButtonProps) {
  return (
    <FollowButton
      source={{ table: 'businesses', id: businessId }}
      label={label}
      className={className}
    />
  );
}
