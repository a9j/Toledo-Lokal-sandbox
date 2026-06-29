import {
  ExternalLink, Phone, Navigation, Menu as MenuIcon, Calendar, Scissors, ShoppingBag,
  FileText, Hammer, HandHeart, HeartHandshake, Baby, Truck, Route as RouteIcon,
  Palette, Dumbbell, MapPin, Bookmark, Share2, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BusinessCategory, ProfileModuleContent } from './profile-modules';
import { getVisitAction, openVisitAction } from './visit-link';

export type ProfileTab = 'today' | 'menu' | 'pulse' | 'rewards' | 'community' | 'photos' | 'about';

export const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'menu', label: 'Menu' },
  { id: 'pulse', label: 'Pulse' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'community', label: 'Community' },
  { id: 'photos', label: 'Photos' },
  { id: 'about', label: 'About' },
];

export const FOOD_BUSINESS_CATEGORIES: BusinessCategory[] = ['restaurant', 'food_truck'];

export type ActionKind =
  | 'visit' | 'menu' | 'call' | 'directions' | 'book' | 'services' | 'quote'
  | 'projects' | 'volunteer' | 'donate' | 'needs' | 'event' | 'tour' | 'age_groups'
  | 'find_truck' | 'route' | 'shop' | 'portfolio' | 'classes' | 'inquiry'
  | 'follow' | 'save' | 'share';

export const ACTION_META: Record<ActionKind, { label: string; icon: LucideIcon }> = {
  visit: { label: 'Visit', icon: ExternalLink },
  menu: { label: 'View Menu', icon: MenuIcon },
  call: { label: 'Call', icon: Phone },
  directions: { label: 'Get Directions', icon: Navigation },
  book: { label: 'Book', icon: Calendar },
  services: { label: 'View Services', icon: Scissors },
  quote: { label: 'Request Quote', icon: FileText },
  projects: { label: 'See Projects', icon: Hammer },
  volunteer: { label: 'Volunteer', icon: HandHeart },
  donate: { label: 'Donate', icon: HeartHandshake },
  needs: { label: 'View Needs', icon: HandHeart },
  event: { label: 'Attend Event', icon: Calendar },
  tour: { label: 'Request Tour', icon: Baby },
  age_groups: { label: 'View Age Groups', icon: Users },
  find_truck: { label: 'Find Truck', icon: Truck },
  route: { label: 'View Route', icon: RouteIcon },
  shop: { label: 'Shop', icon: ShoppingBag },
  portfolio: { label: 'View Portfolio', icon: Palette },
  classes: { label: 'View Classes', icon: Dumbbell },
  inquiry: { label: 'Inquiry', icon: MapPin },
  follow: { label: 'Follow', icon: Bookmark },
  save: { label: 'Save', icon: Bookmark },
  share: { label: 'Share', icon: Share2 },
};

export interface BusinessTypeConfig {
  primaryAction: ActionKind;
  secondaryAction: ActionKind;
  mediaLabel: string;
  liveStatus: string[]; // hero "live status" fallbacks, in priority order
}

export const BUSINESS_TYPE_CONFIG: Record<BusinessCategory, BusinessTypeConfig> = {
  restaurant: { primaryAction: 'visit', secondaryAction: 'menu', mediaLabel: 'Food & Atmosphere', liveStatus: ['Fresh special today', 'Lunch rush starts soon', 'Double points tonight'] },
  food_truck: { primaryAction: 'find_truck', secondaryAction: 'route', mediaLabel: 'Food & Route', liveStatus: ['At current location now', 'Next stop posted', 'Route updated today'] },
  retail: { primaryAction: 'visit', secondaryAction: 'shop', mediaLabel: 'Products & Store', liveStatus: ['New arrivals this week', 'Local maker featured', 'In-store event soon'] },
  salon_barber: { primaryAction: 'book', secondaryAction: 'services', mediaLabel: 'Styles & Results', liveStatus: ['Appointments available today', 'Popular service this week', 'New openings added'] },
  gym_fitness: { primaryAction: 'classes', secondaryAction: 'call', mediaLabel: 'Inside the Gym', liveStatus: ['Classes running today', 'New trial offer', 'Community challenge live'] },
  contractor_service: { primaryAction: 'quote', secondaryAction: 'projects', mediaLabel: 'Projects & Before/After', liveStatus: ['Free quotes available', 'Serving Toledo this week', 'Recent project added'] },
  nonprofit: { primaryAction: 'volunteer', secondaryAction: 'donate', mediaLabel: 'Community Moments', liveStatus: ['Volunteers needed', 'Donation goal active', 'Community event soon'] },
  childcare: { primaryAction: 'tour', secondaryAction: 'call', mediaLabel: 'Our Space', liveStatus: ['Openings available', 'Tours this week', 'Now enrolling'] },
  artist_maker: { primaryAction: 'portfolio', secondaryAction: 'shop', mediaLabel: 'Portfolio & Work', liveStatus: ['New work added', 'Taking commissions', 'Upcoming show'] },
  event_venue: { primaryAction: 'inquiry', secondaryAction: 'directions', mediaLabel: 'The Space', liveStatus: ['Dates available', 'Upcoming event', 'Now booking'] },
  professional_service: { primaryAction: 'book', secondaryAction: 'call', mediaLabel: 'Our Work', liveStatus: ['Accepting new clients', 'Free consultation', 'Serving Toledo'] },
  community_org: { primaryAction: 'volunteer', secondaryAction: 'event', mediaLabel: 'Community Moments', liveStatus: ['Get involved this week', 'Upcoming meeting', 'New initiative'] },
};

