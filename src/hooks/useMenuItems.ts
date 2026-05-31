import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MenuItem {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  image_url: string | null;
  category: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export function useMenuItems(businessId: string | undefined) {
  return useQuery({
    queryKey: ['menu-items', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await (supabase.from('menu_items' as any) as any)
        .select('*')
        .eq('business_id', businessId)
        .order('category', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!businessId,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Omit<MenuItem, 'id' | 'created_at'>) => {
      const { data, error } = await (supabase.from('menu_items' as any) as any)
        .insert(item)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', data.business_id] });
      toast({ title: 'Menu item added' });
    },
    onError: () => {
      toast({ title: 'Failed to add menu item', variant: 'destructive' });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }) => {
      const { data, error } = await (supabase.from('menu_items' as any) as any)
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', data.business_id] });
    },
    onError: () => {
      toast({ title: 'Failed to update menu item', variant: 'destructive' });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
      const { error } = await (supabase.from('menu_items' as any) as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return businessId;
    },
    onSuccess: (businessId) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', businessId] });
      toast({ title: 'Menu item deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete menu item', variant: 'destructive' });
    },
  });
}

export function useReorderMenuItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number; business_id: string }[]) => {
      const updates = items.map(({ id, sort_order }) =>
        (supabase.from('menu_items' as any) as any).update({ sort_order }).eq('id', id)
      );
      await Promise.all(updates);
      return items[0]?.business_id;
    },
    onSuccess: (businessId) => {
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['menu-items', businessId] });
      }
    },
  });
}

export function formatPrice(cents: number | null): string {
  if (cents === null || cents === undefined) return '';
  return `$${(cents / 100).toFixed(2)}`;
}

export function parsePriceToCents(dollars: string): number | null {
  const cleaned = dollars.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}
