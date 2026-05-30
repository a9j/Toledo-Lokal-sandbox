import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';

interface SecondaryCategorySelectorProps {
  businessId: string;
  /** The primary category (businesses.category_id) — excluded from the list. */
  primaryCategoryId?: string;
}

/**
 * Optional secondary browse tags. A business has one primary category; these let
 * it also surface in other category buckets. Persists immediately on toggle.
 */
export function SecondaryCategorySelector({
  businessId,
  primaryCategoryId,
}: SecondaryCategorySelectorProps) {
  const { data: categories } = useCategories();
  const { secondaryCategoryIds, setSecondaryCategories, isLoading } = useBusinessCategories(businessId);
  const [selected, setSelected] = useState<string[]>([]);

  // Sync local state from the server once loaded.
  useEffect(() => {
    setSelected(secondaryCategoryIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondaryCategoryIds.join(',')]);

  const options = (categories ?? []).filter((c) => c.id !== primaryCategoryId);

  const toggle = (categoryId: string) => {
    const next = selected.includes(categoryId)
      ? selected.filter((id) => id !== categoryId)
      : [...selected, categoryId];
    setSelected(next);
    setSecondaryCategories.mutate(next, {
      onError: () => {
        toast.error('Could not update categories. Please try again.');
        setSelected(selected); // revert
      },
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Also appears in</span>
        {(isLoading || setSecondaryCategories.isPending) && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Optional. Add extra browse categories so locals can find you in more than one place.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((cat) => {
          const isOn = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              aria-pressed={isOn}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                isOn
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {isOn && <Check className="h-3 w-3" />}
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
