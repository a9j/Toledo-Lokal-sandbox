import { useNeighborhoodActivity } from '@/hooks/useNeighborhoodActivity';
import { NEIGHBORHOOD_ENERGY_STYLES } from '@/lib/pulse-config';
import { cn } from '@/lib/utils';

interface NeighborhoodEnergyProps {
  selected?: string | null;
  onSelect?: (neighborhood: string | null) => void;
}

// The city-energy layer: a compact row of neighborhood vibe indicators.
export function NeighborhoodEnergy({ selected, onSelect }: NeighborhoodEnergyProps) {
  const { data: hoods } = useNeighborhoodActivity();

  if (!hoods || hoods.length === 0) return null;

  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto scrollbar-hide px-1 pb-1">
      {hoods.map((h) => {
        const style = NEIGHBORHOOD_ENERGY_STYLES[h.energy_level] ?? { ring: 'border-lokal-amber/40', text: 'text-lokal-amber' };
        const isSelected = selected === h.neighborhood;
        return (
          <button
            key={h.neighborhood}
            type="button"
            onClick={() => onSelect?.(isSelected ? null : h.neighborhood)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-left transition-all',
              isSelected ? 'border-primary ring-1 ring-primary/40' : style.ring
            )}
          >
            <span className="text-base leading-none">{h.energy_emoji}</span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold text-foreground">{h.neighborhood}</span>
              <span className={cn('text-[10px] capitalize', style.text)}>{h.energy_level}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
