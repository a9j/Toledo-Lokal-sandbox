import { describe, it, expect } from 'vitest';
import { can, roleRank, isOwnerOrAdmin, canEdit, type BusinessRole } from './businessPermissions';

describe('business role hierarchy', () => {
  it('ranks roles owner > admin > manager > hiring > viewer > staff', () => {
    const order: BusinessRole[] = ['owner', 'admin', 'manager', 'hiring', 'viewer', 'staff'];
    for (let i = 0; i < order.length - 1; i++) {
      expect(roleRank(order[i])).toBeGreaterThan(roleRank(order[i + 1]));
    }
  });

  it('treats null/undefined as no access', () => {
    expect(roleRank(null)).toBe(0);
    expect(can('edit_profile', null)).toBe(false);
    expect(can('delete_business', undefined)).toBe(false);
  });
});

describe('owner-only powers (delete / owner assignment / tier / staff)', () => {
  const ownerOnly = ['delete_business', 'assign_owner', 'transfer_ownership', 'change_tier', 'manage_staff'] as const;

  it('allows owner and admin', () => {
    for (const action of ownerOnly) {
      expect(can(action, 'owner')).toBe(true);
      expect(can(action, 'admin')).toBe(true);
    }
  });

  it('denies manager and below', () => {
    for (const action of ownerOnly) {
      expect(can(action, 'manager')).toBe(false);
      expect(can(action, 'hiring')).toBe(false);
      expect(can(action, 'viewer')).toBe(false);
      expect(can(action, 'staff')).toBe(false);
    }
  });
});

describe('manager edit access (profile / story / jobs / offers / loop)', () => {
  const editable = ['edit_profile', 'edit_story', 'manage_jobs', 'manage_offers', 'manage_loop'] as const;

  it('grants manager full edit access by default', () => {
    for (const action of editable) {
      expect(can(action, 'manager')).toBe(true);
      expect(can(action, 'owner')).toBe(true);
      expect(can(action, 'admin')).toBe(true);
    }
  });

  it('denies edit access to hiring / viewer / staff', () => {
    for (const action of editable) {
      expect(can(action, 'hiring')).toBe(false);
      expect(can(action, 'viewer')).toBe(false);
      expect(can(action, 'staff')).toBe(false);
    }
  });
});

describe('convenience helpers', () => {
  it('isOwnerOrAdmin is true only for owner/admin', () => {
    expect(isOwnerOrAdmin('owner')).toBe(true);
    expect(isOwnerOrAdmin('admin')).toBe(true);
    expect(isOwnerOrAdmin('manager')).toBe(false);
    expect(isOwnerOrAdmin(null)).toBe(false);
  });

  it('canEdit is true for manager and above', () => {
    expect(canEdit('manager')).toBe(true);
    expect(canEdit('admin')).toBe(true);
    expect(canEdit('owner')).toBe(true);
    expect(canEdit('hiring')).toBe(false);
    expect(canEdit('viewer')).toBe(false);
  });
});
