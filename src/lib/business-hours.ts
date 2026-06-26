const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday',
  friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

interface RawDay {
  open?: string;
  close?: string;
  closed?: boolean;
}

function isHoursObject(raw: unknown): raw is Record<string, RawDay> {
  return !!raw && typeof raw === 'object' && DAY_KEYS.some((k) => typeof (raw as Record<string, unknown>)[k] === 'object');
}

export function formatTime(hhmm: string): string {
  const [h = NaN, m = 0] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const dh = h % 12 === 0 ? 12 : h % 12;
  return m ? `${dh}:${String(m).padStart(2, '0')} ${period}` : `${dh} ${period}`;
}

// Returns null when the business hasn't set real hours (so callers can hide the
// status entirely rather than show fabricated defaults).
export function getOpenStatus(raw: unknown): { isOpen: boolean; label: string } | null {
  if (!isHoursObject(raw)) return null;
  const now = new Date();
  const today = raw[DAY_KEYS[now.getDay()] ?? 'sunday'];
  if (!today || typeof today !== 'object') return null;
  if (today.closed || !today.open || !today.close) return { isOpen: false, label: 'Closed today' };

  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh = 0, om] = today.open.split(':').map(Number);
  const [ch = 0, cm] = today.close.split(':').map(Number);
  const openMin = oh * 60 + (om || 0);
  let closeMin = ch * 60 + (cm || 0);
  if (closeMin <= openMin) closeMin = 24 * 60;

  if (cur >= openMin && cur < closeMin) return { isOpen: true, label: `Open · closes ${formatTime(today.close)}` };
  if (cur < openMin) return { isOpen: false, label: `Opens ${formatTime(today.open)}` };
  return { isOpen: false, label: 'Closed now' };
}

export interface HoursRow {
  day: string;
  label: string;
  isToday: boolean;
}

export function getHoursList(raw: unknown): HoursRow[] | null {
  if (!isHoursObject(raw)) return null;
  const todayKey = DAY_KEYS[new Date().getDay()];
  const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return order.map((key) => {
    const d = raw[key];
    const label = !d || d.closed || !d.open || !d.close ? 'Closed' : `${formatTime(d.open)} – ${formatTime(d.close)}`;
    return { day: DAY_LABELS[key] ?? key, label, isToday: key === todayKey };
  });
}
