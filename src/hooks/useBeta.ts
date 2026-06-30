import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Closed-beta data layer. The Founding Beta Circle reuses the cohorts system
// (slug 'founding-beta', hidden + beta_gated) but its membership is gated by
// beta_members.status = 'active' — enforced in RLS, surfaced here. The new
// tables/RPCs are not in the generated Supabase types, so casts mirror the
// existing useCohort pattern.

export const FOUNDING_BETA_SLUG = 'founding-beta';

export type BetaPhase = 'open_signup' | 'cohort_live';

// The public phase flag. Anyone can read it (the signup page needs it).
export function useBetaPhase() {
  return useQuery({
    queryKey: ['beta-phase'],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<BetaPhase> => {
      const { data, error } = await supabase.rpc('beta_phase' as never);
      if (error) throw error;
      return ((data as unknown as string) ?? 'open_signup') as BetaPhase;
    },
  });
}

// Public running total of closed-beta signups (safe to show; the list itself
// stays private). Ticks up as people sign up.
export function useBetaSignupCount() {
  return useQuery({
    queryKey: ['beta-signup-count'],
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('beta_signup_count' as never);
      if (error) throw error;
      return Number(data ?? 0);
    },
  });
}

// Charter 100 cohort counter — live count of beta signups, safe for public display.
export function useCharter100Count() {
  return useQuery({
    queryKey: ['charter-100-count'],
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('charter_100_count' as never);
      if (error) throw error;
      return Number(data ?? 0);
    },
  });
}

export interface BetaCohort {
  id: string;
  slug: string;
  name: string;
  mission: string | null;
}

// Founding Beta membership + Circle framing. The cohort row is RLS-hidden from
// non-members, so we only fetch it once membership is confirmed.
export function useFoundingBeta() {
  const { user } = useAuth();

  const membership = useQuery({
    queryKey: ['beta-membership', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('is_active_beta_member' as never);
      if (error) throw error;
      return data === true;
    },
  });

  const isMember = membership.data === true;

  const cohort = useQuery({
    queryKey: ['cohort', FOUNDING_BETA_SLUG],
    enabled: isMember,
    queryFn: async (): Promise<BetaCohort | null> => {
      const { data, error } = await supabase
        .from('cohorts' as never)
        .select('id, slug, name, mission')
        .eq('slug', FOUNDING_BETA_SLUG)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as BetaCohort) ?? null;
    },
  });

  const memberCount = useQuery({
    queryKey: ['beta-member-count'],
    enabled: isMember,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('beta_active_member_count' as never);
      if (error) throw error;
      return Number(data ?? 0);
    },
  });

  return {
    isMember,
    isLoading: membership.isLoading,
    cohort: cohort.data ?? null,
    memberCount: memberCount.data ?? 0,
  };
}

// ── Founding Beta chat ─────────────────────────────────────────────────────
export interface CohortPost {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string | null; avatar_url: string | null; user_id: string } | null;
}

export function useCohortChat(slug = FOUNDING_BETA_SLUG, enabled = true) {
  const queryClient = useQueryClient();

  const posts = useQuery({
    queryKey: ['cohort-posts', slug],
    enabled,
    queryFn: async (): Promise<CohortPost[]> => {
      const { data, error } = await supabase
        .from('cohort_posts' as never)
        .select('id, body, created_at, author:profiles(id, name, avatar_url, user_id), cohorts!inner(slug)')
        .eq('cohorts.slug', slug)
        .is('removed_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as CohortPost[]) ?? [];
    },
  });

  const send = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.rpc('beta_circle_post' as never, {
        p_slug: slug,
        p_body: body,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cohort-posts', slug] }),
  });

  return { posts: posts.data ?? [], isLoading: posts.isLoading, send };
}

// ── Ideas space ────────────────────────────────────────────────────────────
export type IdeaSort = 'newest' | 'top';

export interface BetaIdea {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  author: { id: string; name: string | null; avatar_url: string | null; user_id: string } | null;
  vote_count: number;
  comment_count: number;
  voted: boolean;
}

export function useBetaIdeas(slug = FOUNDING_BETA_SLUG, sort: IdeaSort = 'top', enabled = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ideas = useQuery({
    queryKey: ['beta-ideas', slug, sort, user?.id],
    enabled,
    queryFn: async (): Promise<BetaIdea[]> => {
      const { data, error } = await supabase
        .from('beta_ideas' as never)
        .select(`
          id, title, description, created_at,
          author:profiles(id, name, avatar_url, user_id),
          votes:beta_idea_votes(profile_id),
          comments:beta_idea_comments(count),
          cohorts!inner(slug)
        `)
        .eq('cohorts.slug', slug)
        .is('removed_at', null);
      if (error) throw error;

      const myProfileId = await currentProfileId(user?.id);
      const rows = (data as unknown as RawIdea[]) ?? [];
      const mapped: BetaIdea[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        created_at: r.created_at,
        author: r.author ?? null,
        vote_count: r.votes?.length ?? 0,
        comment_count: r.comments?.[0]?.count ?? 0,
        voted: myProfileId ? (r.votes ?? []).some((v) => v.profile_id === myProfileId) : false,
      }));
      mapped.sort((a, b) =>
        sort === 'top'
          ? b.vote_count - a.vote_count || +new Date(b.created_at) - +new Date(a.created_at)
          : +new Date(b.created_at) - +new Date(a.created_at),
      );
      return mapped;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['beta-ideas', slug] });

  const submit = useMutation({
    mutationFn: async (input: { title: string; description: string }) => {
      const { error } = await supabase.rpc('beta_idea_submit' as never, {
        p_slug: slug,
        p_title: input.title,
        p_description: input.description,
      } as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleVote = useMutation({
    mutationFn: async (ideaId: string) => {
      const { error } = await supabase.rpc('beta_idea_toggle_vote' as never, {
        p_idea_id: ideaId,
      } as never);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { ideas: ideas.data ?? [], isLoading: ideas.isLoading, submit, toggleVote };
}

interface RawIdea {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  author: { id: string; name: string | null; avatar_url: string | null; user_id: string } | null;
  votes?: { profile_id: string }[];
  comments?: { count: number }[];
}

// Resolve the caller's profile id once (used to compute "did I vote").
async function currentProfileId(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export interface IdeaComment {
  id: string;
  body: string;
  created_at: string;
  author: { id: string; name: string | null; avatar_url: string | null } | null;
}

export function useIdeaComments(ideaId: string | null) {
  const queryClient = useQueryClient();

  const comments = useQuery({
    queryKey: ['beta-idea-comments', ideaId],
    enabled: !!ideaId,
    queryFn: async (): Promise<IdeaComment[]> => {
      const { data, error } = await supabase
        .from('beta_idea_comments' as never)
        .select('id, body, created_at, author:profiles(id, name, avatar_url)')
        .eq('idea_id', ideaId as string)
        .is('removed_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as unknown as IdeaComment[]) ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.rpc('beta_idea_add_comment' as never, {
        p_idea_id: ideaId,
        p_body: body,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beta-idea-comments', ideaId] }),
  });

  return { comments: comments.data ?? [], isLoading: comments.isLoading, add };
}
