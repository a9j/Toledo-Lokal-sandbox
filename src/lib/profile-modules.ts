// Flexible business profile system.
//
// Profiles are NOT restaurant-specific. Every business has the same fixed shell
// of sections; which module cards appear inside each section is driven by the
// business's `category`. Each module is a descriptor (not a bespoke component):
// an id, the section it lives in, the categories it applies to, and the content
// fields a business fills in. One shared <ModuleCard> renders them all, and the
// content is stored per-business in the `profile_modules` JSONB column keyed by
// module id. v1 is purely editable content — no live integrations.

export type BusinessCategory =
  | 'restaurant'
  | 'food_truck'
  | 'retail'
  | 'salon_barber'
  | 'gym_fitness'
  | 'contractor_service'
  | 'nonprofit'
  | 'childcare'
  | 'artist_maker'
  | 'event_venue'
  | 'professional_service'
  | 'community_org';

export const BUSINESS_CATEGORY_OPTIONS: { value: BusinessCategory; label: string }[] = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'food_truck', label: 'Food Truck' },
  { value: 'retail', label: 'Retail Shop' },
  { value: 'salon_barber', label: 'Salon / Barber' },
  { value: 'gym_fitness', label: 'Gym / Fitness' },
  { value: 'contractor_service', label: 'Contractor / Service Provider' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'childcare', label: 'Childcare' },
  { value: 'artist_maker', label: 'Artist / Maker' },
  { value: 'event_venue', label: 'Event Venue' },
  { value: 'professional_service', label: 'Professional Service' },
  { value: 'community_org', label: 'Community Organization' },
];

// Fixed shell sections, in render order.
export type ProfileSection =
  | 'hero'
  | 'today'
  | 'pulse'
  | 'rewards'
  | 'community_impact'
  | 'photos'
  | 'about'
  | 'contact';

export const PROFILE_SECTION_ORDER: ProfileSection[] = [
  'hero',
  'today',
  'pulse',
  'rewards',
  'community_impact',
  'photos',
  'about',
  'contact',
];

export const PROFILE_SECTION_LABELS: Record<ProfileSection, string> = {
  hero: 'Overview',
  today: 'Today',
  pulse: 'Pulse',
  rewards: 'Rewards & Engagement',
  community_impact: 'Community Impact',
  photos: 'Photos',
  about: 'About',
  contact: 'Contact & Actions',
};

export type ModuleFieldType = 'text' | 'textarea' | 'url' | 'tel' | 'date' | 'time';

export interface ModuleField {
  key: string;
  label: string;
  type: ModuleFieldType;
  placeholder?: string;
}

export interface ProfileModule {
  id: string;
  title: string;
  section: ProfileSection;
  categories: BusinessCategory[];
  fields: ModuleField[];
}

// Stored shape of businesses.profile_modules: { [moduleId]: { [fieldKey]: value } }
export type ProfileModuleContent = Record<string, Record<string, string>>;

const t = (key: string, label: string, placeholder?: string): ModuleField => ({ key, label, type: 'text', placeholder });
const area = (key: string, label: string, placeholder?: string): ModuleField => ({ key, label, type: 'textarea', placeholder });
const link = (key: string, label: string, placeholder = 'https://...'): ModuleField => ({ key, label, type: 'url', placeholder });

