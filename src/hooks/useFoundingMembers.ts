import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FoundingMember } from '@/components/founding5/types';

// Shape of a row from the founding_members_public view (added in
// 20260526000000_founding_5_schema.sql). Declared here because the generated
// Supabase types do not yet include the new view/columns; once the migration
// is applied and types.ts is regenerated this still compiles unchanged.
interface FoundingBrandRow {
  id: string;
  slug: string | null;
  name: string;
  tier_status: string;
  founding_number: number | null;
  founding_quote: string | null;
  owner_name: string | null;
  owner_image_url: string | null;
  cover_image_url: string | null;
  neighborhood_name: string | null;
}

const FOUNDING_COLUMNS =
  'id, slug, name, tier_status, founding_number, founding_quote, owner_name, owner_image_url, cover_image_url, neighborhood_name';

const toMember = (r: FoundingBrandRow): FoundingMember => ({
  id: r.id,
  slug: r.slug,
  foundingNumber: r.founding_number as number,
  name: r.name,
  ownerName: r.owner_name,
  ownerImageUrl: r.owner_image_url,
  heroImageUrl: r.cover_image_url,
  neighborhood: r.neighborhood_name,
  quote: r.founding_quote,
});

export interface FoundingData {
  founding5: FoundingMember[];
  founding50: FoundingMember[];
}

export function useFoundingMembers() {
  return useQuery<FoundingData>({
    queryKey: ['founding-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        // Cast: the view is not in the generated types yet (see note above).
        .from('founding_members_public' as never)
        .select(FOUNDING_COLUMNS)
        .order('founding_number', { ascending: true })
        .returns<FoundingBrandRow[]>();

      if (error) throw error;

      const rows = data ?? [];
      const founding5 = rows
        .filter((r) => r.tier_status === 'founding_5' && r.founding_number != null)
        .map(toMember);
      const founding50 = rows.filter((r) => r.tier_status === 'founding_50').map(toMember);

      return { founding5, founding50 };
    },
  });
}
