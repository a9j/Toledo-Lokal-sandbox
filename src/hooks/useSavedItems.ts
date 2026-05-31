import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { triggerPWAFavoriteEvent } from '@/components/pwa/InstallPrompt';

export type SavedItemType = 'business' | 'event' | 'post';

interface SavedItem {
  id: string;
  user_id: string;
  item_type: string;
  item_id: string;
  created_at: string;
}

interface SavedItemWithDetails extends SavedItem {
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    category: { name: string } | null;
  };
  event?: {
    id: string;
    title: string;
    image_url: string | null;
    start_date: string;
  };
  post?: {
    id: string;
    pulse_id: string | null;
    content: string | null;
    headline: string | null;
    hero_image: string | null;
    event_date: string | null;
    post_type: string | null;
  };
}

export function useSavedItems(itemType?: SavedItemType) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedItems = [], isLoading } = useQuery({
    queryKey: ['saved-items', user?.id, itemType],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (itemType) {
        query = query.eq('item_type', itemType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SavedItem[];
    },
    enabled: !!user,
  });

  const { data: savedItemsWithDetails = [], isLoading: isLoadingDetails } = useQuery({
    // Key on the saved item ids so this refetches whenever the saved set
    // changes (otherwise it stays stale after a save/unsave and the new place
    // never shows up).
    queryKey: ['saved-items-details', user?.id, itemType, savedItems.map((i) => i.item_id).sort().join(',')],
    queryFn: async () => {
      if (!user || savedItems.length === 0) return [];

      const businessIds = savedItems
        .filter(item => item.item_type === 'business')
        .map(item => item.item_id);
      
      const eventIds = savedItems
        .filter(item => item.item_type === 'event')
        .map(item => item.item_id);

      const postIds = savedItems
        .filter(item => item.item_type === 'post')
        .map(item => item.item_id);

      const [businessesResult, eventsResult, postsResult] = await Promise.all([
        businessIds.length > 0
          ? supabase
              .from('businesses')
              .select('id, name, logo_url, description, category:categories!category_id(name)')
              .in('id', businessIds)
          : { data: [] },
        eventIds.length > 0
          ? supabase
              .from('events')
              .select('id, title, image_url, start_date')
              .in('id', eventIds)
          : { data: [] },
        postIds.length > 0
          ? supabase
              .from('pulse_posts')
              .select('id, pulse_id, content, headline, hero_image, event_date, post_type')
              .in('id', postIds)
          : { data: [] },
      ]);

      const businessesMap = new Map(
        (businessesResult.data || []).map(b => [b.id, b])
      );
      const eventsMap = new Map(
        (eventsResult.data || []).map(e => [e.id, e])
      );
      const postsMap = new Map(
        ((postsResult.data as { id: string }[]) || []).map(p => [p.id, p])
      );

      return savedItems.map(item => ({
        ...item,
        business: item.item_type === 'business' ? businessesMap.get(item.item_id) : undefined,
        event: item.item_type === 'event' ? eventsMap.get(item.item_id) : undefined,
        post: item.item_type === 'post' ? postsMap.get(item.item_id) : undefined,
      })) as SavedItemWithDetails[];
    },
    enabled: !!user && savedItems.length > 0,
  });

  const saveItem = useMutation({
    mutationFn: async ({ itemId, itemType }: { itemId: string; itemType: SavedItemType }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('saved_items')
        .insert({
          user_id: user.id,
          item_id: itemId,
          item_type: itemType,
        });

      if (error) throw error;
      
      // Generate user pulse for saves (business only)
      if (itemType === 'business') {
        try {
          await supabase.rpc('generate_user_pulse', {
            p_user_id: user.id,
            p_activity_type: 'save',
            p_reference_id: itemId,
            p_business_id: itemId,
            p_content: null,
          });
        } catch (pulseError) {
          // Don't fail the save if pulse generation fails
          console.error('Failed to generate pulse:', pulseError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-toledo-items'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pulse'] });
      toast.success('Saved!');
      // Trigger PWA install prompt after favorites threshold
      triggerPWAFavoriteEvent();
    },
    onError: (error) => {
      console.error('Failed to save item', error);
      toast.error('Failed to save');
    },
  });

  const unsaveItem = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-toledo-items'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast.success('Removed from saved');
    },
    onError: (error) => {
      console.error('Failed to remove item', error);
      toast.error('Failed to remove');
    },
  });

  const isItemSaved = (itemId: string) => {
    return savedItems.some(item => item.item_id === itemId);
  };

  const toggleSave = (itemId: string, itemType: SavedItemType) => {
    if (isItemSaved(itemId)) {
      unsaveItem.mutate(itemId);
    } else {
      saveItem.mutate({ itemId, itemType });
    }
  };

  return {
    savedItems,
    savedItemsWithDetails,
    isLoading: isLoading || isLoadingDetails,
    saveItem,
    unsaveItem,
    isItemSaved,
    toggleSave,
  };
}
