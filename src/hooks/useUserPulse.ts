import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type ActivityType = 'visit' | 'save' | 'review' | 'support' | 'loop_earn' | 'mission_complete';

interface GenerateUserPulseParams {
  activityType: ActivityType;
  referenceId?: string;
  businessId?: string;
  content?: string;
}

export function useUserPulse() {
  const { user } = useAuth();

  const generatePulse = useMutation({
    mutationFn: async ({ activityType, referenceId, businessId, content }: GenerateUserPulseParams) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase.rpc('generate_user_pulse', {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_reference_id: referenceId || null,
        p_business_id: businessId || null,
        p_content: content || null,
      });

      if (error) throw error;
      return data;
    },
  });

  // Helper functions for common activities
  const onVisit = (businessId: string) => {
    generatePulse.mutate({ activityType: 'visit', businessId });
  };

  const onSave = (businessId: string) => {
    generatePulse.mutate({ activityType: 'save', businessId });
  };

  const onReview = (businessId: string, reviewId: string) => {
    generatePulse.mutate({ activityType: 'review', businessId, referenceId: reviewId });
  };

  const onSupport = (nonprofitId: string) => {
    generatePulse.mutate({ activityType: 'support', referenceId: nonprofitId });
  };

  const onLoopEarn = (businessId: string, transactionId: string) => {
    generatePulse.mutate({ activityType: 'loop_earn', businessId, referenceId: transactionId });
  };

  const onMissionComplete = (missionId: string) => {
    generatePulse.mutate({ activityType: 'mission_complete', referenceId: missionId });
  };

  return {
    generatePulse,
    onVisit,
    onSave,
    onReview,
    onSupport,
    onLoopEarn,
    onMissionComplete,
  };
}