export const PROFILE_MODULES: ProfileModule[] = [
  // ── Restaurant ──
  { id: 'restaurant_todays_special', title: "Today's Special", section: 'today', categories: ['restaurant'], fields: [area('text', "Today's special")] },
  { id: 'restaurant_pickup_wait', title: 'Pickup / Wait Time', section: 'today', categories: ['restaurant'], fields: [t('text', 'Current wait or pickup time', 'e.g. ~15 min')] },
  { id: 'restaurant_popular_item', title: 'Popular Item', section: 'pulse', categories: ['restaurant'], fields: [t('name', 'Item name'), area('note', 'Why people love it')] },
  { id: 'restaurant_menu', title: 'Menu', section: 'contact', categories: ['restaurant'], fields: [link('url', 'Menu link')] },
  { id: 'restaurant_dining_vibe', title: 'Dining Vibe', section: 'about', categories: ['restaurant'], fields: [area('text', 'Describe the atmosphere')] },

  // ── Food truck ──
  { id: 'food_truck_current_location', title: 'Current Location', section: 'today', categories: ['food_truck'], fields: [t('text', "Where you're parked now")] },
  { id: 'food_truck_todays_route', title: "Today's Route", section: 'today', categories: ['food_truck'], fields: [area('text', "Today's stops & times")] },
  { id: 'food_truck_next_stop', title: 'Next Stop', section: 'today', categories: ['food_truck'], fields: [t('text', 'Next location'), t('time', 'Arrival time')] },
  { id: 'food_truck_live_status', title: 'Live Status', section: 'today', categories: ['food_truck'], fields: [t('text', 'Open / closed / sold out')] },
  { id: 'food_truck_menu_highlights', title: 'Menu Highlights', section: 'pulse', categories: ['food_truck'], fields: [area('text', 'Signature items')] },

  // ── Retail shop ──
  { id: 'retail_new_arrivals', title: 'New Arrivals', section: 'today', categories: ['retail'], fields: [area('text', "What's new in store")] },
  { id: 'retail_in_store_event', title: 'In-Store Event', section: 'today', categories: ['retail'], fields: [t('title', 'Event'), { key: 'date', label: 'Date', type: 'date' }, area('note', 'Details')] },
  { id: 'retail_featured_product', title: 'Featured Product', section: 'pulse', categories: ['retail'], fields: [t('name', 'Product'), t('price', 'Price'), area('note', 'Details')] },
  { id: 'retail_inventory_highlight', title: 'Inventory Highlight', section: 'pulse', categories: ['retail'], fields: [area('text', "What's in stock now")] },
  { id: 'retail_local_maker', title: 'Local Maker Spotlight', section: 'community_impact', categories: ['retail'], fields: [t('name', 'Maker / brand'), area('note', 'Their story')] },

  // ── Salon / Barber ──
  { id: 'salon_barber_next_appt', title: 'Next Available Appointment', section: 'today', categories: ['salon_barber'], fields: [t('text', 'Next opening', 'e.g. Today 3:30pm')] },
  { id: 'salon_barber_featured_service', title: 'Featured Service', section: 'today', categories: ['salon_barber'], fields: [t('service', 'Service'), t('price', 'Price')] },
  { id: 'salon_barber_staff_spotlight', title: 'Staff Spotlight', section: 'pulse', categories: ['salon_barber'], fields: [t('name', 'Name'), t('role', 'Role / specialty'), area('note', 'About them')] },
  { id: 'salon_barber_rebooking', title: 'Rebooking Reminder', section: 'rewards', categories: ['salon_barber'], fields: [area('text', 'Rebooking message')] },
  { id: 'salon_barber_style_gallery', title: 'Style Gallery', section: 'photos', categories: ['salon_barber'], fields: [area('caption', 'What to look for in your gallery')] },

  // ── Gym / Fitness ──
  { id: 'gym_fitness_todays_classes', title: "Today's Classes", section: 'today', categories: ['gym_fitness'], fields: [area('text', "Today's schedule")] },
  { id: 'gym_fitness_featured_class', title: 'Featured Class', section: 'today', categories: ['gym_fitness'], fields: [t('name', 'Class'), t('time', 'Time')] },
  { id: 'gym_fitness_trainer_spotlight', title: 'Trainer Spotlight', section: 'pulse', categories: ['gym_fitness'], fields: [t('name', 'Trainer'), area('note', 'Specialty / bio')] },
  { id: 'gym_fitness_membership_offer', title: 'Membership Offer', section: 'rewards', categories: ['gym_fitness'], fields: [area('text', 'Current offer')] },
  { id: 'gym_fitness_facility_highlights', title: 'Facility Highlights', section: 'about', categories: ['gym_fitness'], fields: [area('text', 'Equipment & amenities')] },

  // ── Contractor / Service provider ──
  { id: 'contractor_service_emergency', title: 'Emergency Availability', section: 'today', categories: ['contractor_service'], fields: [t('text', 'Availability', 'e.g. 24/7 emergency calls')] },
  { id: 'contractor_service_recent_project', title: 'Recent Project', section: 'pulse', categories: ['contractor_service'], fields: [t('title', 'Project'), area('note', 'What you did')] },
  { id: 'contractor_service_before_after', title: 'Before / After', section: 'photos', categories: ['contractor_service'], fields: [area('caption', 'Describe the transformation')] },
  { id: 'contractor_service_service_area', title: 'Service Area', section: 'about', categories: ['contractor_service'], fields: [t('text', 'Areas you serve')] },
  { id: 'contractor_service_certifications', title: 'Certifications', section: 'about', categories: ['contractor_service'], fields: [area('text', 'Licenses & certifications')] },
  { id: 'contractor_service_request_quote', title: 'Request a Quote', section: 'contact', categories: ['contractor_service'], fields: [link('url', 'Quote request link'), t('phone', 'Or phone number')] },

  // ── Nonprofit ──
  { id: 'nonprofit_current_need', title: 'Current Need', section: 'today', categories: ['nonprofit'], fields: [area('text', 'What you need right now')] },
  { id: 'nonprofit_volunteer', title: 'Volunteer Opportunity', section: 'today', categories: ['nonprofit'], fields: [t('title', 'Opportunity'), area('note', 'Details'), link('url', 'Sign-up link')] },
  { id: 'nonprofit_upcoming_event', title: 'Upcoming Event', section: 'today', categories: ['nonprofit'], fields: [t('title', 'Event'), { key: 'date', label: 'Date', type: 'date' }, area('note', 'Details')] },
  { id: 'nonprofit_donation_goal', title: 'Donation Goal', section: 'community_impact', categories: ['nonprofit'], fields: [t('goal', 'Goal', 'e.g. $10,000'), t('raised', 'Raised so far'), link('url', 'Donate link')] },
  { id: 'nonprofit_impact', title: 'Community Impact', section: 'community_impact', categories: ['nonprofit'], fields: [area('text', 'Your impact this year')] },

  // ── Childcare ──
  { id: 'childcare_availability', title: 'Availability', section: 'today', categories: ['childcare'], fields: [t('text', 'Current openings')] },
  { id: 'childcare_parent_notes', title: 'Parent Notes', section: 'pulse', categories: ['childcare'], fields: [area('text', 'Notes for parents')] },
  { id: 'childcare_age_groups', title: 'Age Groups', section: 'about', categories: ['childcare'], fields: [t('text', 'Ages served', 'e.g. 6 weeks – 5 yrs')] },
  { id: 'childcare_safety', title: 'Safety Highlights', section: 'about', categories: ['childcare'], fields: [area('text', 'Safety & accreditation')] },
  { id: 'childcare_tour', title: 'Request a Tour', section: 'contact', categories: ['childcare'], fields: [link('url', 'Tour request link'), t('phone', 'Or phone number')] },

  // ── Artist / Maker ──
  { id: 'artist_maker_current_work', title: 'Current Work', section: 'today', categories: ['artist_maker'], fields: [t('title', 'What you’re working on'), area('note', 'Details')] },
  { id: 'artist_maker_featured_piece', title: 'Featured Piece', section: 'pulse', categories: ['artist_maker'], fields: [t('title', 'Piece'), t('price', 'Price'), area('note', 'About it')] },
  { id: 'artist_maker_process', title: 'Process & Materials', section: 'about', categories: ['artist_maker'], fields: [area('text', 'How you work')] },
  { id: 'artist_maker_studio_gallery', title: 'Studio Gallery', section: 'photos', categories: ['artist_maker'], fields: [area('caption', 'About your gallery')] },
  { id: 'artist_maker_commission', title: 'Commission / Buy', section: 'contact', categories: ['artist_maker'], fields: [link('url', 'Commission or shop link'), area('note', 'How to commission')] },

  // ── Event venue ──
  { id: 'event_venue_upcoming', title: 'Upcoming Event', section: 'today', categories: ['event_venue'], fields: [t('title', 'Event'), { key: 'date', label: 'Date', type: 'date' }, area('note', 'Details')] },
  { id: 'event_venue_availability', title: 'Availability', section: 'today', categories: ['event_venue'], fields: [t('text', 'Open dates')] },
  { id: 'event_venue_capacity', title: 'Capacity & Layout', section: 'about', categories: ['event_venue'], fields: [area('text', 'Capacity, rooms, layout')] },
  { id: 'event_venue_gallery', title: 'Space Gallery', section: 'photos', categories: ['event_venue'], fields: [area('caption', 'About your space photos')] },
  { id: 'event_venue_booking', title: 'Booking Inquiry', section: 'contact', categories: ['event_venue'], fields: [link('url', 'Booking link'), t('phone', 'Or phone number')] },

  // ── Professional service ──
  { id: 'professional_service_availability', title: 'Availability', section: 'today', categories: ['professional_service'], fields: [t('text', 'Accepting new clients?')] },
  { id: 'professional_service_featured', title: 'Featured Service', section: 'pulse', categories: ['professional_service'], fields: [t('name', 'Service'), area('note', 'Details')] },
  { id: 'professional_service_credentials', title: 'Credentials', section: 'about', categories: ['professional_service'], fields: [area('text', 'Licenses, degrees, experience')] },
  { id: 'professional_service_area', title: 'Service Area', section: 'about', categories: ['professional_service'], fields: [t('text', 'Who / where you serve')] },
  { id: 'professional_service_consult', title: 'Book a Consultation', section: 'contact', categories: ['professional_service'], fields: [link('url', 'Booking link'), t('phone', 'Or phone number')] },

  // ── Community organization ──
  { id: 'community_org_initiative', title: 'Current Initiative', section: 'today', categories: ['community_org'], fields: [area('text', "What you're working on")] },
  { id: 'community_org_get_involved', title: 'Get Involved', section: 'today', categories: ['community_org'], fields: [t('title', 'How to help'), link('url', 'Sign-up link')] },
  { id: 'community_org_event', title: 'Upcoming Event', section: 'today', categories: ['community_org'], fields: [t('title', 'Event'), { key: 'date', label: 'Date', type: 'date' }, area('note', 'Details')] },
  { id: 'community_org_impact', title: 'Community Impact', section: 'community_impact', categories: ['community_org'], fields: [area('text', 'Your impact')] },
  { id: 'community_org_meeting', title: 'Meeting Info', section: 'about', categories: ['community_org'], fields: [area('text', 'When & where you meet')] },
];

