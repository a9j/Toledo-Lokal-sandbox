import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommunityOrg {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  account_type: 'nonprofit' | 'community_partner';
  address: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  neighborhood_id: string | null;
  created_at: string;
  neighborhood?: { id: string; name: string } | null;
}

// Looked up by slug rather than pinned to an id. The hardcoded id this
// replaces exists in production and in no other database, so on the sandbox
// the query matched nothing and the verified organisations section of
// /community was permanently empty with no error to explain it.
const NONPROFITS_COMMUNITY_SLUG = 'nonprofits-community';

interface UseCommunityDirectoryOptions {
  neighborhoodId?: string;
}

export function useCommunityDirectory(options: UseCommunityDirectoryOptions = {}) {
  const { neighborhoodId } = options;

  return useQuery({
    queryKey: ['community-directory', neighborhoodId],
    queryFn: async () => {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', NONPROFITS_COMMUNITY_SLUG)
        .maybeSingle();
      if (categoryError) throw categoryError;
      // No such category means no organisations to list, which is a legitimate
      // empty rather than something to throw over.
      if (!category) return [];
      const categoryId = category.id;

      let query = supabase
        .from('businesses')
        .select(`
          id, name, slug, description,
          address, phone, website, instagram,
          profile_picture_url, cover_image_url, neighborhood_id,
          category, created_at,
          neighborhood:neighborhoods(id, name)
        `)
        .eq('category_id', categoryId)
        .eq('status', 'approved')
        .order('name');

      if (neighborhoodId) {
        query = query.eq('neighborhood_id', neighborhoodId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map(d => ({
        ...d,
        logo_url: (d as Record<string, unknown>).profile_picture_url as string | null,
        account_type: 'nonprofit' as const,
      })) as unknown as CommunityOrg[];
    },
  });
}

export function usePendingVerifications() {
  return useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', NONPROFITS_COMMUNITY_SLUG)
        .maybeSingle();
      if (categoryError) throw categoryError;
      if (!category) return [];

      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id, name, slug, description, status,
          owner_user_id, created_at,
          neighborhood:neighborhoods(id, name)
        `)
        .eq('category_id', category.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []).map(d => ({
        ...d,
        account_type: 'nonprofit' as const,
        verification_status: 'pending' as const,
      }));
    },
  });
}
