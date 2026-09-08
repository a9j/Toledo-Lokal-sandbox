import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

/**
 * The admin side of the City OS surfaces.
 *
 * Every write here goes through the same RLS the rest of the app uses: these
 * hooks carry no elevated client and no service key. An admin is admin because
 * `is_platform_admin` says so in a policy, not because this file was imported.
 */

export type Issue = Database['public']['Tables']['issues']['Row'];
export type MemoryItem = Database['public']['Tables']['memory_items']['Row'];
export type Plugin = Database['public']['Tables']['plugins']['Row'];

/** A memory waiting for a human, with the place it belongs to. */
export interface PendingMemory extends MemoryItem {
  entity_name: string | null;
  contributor_name: string | null;
}

export function useAdminIssues(status?: string) {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ['admin-issues', status ?? 'all'],
    enabled: isAdmin,
    queryFn: async () => {
      let query = supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Issue[];
    },
  });
}

export function useSetIssueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const { error } = await supabase
        .from('issues')
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

/**
 * Memories waiting for approval.
 *
 * The join to city_entities gives the place; the join to profiles gives the
 * contributor's name. Both are readable to an admin, and a reviewer needs to
 * see who is claiming a memory as much as what it says.
 */
export function usePendingMemories() {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ['admin-pending-memories'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memory_items')
        .select('*')
        .eq('approved', false)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      const rows = (data ?? []) as MemoryItem[];
      if (rows.length === 0) return [] as PendingMemory[];

      const entityIds = [...new Set(rows.map((r) => r.entity_id))];
      const contributorIds = [
        ...new Set(rows.map((r) => r.contributor_id).filter((v): v is string => !!v)),
      ];

      const [{ data: entities }, { data: profiles }] = await Promise.all([
        supabase.from('city_entities').select('id, name').in('id', entityIds),
        contributorIds.length
          ? supabase.from('profiles').select('user_id, name').in('user_id', contributorIds)
          : Promise.resolve({ data: [] as { user_id: string; name: string | null }[] }),
      ]);

      const entityName = new Map((entities ?? []).map((e) => [e.id, e.name]));
      const profileName = new Map((profiles ?? []).map((p) => [p.user_id, p.name]));

      return rows.map((row) => ({
        ...row,
        entity_name: entityName.get(row.entity_id) ?? null,
        contributor_name: row.contributor_id
          ? (profileName.get(row.contributor_id) ?? null)
          : null,
      })) as PendingMemory[];
    },
  });
}

/**
 * Approve or delete a memory.
 *
 * Approving flips `approved`, which fires the Phase 5 trigger that announces it
 * to whoever follows the place. Rejecting deletes the row rather than parking
 * it in a rejected state: a memory nobody will publish should not sit in a table
 * attached to the person who wrote it.
 */
export function useReviewMemory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; approve: boolean }) => {
      if (input.approve) {
        const { error } = await supabase
          .from('memory_items')
          .update({ approved: true })
          .eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('memory_items').delete().eq('id', input.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-memories'] });
      queryClient.invalidateQueries({ queryKey: ['entity-memory'] });
    },
  });
}

export function useAdminPlugins() {
  const { isAdmin } = useAuth();
  return useQuery({
    queryKey: ['admin-plugins'],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plugins')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Plugin[];
    },
  });
}

export function useSetPluginStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const { error } = await supabase
        .from('plugins')
        .update({ status: input.status })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plugins'] });
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
    },
  });
}
