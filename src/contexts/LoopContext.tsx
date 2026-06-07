import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LoopWallet {
  id: string;
  user_id: string;
  city: string;
  points_balance: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  lifetime_donated: number;
  created_at: string;
  updated_at: string;
}

interface LoopTransaction {
  id: string;
  wallet_id: string;
  business_id: string | null;
  transaction_type: 'earn' | 'redeem' | 'donate' | 'bonus' | 'refund' | 'expire';
  points: number;
  description: string | null;
  created_at: string;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
}

interface LoopBadge {
  id: string;
  user_id: string;
  mission_id: string;
  badge_name: string;
  badge_icon: string | null;
  badge_color: string | null;
  earned_at: string;
}

interface LoopContextType {
  wallet: LoopWallet | null;
  transactions: LoopTransaction[];
  badges: LoopBadge[];
  isLoading: boolean;
  refreshWallet: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  redeemReward: (rewardId: string) => Promise<{ success: boolean; redemptionCode?: string; error?: string }>;
  ensureLoaded: () => void;
}

const LoopContext = createContext<LoopContextType | undefined>(undefined);

export function LoopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<LoopWallet | null>(null);
  const [transactions, setTransactions] = useState<LoopTransaction[]>([]);
  const [badges, setBadges] = useState<LoopBadge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadedForUser = useRef<string | null>(null);

  const refreshWallet = useCallback(async () => {
    if (!user) { setWallet(null); return; }
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from('loop_wallets').select('*')
        .eq('user_id', user.id).eq('city', 'toledo').maybeSingle();
      if (error && error.code !== 'PGRST116') { console.error('Error fetching wallet:', error); return; }
      if (!data) {
        const { data: walletId, error: createError } = await supabase
          .rpc('get_or_create_loop_wallet', { p_user_id: user.id, p_city: 'toledo' });
        if (createError) { console.error('Error creating wallet:', createError); return; }
        const { data: newWallet, error: fetchError } = await supabase
          .from('loop_wallets').select('*').eq('id', walletId).single();
        if (fetchError) { console.error('Error fetching new wallet:', fetchError); return; }
        data = newWallet;
      }
      setWallet(data as LoopWallet);
    } catch (err) { console.error('Error in refreshWallet:', err); }
    finally { setIsLoading(false); }
  }, [user]);

  const refreshTransactions = useCallback(async () => {
    if (!wallet) return;
    try {
      const { data, error } = await supabase
        .from('loop_transactions')
        .select(`*, business:businesses(id, name, logo_url)`)
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false }).limit(50);
      if (!error) setTransactions(data as LoopTransaction[]);
    } catch (err) { console.error('Error in refreshTransactions:', err); }
  }, [wallet]);

  const fetchBadges = useCallback(async () => {
    if (!user) { setBadges([]); return; }
    try {
      const { data, error } = await supabase
        .from('loop_badges').select('*')
        .eq('user_id', user.id).order('earned_at', { ascending: false });
      if (!error) setBadges(data as LoopBadge[]);
    } catch (err) { console.error('Error in fetchBadges:', err); }
  }, [user]);

  const ensureLoaded = useCallback(() => {
    if (!user) return;
    if (loadedForUser.current === user.id) return;
    loadedForUser.current = user.id;
    refreshWallet();
    fetchBadges();
  }, [user, refreshWallet, fetchBadges]);

  // Reset on user change
  useEffect(() => {
    if (!user) {
      loadedForUser.current = null;
      setWallet(null);
      setTransactions([]);
      setBadges([]);
    } else {
      loadedForUser.current = null; // allow re-fetch on next ensureLoaded
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally depend on user?.id rather than the full user object to avoid reset loops on reference changes
  }, [user?.id]);

  // Fetch transactions when wallet changes
  useEffect(() => {
    if (wallet) refreshTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally depend on wallet?.id to refetch only when wallet identity changes, not on every wallet reference or refreshTransactions update
  }, [wallet?.id]);

  const redeemReward = useCallback(async (rewardId: string) => {
    if (!user) return { success: false, error: 'Not logged in' };
    try {
      const { data, error } = await supabase
        .rpc('redeem_loop_points', { p_user_id: user.id, p_reward_id: rewardId });
      if (error) return { success: false, error: error.message };
      const result = data as { success: boolean; redemption_code?: string; error?: string };
      if (result.success) {
        await refreshWallet();
        await refreshTransactions();
        return { success: true, redemptionCode: result.redemption_code };
      }
      return { success: false, error: result.error };
    } catch (err) { return { success: false, error: 'Failed to redeem reward' }; }
  }, [user, refreshWallet, refreshTransactions]);

  return (
    <LoopContext.Provider value={{ wallet, transactions, badges, isLoading, refreshWallet, refreshTransactions, redeemReward, ensureLoaded }}>
      {children}
    </LoopContext.Provider>
  );
}

export function useLoop() {
  const context = useContext(LoopContext);
  if (context === undefined) throw new Error('useLoop must be used within a LoopProvider');
  return context;
}
