import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePosts(options?: { limit?: number; businessId?: string }) {
  return useQuery({
    queryKey: ['posts', options],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          business:businesses(id, name)
        `)
        .eq('status', 'active')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (options?.businessId) {
        query = query.eq('business_id', options.businessId);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const { data: posts, error } = await query;
      if (error) throw error;

      // Fetch author profiles separately
      const authorIds = [...new Set(posts.map(p => p.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', authorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return posts.map(post => ({
        ...post,
        author: profileMap.get(post.author_id) || null,
      }));
    },
  });
}
