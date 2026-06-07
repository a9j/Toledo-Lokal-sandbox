import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PulseCategory } from '@/lib/pulse-config';
import { useEffect } from 'react';

export interface PulsePost {
  id: string;
  category: PulseCategory;
  content: string;
  created_at: string;
  expires_at: string;
  user_id: string | null;
  business_id: string | null;
  nonprofit_id: string | null;
  location_text: string | null;
  status: 'active' | 'hidden' | 'removed' | 'expired';
  is_pinned: boolean;
  helpful_count: number;
  flag_count: number;
  // Sharing fields
  pulse_id: string;
  headline: string | null;
  preview_text: string | null;
  full_body: string | null;
  author_type: 'user' | 'business' | 'admin';
  business_tier: string;
  share_enabled: boolean;
  resharing_allowed: boolean;
  anonymous: boolean;
  hero_image: string | null;
  // User Pulse fields
  activity_type: string | null;
  reference_id: string | null;
  auto_generated: boolean;
  // Joined data
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  nonprofit?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  author?: {
    user_id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface UsePulseOptions {
  category?: PulseCategory;
  limit?: number;
}

export function usePulse(options: UsePulseOptions = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pulse', options],
    queryFn: async () => {
      let q = supabase
        .from('pulse_posts')
        .select(`
          *,
          business:businesses(id, name, logo_url),
          nonprofit:nonprofits(id, name, logo_url)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('is_pinned', { ascending: false })
        .order('expires_at', { ascending: true })
        .order('created_at', { ascending: false });

      if (options.category) {
        q = q.eq('category', options.category);
      }

      if (options.limit) {
        q = q.limit(options.limit);
      }

      const { data: posts, error } = await q;
      if (error) throw error;

      // Fetch author profiles for user posts
      const userIds = [...new Set(posts.filter(p => p.user_id).map(p => p.user_id!))];
      let profileMap = new Map();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .in('user_id', userIds);

        profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      }

      return posts.map(post => ({
        ...post,
        author: post.user_id ? profileMap.get(post.user_id) || null : null,
      })) as PulsePost[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('pulse-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pulse_posts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pulse'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useUserPulsePostsToday() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pulse-user-today', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('pulse_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

export function useBusinessPulsePostsToday(businessId: string | undefined) {
  return useQuery({
    queryKey: ['pulse-business-today', businessId],
    queryFn: async () => {
      if (!businessId) return 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('pulse_posts')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('created_at', today.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!businessId,
  });
}

interface CreatePulsePostInput {
  category: PulseCategory;
  content: string;
  expirationHours: number;
  locationText?: string;
  businessId?: string;
  isPinned?: boolean;
  // Business post fields
  postType?: 'update' | 'menu_item' | 'event' | 'milestone' | 'popup';
  title?: string;
  imageUrl?: string;
  authorId?: string;
  businessTier?: string;
  // Sharing fields
  headline?: string;
  previewText?: string;
  fullBody?: string;
  heroImage?: string;
  shareEnabled?: boolean;
  anonymous?: boolean;
}

export function useCreatePulsePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePulsePostInput) => {
      if (!user) throw new Error('Must be logged in');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + input.expirationHours);

      const { data, error } = await supabase
        .from('pulse_posts')
        .insert({
          category: input.category,
          content: input.content,
          expires_at: expiresAt.toISOString(),
          location_text: input.locationText || null,
          user_id: input.businessId ? null : user.id,
          business_id: input.businessId || null,
          is_pinned: input.isPinned || false,
          // Business post fields
          post_type: input.postType || null,
          title: input.title || null,
          image_url: input.imageUrl || null,
          author_id: input.authorId || null,
          // Sharing fields
          headline: input.headline || null,
          preview_text: input.previewText || null,
          full_body: input.fullBody || null,
          hero_image: input.heroImage || null,
          share_enabled: input.shareEnabled !== false,
          anonymous: input.anonymous || false,
          author_type: input.businessId ? 'business' : 'user',
          business_tier: input.businessTier || (input.businessId ? 'paid' : 'free'),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-user-today'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-business-today'] });
    },
  });
}

export function usePulseFeedback(postId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const feedbackQuery = useQuery({
    queryKey: ['pulse-feedback', postId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('pulse_feedback')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitFeedback = useMutation({
    mutationFn: async (type: 'helpful' | 'not_helpful') => {
      if (!user) throw new Error('Must be logged in');

      // If user already gave this feedback, remove it
      if (feedbackQuery.data?.feedback_type === type) {
        const { error } = await supabase
          .from('pulse_feedback')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        return null;
      }

      // Remove any existing feedback first
      if (feedbackQuery.data) {
        await supabase
          .from('pulse_feedback')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      }

      // Add new feedback
      const { data, error } = await supabase
        .from('pulse_feedback')
        .insert({
          post_id: postId,
          user_id: user.id,
          feedback_type: type,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulse-feedback', postId] });
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
    },
  });

  return { feedback: feedbackQuery.data, submitFeedback };
}

export function useHidePulsePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('pulse_posts')
        .update({ status: 'hidden' })
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
    },
  });
}
