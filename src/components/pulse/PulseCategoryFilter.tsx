import { PULSE_CATEGORY_TAGS } from '@/lib/pulse-config';
import { PulseIcon } from './PulseIcon';
import { cn } from '@/lib/utils';

interface PulseCategoryFilterProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function PulseCategoryFilter({ selected, onSelect }: PulseCategoryFilterProps) {
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
      {PULSE_CATEGORY_TAGS.map((cat) => {
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