const NONPROFIT_PROFILE_CATEGORIES: BusinessCategory[] = ['nonprofit', 'community_org'];

const ACCOUNT_TYPE_SUGGESTIONS: Record<string, string[]> = {
  nonprofit: [
    'Adoptable pet of the day',
    'Volunteer shifts open',
    'Donation match active',
    'Upcoming community event',
    'Spay/neuter clinic openings',
  ],
  for_profit: [
    'Fresh special today',
    'Lunch rush starts soon',
    'Double points tonight',
  ],
};

export function resolveLiveStatus(business: {
  profileCategory: BusinessCategory;
  isNonprofit: boolean;
}): string[] {
  if (NONPROFIT_PROFILE_CATEGORIES.includes(business.profileCategory) || business.isNonprofit) {
    return ACCOUNT_TYPE_SUGGESTIONS.nonprofit;
  }
  return BUSINESS_TYPE_CONFIG[business.profileCategory]?.liveStatus ?? ACCOUNT_TYPE_SUGGESTIONS.for_profit;
}

export interface ProfileActionContext {
  onSave: () => void;
  onShare: () => void;
  isSaved: boolean;
  setTab: (tab: ProfileTab) => void;
}

export interface ResolvedAction {
  kind: ActionKind;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface ActionBusiness {
  phone?: string | null;
  address?: string | null;
  website?: string | null;
  visit_link_type?: string | null;
  visit_link_url?: string | null;
}

const normalizeUrl = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
const openUrl = (url: string) => window.open(normalizeUrl(url), '_blank');
const openTel = (phone: string) => { window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`; };
const openDirections = (address: string) =>
  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');

// Text value of a module field (images return ''), e.g. fieldValue(content, 'restaurant_menu', 'url').
const fieldValue = (content: ProfileModuleContent, moduleId: string, key: string) => {
  const v = content[moduleId]?.[key];
  return typeof v === 'string' ? v.trim() : '';
};

// Resolve a single action to a label/icon/onClick, or null when it has no
// usable target for this business (e.g. "Call" with no phone number).
export function resolveAction(
  kind: ActionKind,
  business: ActionBusiness,
  content: ProfileModuleContent,
  ctx: ProfileActionContext,
): ResolvedAction | null {
  const meta = ACTION_META[kind];
  const make = (onClick: () => void): ResolvedAction => ({ kind, label: meta.label, icon: meta.icon, onClick });

  const linkOrPhone = (moduleId: string) => {
    const url = fieldValue(content, moduleId, 'url');
    if (url) return () => openUrl(url);
    const phone = fieldValue(content, moduleId, 'phone') || business.phone;
    if (phone) return () => openTel(phone);
    return null;
  };

  switch (kind) {
    case 'visit': {
      const a = getVisitAction(business);
      return a ? make(() => openVisitAction(a)) : null;
    }
    case 'call':
      return business.phone ? make(() => openTel(business.phone!)) : null;
    case 'directions':
      return business.address ? make(() => openDirections(business.address!)) : null;
    case 'menu': {
      return make(() => ctx.setTab('menu'));
    }
    case 'shop': {
      const a = getVisitAction(business);
      return a ? make(() => openVisitAction(a)) : null;
    }
    case 'quote': { const run = linkOrPhone('contractor_service_request_quote'); return make(run ?? (() => ctx.setTab('about'))); }
    case 'tour': { const run = linkOrPhone('childcare_tour'); return make(run ?? (() => ctx.setTab('about'))); }
    case 'inquiry': { const run = linkOrPhone('event_venue_booking'); return make(run ?? (() => ctx.setTab('about'))); }
    case 'book': {
      const run = linkOrPhone('professional_service_consult');
      if (run) return make(run);
      const a = getVisitAction(business);
      if (a && business.visit_link_type === 'booking') return make(() => openVisitAction(a));
      return business.phone ? make(() => openTel(business.phone!)) : make(() => ctx.setTab('about'));
    }
    case 'volunteer': {
      const url = fieldValue(content, 'nonprofit_volunteer', 'url');
      return make(url ? () => openUrl(url) : () => ctx.setTab('today'));
    }
    case 'donate': {
      const url = fieldValue(content, 'nonprofit_donation_goal', 'url');
      return make(url ? () => openUrl(url) : () => ctx.setTab('community'));
    }
    case 'find_truck':
      return business.address ? make(() => openDirections(business.address!)) : make(() => ctx.setTab('today'));
    case 'services': return make(() => ctx.setTab('about'));
    case 'classes': return make(() => ctx.setTab('today'));
    case 'needs':
    case 'route':
    case 'event': return make(() => ctx.setTab('today'));
    case 'age_groups': return make(() => ctx.setTab('about'));
    case 'projects':
    case 'portfolio': return make(() => ctx.setTab('photos'));
    case 'save':
    case 'follow': return make(ctx.onSave);
    case 'share': return make(ctx.onShare);
    default: return null;
  }
}

export function resolveActions(
  kinds: ActionKind[],
  business: ActionBusiness,
  content: ProfileModuleContent,
  ctx: ProfileActionContext,
): ResolvedAction[] {
  const seen = new Set<ActionKind>();
  const out: ResolvedAction[] = [];
  for (const kind of kinds) {
    if (seen.has(kind)) continue;
    seen.add(kind);
    const resolved = resolveAction(kind, business, content, ctx);
    if (resolved) out.push(resolved);
  }
  return out;
}
