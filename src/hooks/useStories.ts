import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useStories(filters?: { featured?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['stories', filters],
    queryFn: async () => {
      let query = supabase
        .from('stories')
        .select(`
          *,
          business:businesses(id, name),
          neighborhood:neighborhoods(name)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (filters?.featured) {
        query = query.eq('featured', true);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (story: {
      title: string;
      content: string;
      image_url?: string;
      story_type: string;
      business_id?: string;
      neighborhood_id?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('stories')
        .insert({
          ...story,
          author_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}

export function useLikeStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ storyId, liked }: { storyId: string; liked: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      if (liked) {
        const { error } = await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('story_likes')
          .insert({ story_id: storyId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });
}
