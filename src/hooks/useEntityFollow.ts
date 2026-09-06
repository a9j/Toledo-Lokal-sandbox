import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { cityOs, type EntitySourceTable } from '@/integrations/supabase/city-os';

/**
 * Universal follow, Phase 1.
 *
 * Anything in the CityGraph can be followed with the same call: a business, an
 * event, a neighborhood, a nonprofit, a job. Following an entity is what puts
 * its changes in your Civic Inbox.
 *
 * Pass an `entityId` when you already have one. Detail pages usually hold the
 * source row id instead, so they pass `source` and the registry id is looked up
 * for them.
 */
export interface EntityRef {
  table: EntitySourceTable;
  id: string | undefined;
}

/** Resolve a source row to its CityGraph entity id. */
export function useEntityId(source?: EntityRef) {
  return useQuery({
    queryKey: ['citygraph-entity-id', source?.table, source?.id],
    enabled: !!source?.table && !!source?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await cityOs.rpc('citygraph_entity_id', {
        p_source_table: source!.table,
        p_source_id: source!.id as string,
      });
      if (error) throw error;
      return (data as string | null) ?? null;
    },
  });
}

export function useEntityFollow(entityId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isFollowingQuery = useQuery({
    queryKey: ['entity-follow', entityId, user?.id],
    enabled: !!entityId && !!user,
    queryFn: async () => {
      const { data, error } = await cityOs
        .from('entity_follows')
        .select('entity_id')
        .eq('entity_id', entityId as string)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const followerCountQuery = useQuery({
    queryKey: ['entity-follower-count', entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await cityOs.rpc('entity_follower_count', {
        _entity_id: entityId as string,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async () => {
      if (!entityId) throw new Error('No entity id');
      if (!user) throw new Error('Not signed in');

      if (isFollowingQuery.data) {
        const { error } = await cityOs
          .from('entity_follows')
          .delete()
          .eq('entity_id', entityId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await cityOs
          .from('entity_follows')
          .insert({ entity_id: entityId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-follow', entityId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['entity-follower-count', entityId] });
      // A new follow does not backfill the inbox, but unfollowing stops future
      // fan out, so the badge is worth refreshing either way.
      queryClient.invalidateQueries({ queryKey: ['inbox-unread-count'] });
    },
  });

  return {
    isFollowing: isFollowingQuery.data ?? false,
    followerCount: followerCountQuery.data ?? 0,
    isLoading: isFollowingQuery.isLoading,
    toggleFollow,
  };
}
