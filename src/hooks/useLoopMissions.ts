import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LoopMission {
  id: string;
  title: string;
  description: string | null;
  mission_type: 'visits' | 'category' | 'neighborhood' | 'mwbe' | 'tourism' | 'event' | 'donation';
  required_count: number;
  points_reward: number;
  badge_icon: string | null;
  badge_color: string | null;
  target_category_id: string | null;
  target_neighborhood_id: string | null;
  target_businesses: string[];
  sponsor_business_id: string | null;
  is_featured: boolean;
  max_participants: number | null;
  current_participants: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  category?: { name: string; icon: string | null };
  neighborhood?: { name: string };
  sponsor?: { name: string; logo_url: string | null };
}

export interface LoopMissionProgress {
  id: string;
  user_id: string;
  mission_id: string;
  progress_count: number;
  completed_at: string | null;
  reward_claimed_at: string | null;
  businesses_visited: string[];
  created_at: string;
  mission?: LoopMission;
}

export function useLoopMissions(options?: { featured?: boolean }) {
  return useQuery({
    queryKey: ['loop-missions', options],
    queryFn: async () => {
      let query = supabase
        .from('loop_missions')
        .select(`
          *,
          category:categories(name, icon),
          neighborhood:neighborhoods(name),
          sponsor:businesses!sponsor_business_id(name, logo_url)
        `)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (options?.featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LoopMission[];
    },
  });
}

export function useUserMissionProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-mission-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('loop_mission_progress')
        .select(`
          *,
          mission:loop_missions(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LoopMissionProgress[];
    },
    enabled: !!user,
  });
}

export function useJoinMission() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (missionId: string) => {
      if (!user) throw new Error('Not logged in');

      // Check if already joined
      const { data: existing } = await supabase
        .from('loop_mission_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('mission_id', missionId)
        .maybeSingle();

      if (existing) {
        throw new Error('Already joined this mission');
      }

      const { data, error } = await supabase
        .from('loop_mission_progress')
        .insert({
          user_id: user.id,
          mission_id: missionId,
          progress_count: 0,
          businesses_visited: [],
        })
        .select()
        .single();

      if (error) throw error;

      // Increment participant count manually
      const { data: mission } = await supabase
        .from('loop_missions')
        .select('current_participants')
        .eq('id', missionId)
        .single();

      if (mission) {
        await supabase
          .from('loop_missions')
          .update({ current_participants: (mission.current_participants || 0) + 1 })
          .eq('id', missionId);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-mission-progress'] });
      queryClient.invalidateQueries({ queryKey: ['loop-missions'] });
    },
  });
}

export function useClaimMissionReward() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (progressId: string) => {
      if (!user) throw new Error('Not logged in');

      // Get progress and mission details
      const { data: progress, error: progressError } = await supabase
        .from('loop_mission_progress')
        .select(`
          *,
          mission:loop_missions(*)
        `)
        .eq('id', progressId)
        .eq('user_id', user.id)
        .single();

      if (progressError || !progress) throw new Error('Progress not found');
      if (progress.reward_claimed_at) throw new Error('Reward already claimed');
      if (!progress.completed_at) throw new Error('Mission not completed');

      const mission = progress.mission as LoopMission;

      // Issue bonus points
      const { data: transactionId, error: pointsError } = await supabase
        .rpc('issue_loop_points', {
          p_user_id: user.id,
          p_business_id: null,
          p_points: mission.points_reward,
          p_transaction_type: 'bonus',
          p_description: `Mission completed: ${mission.title}`,
          p_mission_id: mission.id,
        });

      if (pointsError) throw pointsError;

      // Update progress as claimed
      const { error: updateError } = await supabase
        .from('loop_mission_progress')
        .update({ reward_claimed_at: new Date().toISOString() })
        .eq('id', progressId);

      if (updateError) throw updateError;

      // Create badge
      const { error: badgeError } = await supabase
        .from('loop_badges')
        .insert({
          user_id: user.id,
          mission_id: mission.id,
          badge_name: mission.title,
          badge_icon: mission.badge_icon,
          badge_color: mission.badge_color,
        });

      if (badgeError) console.error('Error creating badge:', badgeError);

      return { transactionId, points: mission.points_reward };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-mission-progress'] });
      queryClient.invalidateQueries({ queryKey: ['loop-wallets'] });
    },
  });
}
