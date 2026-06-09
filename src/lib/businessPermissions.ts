// Effective-role + capability gating for a business.
//
// Mirrors the server-side hierarchy created in 20260609120000_manager_first_claim.sql:
//   owner > admin > manager > hiring > viewer  ('staff' is legacy scanner-only)
//
// The source of truth for authorization is RLS + the SECURITY DEFINER RPCs; this
// module is the matching client-side gate so the UI hides what the server would
// reject (delete business, owner-role assignment, tier/founding changes).

export type BusinessRole =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'hiring'
  | 'viewer'
  | 'staff';

export const ROLE_RANK: Record<BusinessRole, number> = {
  owner: 100,
  admin: 80,
  manager: 60,
  hiring: 40,
  viewer: 20,
  staff: 10,
};

export function roleRank(role: BusinessRole | null | undefined): number {
  return role ? ROLE_RANK[role] ?? 0 : 0;
}

/** Actions the UI gates on. Owner-only powers are explicitly the ones the
 *  server keeps owner/admin-only: delete, owner assignment, tier changes. */
export type BusinessAction =
  | 'edit_profile'
  | 'edit_story'
  | 'manage_jobs'
  | 'manage_offers'
  | 'manage_loop'
  | 'manage_staff'
  | 'delete_business'
  | 'assign_owner'
  | 'transfer_ownership'
  | 'change_tier';

// Owner or admin only — the powers a manager must never have.
const OWNER_OR_ADMIN: ReadonlySet<BusinessAction> = new Set([
  'manage_staff',
  'delete_business',
  'assign_owner',
  'transfer_ownership',
  'change_tier',
]);

// Manager and above get full edit access to profile / story / jobs / offers / loop.
const MANAGER_AND_UP: ReadonlySet<BusinessAction> = new Set([
  'edit_profile',
  'edit_story',
  'manage_jobs',
  'manage_offers',
  'manage_loop',
]);

/** Does a user with `role` have permission for `action`? */
export function can(action: BusinessAction, role: BusinessRole | null | undefined): boolean {
  if (!role) return false;
  if (OWNER_OR_ADMIN.has(action)) {
    return role === 'owner' || role === 'admin';
  }
  if (MANAGER_AND_UP.has(action)) {
    return roleRank(role) >= ROLE_RANK.manager;
  }
  return false;
}

export const isOwner = (role: BusinessRole | null | undefined) => role === 'owner';
export const isManager = (role: BusinessRole | null | undefined) => role === 'manager';
/** Owner or admin — can do the owner-only powers (delete / transfer / tier). */
export const isOwnerOrAdmin = (role: BusinessRole | null | undefined) =>
  role === 'owner' || role === 'admin';
/** Can edit the profile at all (manager+). */
export const canEdit = (role: BusinessRole | null | undefined) =>
  roleRank(role) >= ROLE_RANK.manager;
