import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EventAttendee {
  id: string;
  reward_id: string;
  user_id: string;
  points_spent: number;
  ticket_code: string;
  status: 'registered' | 'checked_in' | 'no_show' | 'cancelled';
  registered_at: string;
  checked_in_at: string | null;
  profiles_public?: {
    name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useEventAttendees(rewardId: string | undefined) {
  return useQuery({
    queryKey: ['event-attendees', rewardId],
    queryFn: async () => {
      const { data } = await supabase
        .from('loop_event_attendees')
        .select('*, profiles_public(name, avatar_url)')
        .eq('reward_id', rewardId!)
        .order('registered_at', { ascending: true });
      return (data ?? []) as EventAttendee[];
    },
    enabled: !!rewardId,
  });
}

export function useCheckInAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, rewardId }: { id: string; rewardId: string }) => {
      await supabase
        .from('loop_event_attendees')
        .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
        .eq('id', id);
    },
    onSuccess: (_, { rewardId }) =>
      qc.invalidateQueries({ queryKey: ['event-attendees', rewardId] }),
  });
}
