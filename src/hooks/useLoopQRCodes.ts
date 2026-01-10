import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LoopQRCode {
  id: string;
  business_id: string;
  qr_type: 'visit' | 'job_complete' | 'referral' | 'event' | 'campaign';
  name: string;
  points_value: number;
  is_single_use: boolean;
  requires_staff_confirm: boolean;
  max_scans_per_user: number;
  scan_cooldown_hours: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  total_scans: number;
  created_at: string;
}

export function useBusinessQRCodes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const qrCodes = useQuery({
    queryKey: ['business-qr-codes', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (bizError || !business) return [];

      const { data, error } = await supabase
        .from('loop_qr_codes')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LoopQRCode[];
    },
    enabled: !!user,
  });

  const createQRCode = useMutation({
    mutationFn: async (qrCode: Omit<LoopQRCode, 'id' | 'business_id' | 'created_at' | 'total_scans'>) => {
      if (!user) throw new Error('Not logged in');

      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_user_id', user.id)
        .maybeSingle();

      if (bizError || !business) throw new Error('No business found');

      const { data, error } = await supabase
        .from('loop_qr_codes')
        .insert({
          name: qrCode.name,
          points_value: qrCode.points_value,
          qr_type: qrCode.qr_type,
          is_single_use: qrCode.is_single_use,
          requires_staff_confirm: qrCode.requires_staff_confirm,
          max_scans_per_user: qrCode.max_scans_per_user,
          scan_cooldown_hours: qrCode.scan_cooldown_hours,
          valid_from: qrCode.valid_from,
          valid_until: qrCode.valid_until,
          is_active: qrCode.is_active,
          business_id: business.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-qr-codes'] });
    },
  });

  const updateQRCode = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoopQRCode> & { id: string }) => {
      const { data, error } = await supabase
        .from('loop_qr_codes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-qr-codes'] });
    },
  });

  const deleteQRCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loop_qr_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-qr-codes'] });
    },
  });

  return {
    qrCodes: qrCodes.data || [],
    isLoading: qrCodes.isLoading,
    createQRCode,
    updateQRCode,
    deleteQRCode,
  };
}

export function useQRCodeScan() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (qrCodeId: string) => {
      if (!user) throw new Error('Not logged in');

      // Create scan record
      const { data: scan, error: scanError } = await supabase
        .from('loop_qr_scans')
        .insert({
          qr_code_id: qrCodeId,
          user_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (scanError) throw scanError;
      return scan;
    },
  });
}