export function isBusinessCategory(value: unknown): value is BusinessCategory {
  return typeof value === 'string' && BUSINESS_CATEGORY_OPTIONS.some((o) => o.value === value);
}

export function getModulesForCategory(category: BusinessCategory): ProfileModule[] {
  return PROFILE_MODULES.filter((m) => m.categories.includes(category));
}

export function moduleHasContent(values: Record<string, string> | undefined): boolean {
  return !!values && Object.values(values).some((v) => typeof v === 'string' && v.trim().length > 0);
}

// Modules for a category that the business has actually filled in.
export function getFilledModules(category: BusinessCategory, content: ProfileModuleContent): ProfileModule[] {
  return getModulesForCategory(category).filter((m) => moduleHasContent(content[m.id]));
}

export function categoryHasModuleContent(category: BusinessCategory, content: ProfileModuleContent): boolean {
  return getFilledModules(category, content).length > 0;
}

export function getFilledModulesForSection(
  category: BusinessCategory,
  content: ProfileModuleContent,
  section: ProfileSection,
): ProfileModule[] {
  return getFilledModules(category, content).filter((m) => m.section === section);
}

// Parse the raw JSONB value into a typed content map (defensive).
export function parseModuleContent(raw: unknown): ProfileModuleContent {
  if (!raw || typeof raw !== 'object') return {};
  const out: ProfileModuleContent = {};
  for (const [moduleId, fields] of Object.entries(raw as Record<string, unknown>)) {
    if (fields && typeof fields === 'object') {
      const values: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields as Record<string, unknown>)) {
        if (typeof v === 'string') values[k] = v;
      }
      out[moduleId] = values;
    }
  }
  return out;
}
