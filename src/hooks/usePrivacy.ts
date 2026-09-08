import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PrivacySetting =
  | 'share_location'
  | 'store_home_address'
  | 'personalization'
  | 'ai_recommendations'
  | 'public_activity'
  | 'public_rewards';

export interface PrivacySettings {
  share_location: boolean;
  store_home_address: boolean;
  personalization: boolean;
  ai_recommendations: boolean;
  public_activity: boolean;
  public_rewards: boolean;
  notification_categories: Record<string, unknown>;
}

/** Everything off. What a signed out person gets, and what the database
 *  returns for anyone who has never opened the Privacy screen. */
const CLOSED: PrivacySettings = {
  share_location: false,
  store_home_address: false,
  personalization: false,
  ai_recommendations: false,
  public_activity: false,
  public_rewards: false,
  notification_categories: { enabled: true },
};

/**
 * The one place the app asks what a person has allowed.
 *
 * Any feature that wants a home address or a location must ask here first.
 * The default is closed, so a bug that forgets to check errs towards showing
 * less rather than leaking more.
 */
export function usePrivacy() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['privacy-settings', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<PrivacySettings> => {
      const { data, error } = await supabase.rpc('my_privacy_settings');
      if (error) throw error;
      const rows = (data ?? []) as unknown as PrivacySettings[];
      return rows[0] ?? CLOSED;
    },
  });

  const set = useMutation({
    mutationFn: async ({ setting, value }: { setting: PrivacySetting; value: boolean }) => {
      const { error } = await supabase.rpc('set_privacy_setting', {
        p_setting: setting,
        p_value: value,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] });
      // Turning the address off deletes the home, so anything that read it
      // is now stale.
      queryClient.invalidateQueries({ queryKey: ['my-city'] });
      queryClient.invalidateQueries({ queryKey: ['city-search'] });
    },
  });

  const settings = user ? (query.data ?? CLOSED) : CLOSED;

  return {
    settings,
    isLoading: query.isLoading,
    allows: (setting: PrivacySetting) => settings[setting] === true,
    setSetting: set.mutate,
    isSaving: set.isPending,
  };
}
