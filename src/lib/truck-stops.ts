// Pure schedule logic for the food-truck preset.
//
// "Now at" and "Next stop" are derived from the stops list — not stored. Kept
// free of React/Supabase so the derivation is unit-testable.

export type TruckStopStatus = 'open' | 'sold_out' | 'private' | 'closed';

export interface TruckStop {
  id: string;
  business_id: string;
  location_name: string;
  lat: number | null;
  lng: number | null;
  starts_at: string; // ISO timestamptz
  ends_at: string; // ISO timestamptz
  status: TruckStopStatus;
  checkin_code?: string | null;
}

export interface DerivedSchedule {
  /** The stop whose [starts_at, ends_at] window contains `now`, if any. */
  nowAt: TruckStop | null;
  /** The soonest stop that starts after `now`, if any. */
  nextStop: TruckStop | null;
  /** Future + currently-running stops, soonest first (for "Upcoming Stops"). */
  upcoming: TruckStop[];
}

function startMs(s: TruckStop) {
  return new Date(s.starts_at).getTime();
}
function endMs(s: TruckStop) {
  return new Date(s.ends_at).getTime();
}

/**
 * Derive the "Now at" and "Next stop" views from a list of stops.
 *
 *  - "Now at" = a stop whose window contains `now`. A `private` or `closed`
 *    stop is never treated as "now at" (the truck isn't available to walk up to),
 *    matching the spec's "Sunday private — unavailable".
 *  - "Next stop" = the soonest stop starting in the future. `closed` stops are
 *    excluded; `private` stops still appear (so the schedule can show
 *    "Private event — unavailable").
 */
export function deriveNowAndNext(stops: TruckStop[], now: Date = new Date()): DerivedSchedule {
  const nowMs = now.getTime();
  const sorted = [...stops].sort((a, b) => startMs(a) - startMs(b));

  const nowAt =
    sorted.find(
      (s) =>
        startMs(s) <= nowMs &&
        endMs(s) > nowMs &&
        s.status !== 'private' &&
        s.status !== 'closed'
    ) ?? null;

  const nextStop =
    sorted.find((s) => startMs(s) > nowMs && s.status !== 'closed') ?? null;

  // Upcoming = anything not finished, excluding closed stops.
  const upcoming = sorted.filter((s) => endMs(s) > nowMs && s.status !== 'closed');

  return { nowAt, nextStop, upcoming };
}

const STATUS_LABEL: Record<TruckStopStatus, string> = {
  open: 'Open',
  sold_out: 'Sold out',
  private: 'Private event — unavailable',
  closed: 'Closed',
};

export function statusLabel(status: TruckStopStatus): string {
  return STATUS_LABEL[status];
}

/** A Google Maps directions URL for a stop (prefers coords, falls back to name). */
export function directionsUrl(stop: Pick<TruckStop, 'lat' | 'lng' | 'location_name'>): string {
  const dest =
    stop.lat != null && stop.lng != null
      ? `${stop.lat},${stop.lng}`
      : encodeURIComponent(stop.location_name);
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
}
