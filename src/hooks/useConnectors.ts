import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useConnector(connectorId?: string) {
  return useQuery({
    queryKey: ['connector', connectorId],
    queryFn: async () => {
      if (!connectorId) return null;
      const { data, error } = await supabase
        .from('connectors')
        .select('*, profile:profiles!connectors_user_id_fkey(name, avatar_url)')
        .eq('id', connectorId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!connectorId,
  });
}

export function useConnectorBySlug(slug?: string) {
  return useQuery({
    queryKey: ['connector-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('connectors')
        .select('*')
        .eq('referral_slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function useConnectorByUserId(userId?: string) {
  return useQuery({
    queryKey: ['connector-user', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('connectors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useConnectorReferrals(connectorId?: string) {
  return useQuery({
    queryKey: ['connector-referrals', connectorId],
    queryFn: async () => {
      if (!connectorId) return [];
      const { data, error } = await supabase
        .from('connector_referrals')
        .select('*, business:businesses(id, name, status, category:categories!category_id(name), created_at)')
        .eq('connector_id', connectorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!connectorId,
  });
}

export function useConnectorEvents(connectorId?: string) {
  return useQuery({
    queryKey: ['connector-events', connectorId],
    queryFn: async () => {
      if (!connectorId) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('connector_id', connectorId)
        .order('start_date_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!connectorId,
  });
}

export function useConnectorFollowers(connectorId?: string) {
  return useQuery({
    queryKey: ['connector-followers', connectorId],
    queryFn: async () => {
      if (!connectorId) return [];
      const { data, error } = await supabase
        .from('connector_followers')
        .select('*')
        .eq('connector_id', connectorId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!connectorId,
  });
}

export function useIsFollowingConnector(connectorId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['following-connector', connectorId, user?.id],
    queryFn: async () => {
      if (!connectorId || !user) return false;
      const { data } = await supabase
        .from('connector_followers')
        .select('id')
        .eq('connector_id', connectorId)
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!connectorId && !!user,
  });
}

export function useToggleFollowConnector() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ connectorId, isFollowing }: { connectorId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Must be logged in');
      if (isFollowing) {
        const { error } = await supabase
          .from('connector_followers')
          .delete()
          .eq('connector_id', connectorId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('connector_followers')
          .insert({ connector_id: connectorId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: (_, { connectorId }) => {
      queryClient.invalidateQueries({ queryKey: ['following-connector', connectorId] });
      queryClient.invalidateQueries({ queryKey: ['connector-followers', connectorId] });
      queryClient.invalidateQueries({ queryKey: ['connector'] });
    },
  });
}

export function useAllConnectors() {
  return useQuery({
    queryKey: ['all-connectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connectors')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}
