import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OwnerMessage {
  id: string;
  subject: string | null;
  body: string;
  is_broadcast: boolean;
  read_at: string | null;
  created_at: string;
  business_id: string | null;
}

export function useOwnerMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['owner-messages', user?.id],
    queryFn: async (): Promise<OwnerMessage[]> => {
      // Cast until `owner_messages` is added to the generated Supabase types
      // (happens automatically after the migration runs + types are regenerated).
      const { data, error } = await (supabase.from('owner_messages' as any) as any)
        .select('id, subject, body, is_broadcast, read_at, created_at, business_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OwnerMessage[];
    },
    enabled: !!user,
  });

  const unreadCount = messages.filter((m) => !m.read_at).length;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('owner_messages' as any) as any)
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-messages', user?.id] });
    },
  });

  return { messages, unreadCount, isLoading, markRead: markRead.mutate };
}
