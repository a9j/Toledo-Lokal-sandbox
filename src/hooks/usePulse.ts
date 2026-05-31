import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PulseCategory, PulseContentType, PulseReactionType, PULSE_EVENT_TEMPLATE_KEYS } from '@/lib/pulse-config';
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
  // Restructure fields
  content_type: PulseContentType;
  template_key: string | null;
  neighborhood: string | null;
  tags: string[];
  why_it_matters: string | null;
  place_business_id: string | null;
  reaction_count: number;
  reaction_counts: Partial<Record<PulseReactionType, number>>;
  // Event fields
  post_type: 'update' | 'event' | 'deal';
  event_date: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
  location_name: string | null;
  location_address: string | null;
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
  contentType?: PulseContentType;
  neighborhood?: string;
  tag?: string;
  templateKeys?: string[];
  businessIds?: string[];
  sort?: 'recent' | 'trending';
  limit?: number;
  // Events tab: match anything that is an event — either an event-typed post or
  // one of the event templates — so composer-created events always show up.
  eventsOnly?: boolean;
}

export function usePulse(options: UsePulseOptions = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pulse', options],
    queryFn: async () => {
      // Several restructure columns (content_type, neighborhood, tags,
      // template_key, reaction_count) aren't in the generated types yet, so
      // build the query with an untyped builder for the filter chain.
      let q: any = supabase
        .from('pulse_posts')
        .select(`
          *,
          business:businesses!business_id(id, name, logo_url),
          nonprofit:nonprofits(id, name, logo_url)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      if (options.sort === 'trending') {
        q = q
          .order('is_pinned', { ascending: false })
          .order('reaction_count', { ascending: false })
          .order('created_at', { ascending: false });
      } else {
        q = q
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
      }

      if (options.category) q = q.eq('category', options.category);
      if (options.contentType) q = q.eq('content_type', options.contentType);
      if (options.neighborhood) q = q.eq('neighborhood', options.neighborhood);
      if (options.tag) q = q.contains('tags', [options.tag]);
      if (options.eventsOnly) {
        q = q.or(`post_type.eq.event,template_key.in.(${PULSE_EVENT_TEMPLATE_KEYS.join(',')})`);
      } else if (options.templateKeys && options.templateKeys.length > 0) {
        q = q.in('template_key', options.templateKeys);
      }
      if (options.businessIds && options.businessIds.length > 0) {
        q = q.in('business_id', options.businessIds);
      }
      if (options.limit) q = q.limit(options.limit);

      const { data: posts, error } = await q;
      if (error) throw error;

      // Fetch author profiles for user posts
      const userIds = [...new Set((posts as { user_id: string | null }[]).filter(p => p.user_id).map(p => p.user_id as string))];
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
      })) as unknown as PulsePost[];
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
  nonprofitId?: string;
  isPinned?: boolean;
  // Restructure fields
  contentType?: PulseContentType;
  templateKey?: string;
  neighborhood?: string;
  tags?: string[];
  whyItMatters?: string;
  placeBusinessId?: string;
  // Sharing fields
  headline?: string;
  previewText?: string;
  fullBody?: string;
  heroImage?: string;
  shareEnabled?: boolean;
  anonymous?: boolean;
  // Event fields
  postType?: 'update' | 'event' | 'deal';
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  locationName?: string;
  locationAddress?: string;
  addToBusinessCalendar?: boolean;
}

export function useCreatePulsePost() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePulsePostInput) => {
      if (!user) throw new Error('Must be logged in');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + input.expirationHours);

      const authorType = input.businessId ? 'business' : 'user';

      // Some restructure columns aren't in the generated types yet; cast the
      // payload so the typed client doesn't reject the new known columns.
      const insertPayload = {
        category: input.category,
        content: input.content,
        expires_at: expiresAt.toISOString(),
        location_text: input.locationText || null,
        user_id: input.businessId ? null : user.id,
        business_id: input.businessId || null,
        nonprofit_id: input.nonprofitId || null,
        is_pinned: input.isPinned || false,
        // Restructure fields
        content_type: input.contentType || 'business_activity',
        template_key: input.templateKey || null,
        neighborhood: input.neighborhood || null,
        tags: input.tags || [],
        why_it_matters: input.whyItMatters || null,
        place_business_id: input.placeBusinessId || null,
        // Sharing fields
        headline: input.headline || null,
        preview_text: input.previewText || null,
        full_body: input.fullBody || null,
        hero_image: input.heroImage || null,
        share_enabled: input.shareEnabled !== false,
        anonymous: input.anonymous || false,
        author_type: authorType,
        business_tier: input.businessId ? 'paid' : 'free',
        // Event fields
        post_type: input.postType || 'update',
        event_date: input.eventDate || null,
        event_start_time: input.eventStartTime || null,
        event_end_time: input.eventEndTime || null,
        location_name: input.locationName || null,
        location_address: input.locationAddress || null,
      };

      const { data, error } = await supabase
        .from('pulse_posts')
        .insert(insertPayload as never)
        .select()
        .single();

      if (error) throw error;

      // If business event + "add to calendar" checked, create a corresponding event row.
      if (
        input.addToBusinessCalendar &&
        input.businessId &&
        input.postType === 'event' &&
        input.eventDate
      ) {
        const startDateTime = input.eventStartTime
          ? `${input.eventDate}T${input.eventStartTime}`
          : `${input.eventDate}T00:00:00`;
        const endDateTime = input.eventEndTime
          ? `${input.eventDate}T${input.eventEndTime}`
          : undefined;

        await supabase.from('events').insert({
          business_id: input.businessId,
          title: input.content,
          description: input.whyItMatters || null,
          start_date_time: startDateTime,
          end_date_time: endDateTime || null,
          location_text: input.locationName || input.locationText || null,
          status: 'approved',
          pulse_post_id: (data as any).id,
        } as never);
      }

      // Trust score reflects real participation; recompute after posting.
      void (supabase.rpc as any)('recompute_pulse_trust', { p_user_id: user.id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-user-today'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-business-today'] });
      queryClient.invalidateQueries({ queryKey: ['pulse-trust'] });
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
