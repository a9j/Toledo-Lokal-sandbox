// Configurable "Visit" button: businesses pick a destination type + URL, and the
// button label/behavior follow that choice. Falls back to the website (then
// directions) when nothing is configured.

export type VisitLinkType =
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'google_maps'
  | 'phone'
  | 'menu'
  | 'booking'
  | 'order_online';

export const VISIT_LINK_OPTIONS: { value: VisitLinkType; label: string }[] = [
  { value: 'website', label: 'Visit Website' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'google_maps', label: 'Directions' },
  { value: 'phone', label: 'Call' },
  { value: 'menu', label: 'View Menu' },
  { value: 'booking', label: 'Book Now' },
  { value: 'order_online', label: 'Order Online' },
];

const VISIT_LABELS: Record<VisitLinkType, string> = VISIT_LINK_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<VisitLinkType, string>,
);

export interface VisitConfigInput {
  visit_link_type?: string | null;
  visit_link_url?: string | null;
  website?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface VisitAction {
  label: string;
  href: string;
  // tel: links open in the same tab; everything else opens in a new tab.
  isPhone: boolean;
}

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function directionsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function getVisitAction(b: VisitConfigInput): VisitAction | null {
  const type = (b.visit_link_type || '').trim() as VisitLinkType | '';
  const url = (b.visit_link_url || '').trim();

  if (type === 'phone') {
    const num = url || (b.phone || '').trim();
    if (num) return { label: VISIT_LABELS.phone, href: `tel:${num}`, isPhone: true };
  } else if (type === 'google_maps') {
    const dest = url || (b.address || '').trim();
    if (dest) {
      const href = /^https?:\/\//i.test(dest) ? dest : directionsHref(dest);
      return { label: VISIT_LABELS.google_maps, href, isPhone: false };
    }
  } else if (type && url) {
    return { label: VISIT_LABELS[type] ?? VISIT_LABELS.website, href: normalizeUrl(url), isPhone: false };
  }

  // Fallback 1: website
  const website = (b.website || '').trim();
  if (website) return { label: VISIT_LABELS.website, href: normalizeUrl(website), isPhone: false };

  // Fallback 2: directions, so the button is never a dead end
  const address = (b.address || '').trim();
  if (address) return { label: VISIT_LABELS.google_maps, href: directionsHref(address), isPhone: false };

  return null;
}

// Convenience for click handlers (mirrors window.open / location.href behavior used across the app).
export function openVisitAction(action: VisitAction): void {
  if (action.isPhone) {
    window.location.href = action.href;
  } else {
    window.open(action.href, '_blank');
  }
}
