import { PULSE_CATEGORY_TAGS } from '@/lib/pulse-config';
import { PulseIcon } from './PulseIcon';
import { cn } from '@/lib/utils';

interface PulseCategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
  /** Tag ids that actually appear on live posts; chips outside this set are
   *  hidden so the row doesn't show empty interest categories. The selected
   *  chip is always kept visible so it can be toggled off. */
  available?: string[];
}

export function PulseCategoryFilter({ selected, onSelect, available }: PulseCategoryFilterProps) {
  const visibleTags = available
    ? PULSE_CATEGORY_TAGS.filter((c) => available.includes(c.id) || c.id === selected)
    : PULSE_CATEGORY_TAGS;

  // Nothing to filter by yet — don't show an empty/misleading chip row.
  if (visibleTags.length === 0) return null;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
          !selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'
        )}
      >
        All
      </button>
      {visibleTags.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(isSelected ? null : cat.id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
              isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-secondary'
            )}
          >
            <PulseIcon name={cat.icon} className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
