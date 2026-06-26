import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Presentational, real-data-only seat counter. It animates a TRUE value or it
// does nothing — never a faked, padded, or timer-ticked number. "joined" and
// "seats left" always sum to cap because both derive from the same inputs.
interface SeatCounterProps {
  joined: number;
  cap: number;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

export function SeatCounter({ joined, cap }: SeatCounterProps) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? joined : 0);
  // Odometer-roll runs once, on the first genuine load — not on every re-render.
  const animatedRef = useRef(false);

  useEffect(() => {
    if (reduced || animatedRef.current) {
      setDisplay(joined);
      return;
    }
    animatedRef.current = true;

    let raf = 0;
    let startTs = 0;
    const duration = 800; // within the 600–900ms window
    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(eased * joined)); // rolls to the real value, never past
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(joined);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Intentionally only re-run when the real value or motion pref changes.
  }, [joined, reduced]);

  const seatsLeft = Math.max(0, cap - joined);
  const isFull = joined >= cap;
  const nearFull = seatsLeft <= 10;
  const critical = seatsLeft <= 3;

  // Full — reads as a closed-club achievement, not an error.
  if (isFull) {
    return (
      <div className="text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full border border-lokal-gold/50 bg-lokal-gold/10 px-5 py-2 font-display text-lg font-semibold text-lokal-gold"
          aria-live="polite"
        >
          <span aria-hidden="true">★</span>
          Full — the first 100 are in
        </span>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Low-count framing leads with opportunity, never "only N so far". */}
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {joined === 0 ? 'Join the first 100' : `${joined} of ${cap} seats claimed`}
      </p>

      <div className="mt-2 flex items-baseline justify-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            'font-display font-semibold tabular-nums leading-none',
            critical ? 'text-6xl text-lokal-gold' : nearFull ? 'text-5xl text-lokal-gold' : 'text-5xl text-foreground',
          )}
        >
          {display}
        </span>
        <span className="font-display text-2xl font-medium text-muted-foreground">of {cap}</span>
      </div>

      {/* Seats-left is the urgency driver — kept visible, louder as it shrinks. */}
      <p
        className={cn(
          'mt-2 font-medium',
          critical
            ? 'text-lg font-bold text-lokal-gold'
            : nearFull
              ? 'text-base font-semibold text-lokal-gold'
              : 'text-sm text-muted-foreground',
        )}
      >
        {seatsLeft} {seatsLeft === 1 ? 'seat' : 'seats'} left
      </p>

      {/* Announce only the settled value, not intermediate animation frames. */}
      <span className="sr-only" aria-live="polite">
        {joined} of {cap} joined, {seatsLeft} seats left
      </span>
    </div>
  );
}
