import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 20;

export function useLoopTransactionsPaginated(walletId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ['loop-tx-paginated', walletId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('loop_transactions')
        .select('*, business:businesses(id, name, logo_url)')
        .eq('wallet_id', walletId!)
        .order('created_at', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,
    initialPageParam: 0,
    enabled: !!walletId,
    staleTime: 30_000,
  });
}
