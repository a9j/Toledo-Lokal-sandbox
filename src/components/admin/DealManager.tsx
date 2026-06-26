import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SecureImage } from '@/components/ui/secure-image';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  Eye,
  EyeOff,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealManagerProps {
  businessId: string;
}

interface DealRow {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: string;
  image_url: string | null;
  redemption_method: string | null;
  featured: boolean | null;
  created_at: string;
}

interface DealFormState {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  redemptionMethod: string;
  imageUrl: string | null;
}

const EMPTY_FORM: DealFormState = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  redemptionMethod: 'in_store',
  imageUrl: null,
};

const REDEMPTION_OPTIONS = [
  { value: 'in_store', label: 'In-store' },
  { value: 'online', label: 'Online' },
  { value: 'code', label: 'Promo code' },
  { value: 'show_screen', label: 'Show screen' },
];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800' },
  approved: { label: 'Active', className: 'bg-emerald-100 text-emerald-800' },
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  expired: { label: 'Expired', className: 'bg-amber-100 text-amber-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

function useBusinessDeals(businessId: string) {
  return useQuery({
    queryKey: ['admin-business-deals', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as DealRow[];
    },
    enabled: !!businessId,
  });
}

export function DealManager({ businessId }: DealManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: deals, isLoading } = useBusinessDeals(businessId);

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState<DealFormState>(EMPTY_FORM);

  const update = <K extends keyof DealFormState>(key: K, value: DealFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openComposer = () => {
    resetForm();
    const today = new Date().toISOString().split('T')[0] ?? '';
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] ?? '';
    setForm({ ...EMPTY_FORM, startDate: today, endDate: nextWeek });
    setComposerOpen(true);
  };

  const openEditor = (deal: DealRow) => {
    setForm({
      title: deal.title,
      description: deal.description || '',
      startDate: deal.start_date.split('T')[0] ?? '',
      endDate: deal.end_date.split('T')[0] ?? '',
      redemptionMethod: deal.redemption_method || 'in_store',
      imageUrl: deal.image_url,
    });
    setEditingId(deal.id);
    setComposerOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('deals').insert({
        business_id: businessId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.startDate,
        end_date: form.endDate,
        redemption_method: form.redemptionMethod,
        image_url: form.imageUrl,
        status: 'active',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-deals', businessId] });
      toast({ title: 'Deal created' });
      setComposerOpen(false);
      resetForm();
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not create deal', description: e.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('deals')
        .update(data)
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-deals', businessId] });
    },
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.startDate || !form.endDate) return;
    if (editingId) {
      updateMutation.mutate(
        {
          id: editingId,
          data: {
            title: form.title.trim(),
            description: form.description.trim() || null,
            start_date: form.startDate,
            end_date: form.endDate,
            redemption_method: form.redemptionMethod,
            image_url: form.imageUrl,
          },
        },
        {
          onSuccess: () => {
            toast({ title: 'Deal updated' });
            setComposerOpen(false);
            resetForm();
          },
          onError: (e: Error) => {
            toast({ variant: 'destructive', title: 'Could not update', description: e.message });
          },
        }
      );
    } else {
      createMutation.mutate();
    }
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' || currentStatus === 'approved' ? 'draft' : 'active';
    updateMutation.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => toast({ title: newStatus === 'active' ? 'Deal published' : 'Deal hidden' }),
        onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
      }
    );
  };

  const cancelDeal = (id: string) => {
    updateMutation.mutate(
      { id, data: { status: 'cancelled' } },
      {
        onSuccess: () => toast({ title: 'Deal cancelled' }),
        onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
      }
    );
  };

  const canSubmit = form.title.trim().length > 0 && !!form.startDate && !!form.endDate;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const now = new Date();
  const filtered = deals?.filter((d) => {
    const isExpired = new Date(d.end_date) < now && d.status !== 'cancelled';
    if (filter === 'all') return d.status !== 'cancelled';
    if (filter === 'active') return (d.status === 'active' || d.status === 'approved') && !isExpired;
    if (filter === 'expired') return isExpired;
    if (filter === 'cancelled') return d.status === 'cancelled';
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Deals</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage deals, specials, and promotions for your community.
          </p>
        </div>
        <Button onClick={openComposer} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Deal
        </Button>
      </div>

      <div className="flex gap-2">
        {['all', 'active', 'expired', 'cancelled'].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            className="rounded-full text-xs capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {!filtered?.length ? (
        <div className="card-elevated p-8 text-center">
          <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {filter === 'all'
              ? 'No deals yet. Create your first deal to attract customers.'
              : `No ${filter} deals.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((deal) => {
            const endDt = new Date(deal.end_date);
            const startDt = new Date(deal.start_date);
            const isExpired = endDt < now;
            const isActive = (deal.status === 'active' || deal.status === 'approved') && !isExpired;
            const statusKey = isExpired && deal.status !== 'cancelled' ? 'expired' : deal.status;
            const statusInfo = STATUS_LABELS[statusKey] || STATUS_LABELS.active || { label: statusKey, className: '' };

            return (
              <div
                key={deal.id}
                className={cn(
                  'card-elevated p-4 space-y-3',
                  !isActive && 'opacity-70'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{deal.title}</p>
                    {deal.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{deal.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {startDt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {' '}&ndash;{' '}
                        {endDt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {deal.redemption_method && (
                        <span className="capitalize">
                          {REDEMPTION_OPTIONS.find((o) => o.value === deal.redemption_method)?.label || deal.redemption_method}
                        </span>
                      )}
                    </div>
                  </div>
                  {deal.image_url && (
                    <SecureImage
                      src={deal.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-[10px]', statusInfo.className)}>
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="flex gap-1.5 pt-1 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => openEditor(deal)}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => toggleStatus(deal.id, deal.status)}
                  >
                    {isActive ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Publish</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive ml-auto"
                    onClick={() => cancelDeal(deal.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Cancel
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={composerOpen} onOpenChange={(open) => { if (!open) { setComposerOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Deal' : 'New Deal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deal-title">Title</Label>
              <Input
                id="deal-title"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="20% off your first visit, BOGO Tuesday..."
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="deal-desc">Description</Label>
              <Textarea
                id="deal-desc"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Terms, details, or instructions for redeeming"
                rows={3}
                maxLength={500}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => update('endDate', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Redemption method</Label>
              <Select value={form.redemptionMethod} onValueChange={(v) => update('redemptionMethod', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REDEMPTION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image (optional)</Label>
              {form.imageUrl ? (
                <div className="relative inline-block">
                  <SecureImage src={form.imageUrl} alt="" className="w-32 h-20 rounded-lg object-cover border" />
                  <button
                    onClick={() => update('imageUrl', null)}
                    className="absolute -top-1 -right-1 rounded-full bg-destructive text-white w-5 h-5 text-xs flex items-center justify-center"
                  >
                    x
                  </button>
                </div>
              ) : (
                <ImageUpload folder="deals" onUpload={(url) => update('imageUrl', url)} />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setComposerOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!canSubmit || isPending}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...</>
                ) : editingId ? 'Update' : 'Create Deal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
