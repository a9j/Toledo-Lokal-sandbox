import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BlockType,
  PresetId,
  buildPresetBlocks,
} from '@/lib/profile-blocks';

export interface ProfileBlockRow {
  id: string;
  business_id: string;
  block_type: BlockType;
  enabled: boolean;
  sort_order: number;
  config: Record<string, unknown>;
}

/**
 * Read + manage a business's profile blocks. The block set is seeded from a
 * preset (during onboarding) and owners can toggle/reorder afterwards.
 */
export function useProfileBlocks(businessId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile-blocks', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_blocks')
        .select('id, business_id, block_type, enabled, sort_order, config')
        .eq('business_id', businessId as string)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as ProfileBlockRow[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['profile-blocks', businessId] });
  };

  /** Seed the block set from a preset. Idempotent: replaces any existing rows. */
  const seedFromPreset = useMutation({
    mutationFn: async (presetId: PresetId) => {
      if (!businessId) throw new Error('No business id');
      await supabase.from('profile_blocks').delete().eq('business_id', businessId);
      const rows = buildPresetBlocks(presetId).map((b) => ({ ...b, business_id: businessId }));
      const { error } = await supabase.from('profile_blocks').insert(rows);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleBlock = useMutation({
    mutationFn: async ({ blockType, enabled }: { blockType: BlockType; enabled: boolean }) => {
      if (!businessId) throw new Error('No business id');
      const { error } = await supabase
        .from('profile_blocks')
        .update({ enabled })
        .eq('business_id', businessId)
        .eq('block_type', blockType);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Persist a new order. `orderedBlockTypes` is the full top-to-bottom order. */
  const reorderBlocks = useMutation({
    mutationFn: async (orderedBlockTypes: BlockType[]) => {
      if (!businessId) throw new Error('No business id');
      await Promise.all(
        orderedBlockTypes.map((blockType, i) =>
          supabase
            .from('profile_blocks')
            .update({ sort_order: i })
            .eq('business_id', businessId)
            .eq('block_type', blockType)
        )
      );
    },
    onSuccess: invalidate,
  });

  return { ...query, seedFromPreset, toggleBlock, reorderBlocks };
}
