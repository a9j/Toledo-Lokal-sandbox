import { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

// Capabilities the admin console gates on. App-level for now; can be enforced
// in RLS later without changing call sites.
export type Capability =
  | 'manage_businesses'
  | 'approve_content'
  | 'moderate'
  | 'manage_users'
  | 'manage_roles'
  | 'manage_rewards'
  | 'manage_events'
  | 'manage_nonprofits'
  | 'send_announcements'
  | 'manage_white_label'
  | 'view_analytics'
  | 'onboard_businesses';

export const CAPABILITY_LABELS: Record<Capability, string> = {
  manage_businesses: 'Manage businesses',
  approve_content: 'Approve content',
  moderate: 'Moderate reports & content',
  manage_users: 'Manage users',
  manage_roles: 'Assign roles',
  manage_rewards: 'Manage rewards & campaigns',
  manage_events: 'Manage events',
  manage_nonprofits: 'Manage nonprofits',
  send_announcements: 'Send announcements',
  manage_white_label: 'Manage cities (white-label)',
  view_analytics: 'View analytics',
  onboard_businesses: 'Onboard businesses',
};

export const ROLE_LABELS: Partial<Record<AppRole, string>> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  city_admin: 'City Admin',
  moderator: 'Moderator',
  support_staff: 'Support Staff',
  ambassador: 'Ambassador',
  organizer: 'Event Organizer',
  nonprofit: 'Nonprofit Manager',
  connector: 'Connector',
  business: 'Business',
  partner: 'Partner',
  resident: 'Resident',
};

const ALL_CAPABILITIES: Capability[] = Object.keys(CAPABILITY_LABELS) as Capability[];

// Role → capabilities. super_admin/admin get everything.
export const ROLE_CAPABILITIES: Partial<Record<AppRole, Capability[]>> = {
  super_admin: ALL_CAPABILITIES,
  admin: ALL_CAPABILITIES,
  city_admin: ['manage_businesses', 'approve_content', 'manage_events', 'manage_nonprofits', 'send_announcements', 'view_analytics', 'onboard_businesses'],
  moderator: ['moderate', 'approve_content'],
  support_staff: ['manage_users', 'view_analytics'],
  ambassador: ['onboard_businesses', 'view_analytics'],
  organizer: ['manage_events'],
  nonprofit: ['manage_nonprofits'],
};

// Roles the console lets admins assign/revoke (in display order).
export const MANAGEABLE_ROLES: AppRole[] = [
  'super_admin', 'admin', 'city_admin', 'moderator', 'support_staff', 'ambassador', 'organizer',
];

export function capabilitiesFor(roles: AppRole[]): Set<Capability> {
  const caps = new Set<Capability>();
  for (const role of roles) {
    for (const cap of ROLE_CAPABILITIES[role] ?? []) caps.add(cap);
  }
  return caps;
}

export function can(roles: AppRole[], capability: Capability): boolean {
  return (roles ?? []).some((role) => (ROLE_CAPABILITIES[role] ?? []).includes(capability));
}
