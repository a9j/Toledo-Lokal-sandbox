import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PulseCategory } from '@/lib/pulse-config';
import { PulsePost } from './usePulse';

export interface PulsePostExtended extends PulsePost {
  pulse_id: string;
  headline: string | null;
  preview_text: string | null;
  full_body: string | null;
  author_type: 'user' | 'business' | 'admin';
  business_tier: 'free' | 'paid' | 'admin_only';
  share_enabled: boolean;
  resharing_allowed: boolean;
  anonymous: boolean;
  hero_image: string | null;
}

interface CreatePulsePostExtendedInput {
  category: PulseCategory;
  content: string;
  expirationHours: number;
  locationText?: string;
  businessId?: string;
  isPinned?: boolean;
  // New fields for sharing
  headline?: string;
  previewText?: string;
  fullBody?: string;
  heroImage?: string;
  shareEnabled?: boolean;
  anonymous?: boolean;
}

export function usePulseById(pulseId: string | undefined) {
  return useQuery({
    queryKey: ['pulse-detail', pulseId],
    queryFn: async () => {
      if (!pulseId) throw new Error('Pulse ID required');

      // Try to find by pulse_id first
      let { data, error } = await supabase
        .from('pulse_posts')
        .select(`
          *,
          business:businesses!business_id(id, name, logo_url)
        `)
        .eq('pulse_id', pulseId)
        .maybeSingle();

      if (!data) {
        // Try by regular id
        const result = await supabase
          .from('pulse_posts')
          .select(`
            *,
            business:businesses!business_id(id, name, logo_url)
          `)
          .eq('id', pulseId)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!data) throw new Error('Pulse not found');

      // Fetch author profile if user post
      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id, name, avatar_url')
          .eq('user_id', data.user_id)
          .maybeSingle();
        
        return { ...data, author: profile } as unknown as PulsePostExtended;
      }

      return data as unknown as PulsePostExtended;
    },
    enabled: !!pulseId,
  });
}

export function useUpdatePulseSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      shareEnabled, 
      resharingAllowed 
    }: { 
      postId: string; 
      shareEnabled?: boolean; 
      resharingAllowed?: boolean;
    }) => {
      const updates: Record<string, boolean> = {};
      if (shareEnabled !== undefined) updates.share_enabled = shareEnabled;
      if (resharingAllowed !== undefined) updates.resharing_allowed = resharingAllowed;

      const { error } = await supabase
        .from('pulse_posts')
        .update(updates as Record<string, never>)
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['pulse-detail', postId] });
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
    },
  });
}

// Helper to generate Open Graph metadata for a pulse post
export function generatePulseOGMetadata(post: PulsePostExtended) {
  const baseUrl = window.location.origin;
  
  return {
    title: post.headline || post.content.substring(0, 60),
    description: post.preview_text || post.content.substring(0, 160),
    image: post.hero_image || `${baseUrl}/og-pulse-default.png`,
    url: `${baseUrl}/pulse/${post.pulse_id}`,
    type: 'article' as const,
  };
}
