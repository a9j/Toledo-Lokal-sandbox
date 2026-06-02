import { useState } from 'react';
import {
  useMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  formatPrice,
  parsePriceToCents,
  MenuItem,
} from '@/hooks/useMenuItems';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, ImagePlus, X, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';

interface MenuManagerProps {
  businessId: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  is_available: boolean;
  image_url: string;
}

const defaultForm: FormData = {
  name: '',
  description: '',
  price: '',
  category: '',
  is_available: true,
  image_url: '',
};

export function MenuManager({ businessId }: MenuManagerProps) {
  const { data: items, isLoading } = useMenuItems(businessId);
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [uploading, setUploading] = useState(false);

  const openCreate = () => {
    setForm(defaultForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price_cents !== null ? (item.price_cents / 100).toFixed(2) : '',
      category: item.category || '',
      is_available: item.is_available,
      image_url: item.image_url || '',
    });
    setEditingId(item.id);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${businessId}/menu/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('business-media')
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('business-media')
      .getPublicUrl(path);

    setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const payload = {
      business_id: businessId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price_cents: parsePriceToCents(form.price),
      category: form.category.trim() || null,
      is_available: form.is_available,
      image_url: form.image_url || null,
      sort_order: editingId ? undefined! : (items?.length || 0),
    };

    if (editingId) {
      const { business_id, sort_order, ...updates } = payload;
      updateItem.mutate({ id: editingId, ...updates });
    } else {
      createItem.mutate(payload as Omit<MenuItem, 'id' | 'created_at'>);
    }
    setDialogOpen(false);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    updateItem.mutate({ id: item.id, is_available: !item.is_available });
  };

  const categories = items
    ? [...new Set(items.map(i => i.category).filter(Boolean))]
    : [];

  const grouped = items
    ? categories.length > 0
      ? categories.map(cat => ({
          category: cat!,
          items: items.filter(i => i.category === cat),
        })).concat(
          items.some(i => !i.category)
            ? [{ category: 'Other', items: items.filter(i => !i.category) }]
            : []
        )
      : [{ category: '', items: items }]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={openCreate}>
        <Plus className="h-4 w-4 mr-2" />
        Add Menu Item
      </Button>

      {items && items.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No menu items yet</p>
          <p className="text-sm">Add your dishes, drinks, and specials</p>
        </div>
      )}

      {grouped.map(group => (
        <div key={group.category} className="space-y-2">
          {group.category && (
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide pt-2">
              {group.category}
            </h3>
          )}
          {group.items.map(item => (
            <div
              key={item.id}
              className="card-elevated p-3 flex items-start gap-3"
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{item.name}</span>
                  {!item.is_available && (
                    <Badge variant="secondary" className="text-[10px]">Sold out</Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                )}
                {item.price_cents !== null && (
                  <p className="text-sm font-semibold mt-0.5">
                    {formatPrice(item.price_cents)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Switch
                  checked={item.is_available}
                  onCheckedChange={() => handleToggleAvailability(item)}
                  className="scale-75"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{item.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteItem.mutate({ id: item.id, businessId })}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name *</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Classic Burger"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <Textarea
                id="item-description"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">Price ($)</Label>
                <Input
                  id="item-price"
                  value={form.price}
                  onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="9.99"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Input
                  id="item-category"
                  value={form.category}
                  onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g. Tacos"
                  list="menu-categories"
                />
                {categories.length > 0 && (
                  <datalist id="menu-categories">
                    {categories.map(c => <option key={c} value={c!} />)}
                  </datalist>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Photo</Label>
              {form.image_url ? (
                <div className="relative w-24 h-24">
                  <img src={form.image_url} alt="" className="w-full h-full rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  <span>{uploading ? 'Uploading...' : 'Add photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="item-available">Available</Label>
              <Switch
                id="item-available"
                checked={form.is_available}
                onCheckedChange={v => setForm(prev => ({ ...prev, is_available: v }))}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createItem.isPending || updateItem.isPending}
            >
              {editingId ? 'Save Changes' : 'Add Item'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
