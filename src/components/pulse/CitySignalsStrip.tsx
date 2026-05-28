import { useCitySignals } from '@/hooks/useCitySignals';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

// Live City Signals — a horizontally scrolling strip of system-generated facts
// about what's happening across Toledo right now. Never AI-written.
export function CitySignalsStrip() {
  const { data: signals, isLoading } = useCitySignals();

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-64 shrink-0 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!signals || signals.length === 0) return null;

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto scrollbar-hide px-1 pb-1">
      {signals.map((signal) => {
        const card = (
          <div className="flex h-full w-64 shrink-0 flex-col justify-between rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Radio className="h-3 w-3 animate-pulse" />
              Live
            </div>
            <p className="mt-2 text-sm font-semibold leading-snug text-foreground">{signal.title}</p>
            {signal.subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{signal.subtitle}</p>
            )}
          </div>
        );

        if (signal.signal_type === 'most_saved' && signal.reference_id) {
          return (
            <Link key={signal.id} to={`/business/${signal.reference_id}`} className="shrink-0">
              {card}
            </Link>
          );
        }
        return (
          <div key={signal.id} className="shrink-0">
            {card}
          </div>
        );
      })}
    </div>
  );
}
