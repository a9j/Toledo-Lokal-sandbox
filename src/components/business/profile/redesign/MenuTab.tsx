import { useMenuItems, formatPrice } from '@/hooks/useMenuItems';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed } from 'lucide-react';
import { ProfileCard, SectionLabel, EmptyState } from './ProfilePrimitives';

export function MenuTab({ businessId }: { businessId: string }) {
  const { data: items, isLoading } = useMenuItems(businessId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  const available = items?.filter(i => i.is_available) || [];

  if (available.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No menu yet"
        description="This business hasn't posted their menu yet."
      />
    );
  }

  const categories = [...new Set(available.map(i => i.category).filter(Boolean))];
  const grouped = categories.length > 0
    ? categories.map(cat => ({
        category: cat!,
        items: available.filter(i => i.category === cat),
      })).concat(
        available.some(i => !i.category)
          ? [{ category: 'Other', items: available.filter(i => !i.category) }]
          : []
      )
    : [{ category: '', items: available }];

  return (
    <div className="space-y-4">
      {grouped.map(group => (
        <div key={group.category} className="space-y-2">
          {group.category && (
            <SectionLabel>{group.category}</SectionLabel>
          )}
          {group.items.map(item => (
            <ProfileCard key={item.id} className="flex gap-3">
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  {item.price_cents !== null && (
                    <span className="text-sm font-semibold text-foreground flex-shrink-0">
                      {formatPrice(item.price_cents)}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </ProfileCard>
          ))}
        </div>
      ))}
    </div>
  );
}
