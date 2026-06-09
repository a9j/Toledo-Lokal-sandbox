import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Client wrappers around the manager-first / owner-claim server actions
// (SECURITY DEFINER RPCs from 20260609120000_manager_first_claim.sql).

export interface DuplicateMatch {
  id: string;
  name: string;
  address: string | null;
  street_address: string | null;
  has_owner: boolean;
  has_manager: boolean;
  status: string;
}

export type VerificationMethod =
  | 'email_domain'
  | 'manual_confirmation'
  | 'manager_approval'
  | 'admin_approval';

export interface ClaimResult {
  status: 'approved' | 'pending' | 'already_owner';
  auto?: boolean;
  claim_id?: string;
  business_id: string;
  requires?: 'manager_or_admin_approval' | 'admin_approval';
}

/** Look up businesses matching a normalized name (+ optional street). Surfaces
 *  matches the user couldn't otherwise see (pending / owned by others). */
export async function findDuplicateBusiness(
  name: string,
  street?: string | null,
): Promise<DuplicateMatch[]> {
  if (!name?.trim()) return [];
  const { data, error } = await supabase.rpc('find_duplicate_business', {
    p_name: name,
    p_street: street ?? undefined,
  });
  if (error) throw error;
  return (data as DuplicateMatch[]) ?? [];
}

/** Create a business with an empty owner seat, attaching the caller as manager. */
export async function createManagedBusiness(args: {
  name: string;
  description?: string | null;
  categoryId?: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_managed_business', {
    p_name: args.name,
    p_description: args.description ?? undefined,
    p_category_id: args.categoryId ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

/** Claim the owner seat of an existing (ownerless) business. */
export async function claimOwnership(
  businessId: string,
  verificationMethod: VerificationMethod = 'manual_confirmation',
): Promise<ClaimResult> {
  const { data, error } = await supabase.rpc('claim_ownership', {
    p_business_id: businessId,
    p_verification_method: verificationMethod,
  });
  if (error) throw error;
  return data as unknown as ClaimResult;
}

/** Approve or reject a pending claim (owner / existing manager / platform admin). */
export async function resolveClaim(
  claimId: string,
  approve: boolean,
): Promise<{ status: 'approved' | 'rejected'; business_id: string }> {
  const { data, error } = await supabase.rpc('approve_claim', {
    p_claim_id: claimId,
    p_approve: approve,
  });
  if (error) throw error;
  return data as unknown as { status: 'approved' | 'rejected'; business_id: string };
}

/** Transfer the owner seat to another user (current owner / platform admin). */
export async function transferOwnership(
  businessId: string,
  newOwnerUserId: string,
): Promise<{ status: 'transferred'; business_id: string; new_owner: string }> {
  const { data, error } = await supabase.rpc('transfer_ownership', {
    p_business_id: businessId,
    p_new_owner_user_id: newOwnerUserId,
  });
  if (error) throw error;
  return data as unknown as { status: 'transferred'; business_id: string; new_owner: string };
}

// ── React Query mutation hooks ─────────────────────────────────────────────

export function useClaimOwnership() {
  return useMutation({
    mutationFn: (vars: { businessId: string; verificationMethod?: VerificationMethod }) =>
      claimOwnership(vars.businessId, vars.verificationMethod),
  });
}

export function useCreateManagedBusiness() {
  return useMutation({
    mutationFn: createManagedBusiness,
  });
}

export function useResolveClaim() {
  return useMutation({
    mutationFn: (vars: { claimId: string; approve: boolean }) =>
      resolveClaim(vars.claimId, vars.approve),
  });
}

export function useTransferOwnership() {
  return useMutation({
    mutationFn: (vars: { businessId: string; newOwnerUserId: string }) =>
      transferOwnership(vars.businessId, vars.newOwnerUserId),
  });
}
