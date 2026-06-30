import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CohortPost, BetaIdea, IdeaSort } from '@/hooks/useBeta';

export function useCircleMembership(slug: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['circle-membership', slug, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('is_circle_member_by_slug' as never, {
        p_slug: slug,
      } as never);
      if (error) throw error;
      return data === true;
    },
  });
}

export function useCircleChat(slug: string, enabled = true) {
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
      const { error } = await supabase.rpc('circle_post' as never, {
        p_slug: slug,
        p_body: body,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cohort-posts', slug] }),
  });

  return { posts: posts.data ?? [], isLoading: posts.isLoading, send };
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

async function currentProfileId(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export function useCircleIdeas(slug: string, sort: IdeaSort = 'top', enabled = true) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ideas = useQuery({
    queryKey: ['circle-ideas', slug, sort, user?.id],
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['circle-ideas', slug] });

  const submit = useMutation({
    mutationFn: async (input: { title: string; description: string }) => {
      const { error } = await supabase.rpc('circle_idea_submit' as never, {
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
