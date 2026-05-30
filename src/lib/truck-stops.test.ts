import { describe, it, expect } from 'vitest';
import { deriveNowAndNext, directionsUrl, statusLabel, type TruckStop } from './truck-stops';

const NOW = new Date('2026-05-30T12:00:00Z');

function stop(partial: Partial<TruckStop> & { id: string; starts_at: string; ends_at: string }): TruckStop {
  return {
    business_id: 'biz',
    location_name: 'Somewhere',
    lat: null,
    lng: null,
    status: 'open',
    ...partial,
  };
}

describe('deriveNowAndNext', () => {
  it('"Now at" is the stop whose window contains now', () => {
    const stops = [
      stop({ id: 'a', starts_at: '2026-05-30T11:00:00Z', ends_at: '2026-05-30T13:00:00Z' }),
      stop({ id: 'b', starts_at: '2026-05-30T15:00:00Z', ends_at: '2026-05-30T18:00:00Z' }),
    ];
    const { nowAt, nextStop } = deriveNowAndNext(stops, NOW);
    expect(nowAt?.id).toBe('a');
    expect(nextStop?.id).toBe('b');
  });

  it('"Next stop" is the soonest future stop when nothing is live', () => {
    const stops = [
      stop({ id: 'past', starts_at: '2026-05-30T08:00:00Z', ends_at: '2026-05-30T10:00:00Z' }),
      stop({ id: 'soon', starts_at: '2026-05-30T14:00:00Z', ends_at: '2026-05-30T16:00:00Z' }),
      stop({ id: 'later', starts_at: '2026-05-30T19:00:00Z', ends_at: '2026-05-30T21:00:00Z' }),
    ];
    const { nowAt, nextStop } = deriveNowAndNext(stops, NOW);
    expect(nowAt).toBeNull();
    expect(nextStop?.id).toBe('soon');
  });

  it('a private stop is never "Now at" even if its window contains now', () => {
    const stops = [
      stop({ id: 'priv', status: 'private', starts_at: '2026-05-30T11:00:00Z', ends_at: '2026-05-30T13:00:00Z' }),
    ];
    const { nowAt } = deriveNowAndNext(stops, NOW);
    expect(nowAt).toBeNull();
  });

  it('a sold_out stop can still be "Now at" (it is there, just out of food)', () => {
    const stops = [
      stop({ id: 'so', status: 'sold_out', starts_at: '2026-05-30T11:00:00Z', ends_at: '2026-05-30T13:00:00Z' }),
    ];
    expect(deriveNowAndNext(stops, NOW).nowAt?.id).toBe('so');
  });

  it('closed stops are excluded from now/next/upcoming', () => {
    const stops = [
      stop({ id: 'closed', status: 'closed', starts_at: '2026-05-30T14:00:00Z', ends_at: '2026-05-30T16:00:00Z' }),
      stop({ id: 'open', status: 'open', starts_at: '2026-05-30T18:00:00Z', ends_at: '2026-05-30T20:00:00Z' }),
    ];
    const { nextStop, upcoming } = deriveNowAndNext(stops, NOW);
    expect(nextStop?.id).toBe('open');
    expect(upcoming.map((s) => s.id)).toEqual(['open']);
  });

  it('upcoming is sorted soonest-first and excludes finished stops', () => {
    const stops = [
      stop({ id: 'finished', starts_at: '2026-05-30T08:00:00Z', ends_at: '2026-05-30T09:00:00Z' }),
      stop({ id: 'live', starts_at: '2026-05-30T11:30:00Z', ends_at: '2026-05-30T13:00:00Z' }),
      stop({ id: 'future', starts_at: '2026-05-30T16:00:00Z', ends_at: '2026-05-30T17:00:00Z' }),
    ];
    expect(deriveNowAndNext(stops, NOW).upcoming.map((s) => s.id)).toEqual(['live', 'future']);
  });

  it('handles an empty list', () => {
    expect(deriveNowAndNext([], NOW)).toEqual({ nowAt: null, nextStop: null, upcoming: [] });
  });
});

describe('directionsUrl', () => {
  it('prefers coordinates', () => {
    expect(directionsUrl({ lat: 41.6, lng: -83.5, location_name: 'X' })).toContain('destination=41.6,-83.5');
  });
  it('falls back to the location name', () => {
    expect(directionsUrl({ lat: null, lng: null, location_name: 'Monroe St' })).toContain(
      'destination=Monroe%20St'
    );
  });
});

describe('statusLabel', () => {
  it('maps private to the unavailable copy', () => {
    expect(statusLabel('private')).toBe('Private event — unavailable');
    expect(statusLabel('sold_out')).toBe('Sold out');
  });
});
