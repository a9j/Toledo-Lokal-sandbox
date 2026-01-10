import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLoop } from '@/contexts/LoopContext';

export interface LoopCause {
  id: string;
  name: string;
  description: string | null;
  organization_name: string | null;
  logo_url: string | null;
  points_donated: number;
  is_active: boolean;
  category: string | null;
  created_at: string;
}

export function useLoopCauses() {
  return useQuery({
    queryKey: ['loop-causes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loop_causes')
        .select('*')
        .eq('is_active', true)
        .order('points_donated', { ascending: false });

      if (error) throw error;
      return data as LoopCause[];
    },
  });
}

export function useDonatePoints() {
  const { user } = useAuth();
  const { wallet, refreshWallet, refreshTransactions } = useLoop();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ causeId, points }: { causeId: string; points: number }) => {
      if (!user) throw new Error('Not logged in');
      if (!wallet) throw new Error('No wallet found');
      if (wallet.points_balance < points) throw new Error('Insufficient points');

      // Create donation transaction (negative points)
      const { data: transaction, error: transactionError } = await supabase
        .from('loop_transactions')
        .insert({
          wallet_id: wallet.id,
          transaction_type: 'donate',
          points: -points,
          description: 'Donated to cause',
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update wallet balance
      const { error: walletError } = await supabase
        .from('loop_wallets')
        .update({
          points_balance: wallet.points_balance - points,
          lifetime_donated: wallet.lifetime_donated + points,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      if (walletError) throw walletError;

      // Create donation record
      const { data: donation, error: donationError } = await supabase
        .from('loop_donations')
        .insert({
          user_id: user.id,
          cause_id: causeId,
          transaction_id: transaction.id,
          points_amount: points,
        })
        .select()
        .single();

      if (donationError) throw donationError;

      // Update cause total (increment manually)
      const { data: cause } = await supabase
        .from('loop_causes')
        .select('points_donated')
        .eq('id', causeId)
        .single();

      if (cause) {
        const { error: causeError } = await supabase
          .from('loop_causes')
          .update({ points_donated: (cause.points_donated || 0) + points })
          .eq('id', causeId);

        if (causeError) console.error('Error updating cause total:', causeError);
      }

      return donation;
    },
    onSuccess: () => {
      refreshWallet();
      refreshTransactions();
      queryClient.invalidateQueries({ queryKey: ['loop-causes'] });
    },
  });
}
