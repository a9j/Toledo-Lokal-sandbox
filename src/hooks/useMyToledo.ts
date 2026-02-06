import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SavedItemWithDetails {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  note: string | null;
  sort_order: number;
  created_at: string;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    category: { name: string } | null;
    neighborhood: { name: string } | null;
  };
  event?: {
    id: string;
    title: string;
    image_url: string | null;
    start_date_time: string;
  };
}

interface CollectionSettings {
  id: string;
  user_id: string;
  is_public: boolean;
  public_slug: string | null;
  collection_name: string;
}

export function useMyToledo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch saved items with details
  const { data: savedItems = [], isLoading } = useQuery({
    queryKey: ['my-toledo-items', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Fetch business details
      const businessIds = data
        .filter(item => item.item_type === 'business')
        .map(item => item.item_id);

      const eventIds = data
        .filter(item => item.item_type === 'event')
        .map(item => item.item_id);

      const [businessesResult, eventsResult] = await Promise.all([
        businessIds.length > 0
          ? supabase
              .from('businesses')
              .select('id, name, logo_url, description, category:categories(name), neighborhood:neighborhoods(name)')
              .in('id', businessIds)
          : { data: [] },
        eventIds.length > 0
          ? supabase
              .from('events')
              .select('id, title, image_url, start_date_time')
              .in('id', eventIds)
          : { data: [] },
      ]);

      const businessesMap = new Map(
        (businessesResult.data || []).map(b => [b.id, b])
      );
      const eventsMap = new Map(
        (eventsResult.data || []).map(e => [e.id, e])
      );

      return data.map(item => ({
        ...item,
        business: item.item_type === 'business' ? businessesMap.get(item.item_id) : undefined,
        event: item.item_type === 'event' ? eventsMap.get(item.item_id) : undefined,
      })) as SavedItemWithDetails[];
    },
    enabled: !!user,
  });

  // Collection settings
  const { data: collectionSettings } = useQuery({
    queryKey: ['collection-settings', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_collection_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CollectionSettings | null;
    },
    enabled: !!user,
  });

  // Update item note
  const updateNote = useMutation({
    mutationFn: async ({ itemId, note }: { itemId: string; note: string }) => {
      const { error } = await supabase
        .from('saved_items')
        .update({ note })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-toledo-items'] });
    },
  });

  // Reorder items
  const reorderItems = useMutation({
    mutationFn: async (newOrder: { id: string; sort_order: number }[]) => {
      // Update each item's sort_order
      const updates = newOrder.map(({ id, sort_order }) =>
        supabase
          .from('saved_items')
          .update({ sort_order })
          .eq('id', id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-toledo-items'] });
    },
  });

  // Toggle public sharing
  const togglePublic = useMutation({
    mutationFn: async (makePublic: boolean) => {
      if (!user) throw new Error('Not authenticated');

      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'user';

      if (collectionSettings) {
        // Update existing
        const updates: Partial<CollectionSettings> = { is_public: makePublic };
        
        if (makePublic && !collectionSettings.public_slug) {
          // Generate slug
          const { data: slugData } = await supabase.rpc('generate_collection_slug', {
            user_name: userName,
          });
          updates.public_slug = slugData;
        }

        const { error } = await supabase
          .from('user_collection_settings')
          .update(updates)
          .eq('id', collectionSettings.id);

        if (error) throw error;
      } else {
        // Create new
        let slug = null;
        if (makePublic) {
          const { data: slugData } = await supabase.rpc('generate_collection_slug', {
            user_name: userName,
          });
          slug = slugData;
        }

        const { error } = await supabase
          .from('user_collection_settings')
          .insert({
            user_id: user.id,
            is_public: makePublic,
            public_slug: slug,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, makePublic) => {
      queryClient.invalidateQueries({ queryKey: ['collection-settings'] });
      toast.success(makePublic ? 'Collection is now public!' : 'Collection is now private');
    },
    onError: () => {
      toast.error('Failed to update sharing settings');
    },
  });

  // Remove item
  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-toledo-items'] });
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      toast.success('Removed from collection');
    },
  });

  return {
    savedItems,
    isLoading,
    collectionSettings,
    updateNote,
    reorderItems,
    togglePublic,
    removeItem,
  };
}

// Hook for viewing public collections
export function usePublicCollection(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-collection', slug],
    queryFn: async () => {
      if (!slug) return null;

      // Get collection settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_collection_settings')
        .select('*')
        .eq('public_slug', slug)
        .eq('is_public', true)
        .single();

      if (settingsError) throw settingsError;
      if (!settings) return null;

      // Get saved items
      const { data: items, error: itemsError } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', settings.user_id)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      // Get business details
      const businessIds = (items || [])
        .filter(item => item.item_type === 'business')
        .map(item => item.item_id);

      const { data: businesses } = businessIds.length > 0
        ? await supabase
            .from('businesses')
            .select('id, name, logo_url, description, category:categories(name), neighborhood:neighborhoods(name)')
            .in('id', businessIds)
        : { data: [] };

      const businessesMap = new Map(
        (businesses || []).map(b => [b.id, b])
      );

      return {
        settings,
        items: (items || []).map(item => ({
          ...item,
          business: item.item_type === 'business' ? businessesMap.get(item.item_id) : undefined,
        })),
      };
    },
    enabled: !!slug,
  });
}
