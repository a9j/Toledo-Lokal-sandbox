import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FoundingMember } from '@/components/founding5/types';

// Reads the founding brands you already have: businesses whose tier_status is
// 'founding_5' / 'founding_50', straight from the live businesses_public view.
// No migration required. The curated extras (owner photo, owner quote, an
// explicit founding number) are filled in later once those columns exist; for
// now positions are derived from when each brand was made founding.
interface BrandRow {
  id: string;
  slug: string | null;
  name: string | null;
  tier_status: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  photos: string[] | null;
  tier_assigned_at: string | null;
  created_at: string | null;
  neighborhood: { name: string | null } | { name: string | null }[] | null;
}

const heroImage = (r: BrandRow): string | null =>
  r.cover_image_url || (r.photos && r.photos[0]) || r.logo_url || null;

const neighborhoodName = (r: BrandRow): string | null => {
  const n = r.neighborhood;
  if (!n) return null;
  return Array.isArray(n) ? (n[0]?.name ?? null) : (n.name ?? null);
};

// Earliest founding brands come first ("the first ones in").
const orderKey = (r: BrandRow): string => r.tier_assigned_at ?? r.created_at ?? '';

export interface FoundingData {
  founding5: FoundingMember[];
  founding50: FoundingMember[];
}

export function useFoundingMembers() {
  return useQuery<FoundingData>({
    queryKey: ['founding-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses_public')
        .select(
          'id, slug, name, tier_status, cover_image_url, logo_url, photos, tier_assigned_at, created_at, neighborhood:neighborhoods(name)',
        )
        .in('tier_status', ['founding_5', 'founding_50']);

      if (error) throw error;

      const rows = (data ?? []) as unknown as BrandRow[];

      const membersFor = (tier: string): FoundingMember[] =>
        rows
          .filter((r) => r.tier_status === tier)
          .sort((a, b) => orderKey(a).localeCompare(orderKey(b)))
          .map((r, i) => ({
            id: r.id,
            slug: r.slug,
            foundingNumber: i + 1,
            name: r.name ?? 'Toledo Original',
            ownerName: null,
            ownerImageUrl: null,
            heroImageUrl: heroImage(r),
            neighborhood: neighborhoodName(r),
            quote: null,
          }));

      return { founding5: membersFor('founding_5'), founding50: membersFor('founding_50') };
    },
  });
}
