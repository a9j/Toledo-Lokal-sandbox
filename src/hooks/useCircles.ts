import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Circle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  member_count: number;
}

interface CircleMember {
  id: string;
  user_id: string;
  circle_id: string;
  role: string;
  joined_at: string;
  profile: {
    user_id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CirclePost {
  id: string;
  circle_id: string;
  author_id: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  author: {
    user_id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface CircleInvite {
  id: string;
  circle_id: string;
  email: string;
  status: string;
  invited_by: string;
  created_at: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useMyCircles() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['circles', 'my', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Circle[]> => {
      const { data: memberships, error: memberError } = await (supabase
        .from as any)('circle_members')
        .select('circle_id')
        .eq('user_id', user!.id);
      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) return [];

      const circleIds = memberships.map((m: { circle_id: string }) => m.circle_id);

      const { data: circles, error: circlesError } = await (supabase
        .from as any)('circles')
        .select('id, name, slug, description, avatar_url, created_at')
        .in('id', circleIds);
      if (circlesError) throw circlesError;

      // Get member counts for each circle
      const { data: counts, error: countsError } = await (supabase
        .from as any)('circle_members')
        .select('circle_id')
        .in('circle_id', circleIds);
      if (countsError) throw countsError;

      const countMap = new Map<string, number>();
      (counts ?? []).forEach((row: { circle_id: string }) => {
        countMap.set(row.circle_id, (countMap.get(row.circle_id) ?? 0) + 1);
      });

      return (circles ?? []).map((c: any) => ({
        ...c,
        member_count: countMap.get(c.id) ?? 0,
      }));
    },
  });

  return { circles: query.data ?? [], isLoading: query.isLoading };
}

export function useCircleBySlug(slug: string) {
  const query = useQuery({
    queryKey: ['circles', slug],
    enabled: !!slug,
    queryFn: async (): Promise<Circle | null> => {
      const { data, error } = await (supabase
        .from as any)('circles')
        .select('id, name, slug, description, avatar_url, created_at')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { count, error: countError } = await (supabase
        .from as any)('circle_members')
        .select('id', { count: 'exact', head: true })
        .eq('circle_id', data.id);
      if (countError) throw countError;

      return { ...data, member_count: count ?? 0 };
    },
  });

  return { circle: query.data ?? null, isLoading: query.isLoading };
}

export function useCircleMembers(circleId: string) {
  const query = useQuery({
    queryKey: ['circle-members', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<CircleMember[]> => {
      const { data, error } = await (supabase
        .from as any)('circle_members')
        .select('id, user_id, circle_id, role, joined_at')
        .eq('circle_id', circleId);
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const userIds = data.map((m: { user_id: string }) => m.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);
      if (profileError) throw profileError;

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      return data.map((m: any) => ({
        ...m,
        profile: profileMap.get(m.user_id) ?? null,
      }));
    },
  });

  return { members: query.data ?? [], isLoading: query.isLoading };
}

export function useCirclePosts(circleId: string) {
  const query = useQuery({
    queryKey: ['circle-posts', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<CirclePost[]> => {
      const { data, error } = await (supabase
        .from as any)('circle_posts')
        .select('id, circle_id, author_id, body, is_pinned, created_at')
        .eq('circle_id', circleId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const authorIds = [...new Set(data.map((p: { author_id: string }) => p.author_id))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', authorIds);
      if (profileError) throw profileError;

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.user_id, p])
      );

      return data.map((p: any) => ({
        ...p,
        author: profileMap.get(p.author_id) ?? null,
      }));
    },
  });

  return { posts: query.data ?? [], isLoading: query.isLoading };
}

export function useCircleInvites(circleId: string) {
  const query = useQuery({
    queryKey: ['circle-invites', circleId],
    enabled: !!circleId,
    queryFn: async (): Promise<CircleInvite[]> => {
      const { data, error } = await (supabase
        .from as any)('circle_invites')
        .select('id, circle_id, email, status, invited_by, created_at')
        .eq('circle_id', circleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as CircleInvite[]) ?? [];
    },
  });

  return { invites: query.data ?? [], isLoading: query.isLoading };
}

export function useIsCircleAdmin() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['circle-admin', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as any)?.is_admin === true;
    },
  });

  return { isCircleAdmin: query.data ?? false, isLoading: query.isLoading };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useCreatePost(circleId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) => {
      const { error } = await (supabase
        .from as any)('circle_posts')
        .insert({
          circle_id: circleId,
          author_id: user!.id,
          body,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-posts', circleId] });
    },
  });
}

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { circleId: string; email: string }) => {
      const { data, error } = await supabase.functions.invoke('circle-create-invite', {
        body: { circle_id: input.circleId, email: input.email },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['circle-invites', variables.circleId] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { inviteId: string }) => {
      const { data, error } = await supabase.functions.invoke('circle-accept-invite', {
        body: { invite_id: input.inviteId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles', 'my'] });
    },
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { inviteId: string; circleId: string }) => {
      const { error } = await (supabase
        .from as any)('circle_invites')
        .update({ status: 'revoked' })
        .eq('id', input.inviteId);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['circle-invites', variables.circleId] });
    },
  });
}
