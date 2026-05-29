import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type BusinessStaffRole = 'owner' | 'staff' | 'manager';

export interface BusinessStaffRow {
  id: string;
  business_id: string;
  user_id: string;
  role: BusinessStaffRole;
  created_at: string;
  updated_at: string;
  profile?: {
    user_id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface BusinessInvitationRow {
  id: string;
  business_id: string;
  email: string | null;
  phone: string | null;
  role: 'staff' | 'manager';
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// Current staff on a business, joined with profiles for display. Reads through
// the admin-override RLS added in 20260528030000_admin_business_staff.sql.
export function useAdminBusinessStaff(businessId: string | null) {
  return useQuery<BusinessStaffRow[]>({
    queryKey: ['admin-business-staff', businessId],
    queryFn: async (): Promise<BusinessStaffRow[]> => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('business_staff')
        .select('id, business_id, user_id, role, created_at, updated_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const rows = (data || []) as BusinessStaffRow[];
      const userIds = rows.map((r) => r.user_id);
      if (userIds.length === 0) return rows;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      const byId = new Map((profiles || []).map((p) => [p.user_id, p]));
      return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) || null }));
    },
    enabled: !!businessId,
  });
}

export function useAdminBusinessInvitations(businessId: string | null) {
  return useQuery<BusinessInvitationRow[]>({
    queryKey: ['admin-business-invitations', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('business_invitations')
        .select('id, business_id, email, phone, role, token, invited_by, expires_at, accepted_at, created_at')
        .eq('business_id', businessId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BusinessInvitationRow[];
    },
    enabled: !!businessId,
  });
}

interface AttachInput {
  businessId: string;
  role: 'staff' | 'manager';
  email?: string;
  userId?: string;
  note?: string;
}

export function useAdminAttachStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AttachInput) => {
      const { data, error } = await (supabase.rpc as any)('admin_attach_business_staff', {
        p_business_id: input.businessId,
        p_role: input.role,
        p_target_user_id: input.userId ?? null,
        p_target_email: input.email ?? null,
        p_note: input.note ?? null,
      });
      if (error) throw error;
      return data as { action: 'attach' | 'invite'; staff_id: string | null; invitation_id: string | null; user_id: string | null };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-business-staff', vars.businessId] });
      qc.invalidateQueries({ queryKey: ['admin-business-invitations', vars.businessId] });
    },
  });
}

export function useAdminRemoveStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, businessId, note }: { staffId: string; businessId: string; note?: string }) => {
      const { error } = await (supabase.rpc as any)('admin_remove_business_staff', {
        p_staff_id: staffId,
        p_note: note ?? null,
      });
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => {
      qc.invalidateQueries({ queryKey: ['admin-business-staff', businessId] });
    },
  });
}

export function useAdminCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invitationId, businessId, note }: { invitationId: string; businessId: string; note?: string }) => {
      const { error } = await (supabase.rpc as any)('admin_cancel_business_invitation', {
        p_invitation_id: invitationId,
        p_note: note ?? null,
      });
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => {
      qc.invalidateQueries({ queryKey: ['admin-business-invitations', businessId] });
    },
  });
}
