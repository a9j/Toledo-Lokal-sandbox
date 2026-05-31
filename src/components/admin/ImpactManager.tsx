import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImpactManagerProps {
  businessId: string;
}

interface MetricRow {
  id: string;
  business_id: string;
  metric_type: string;
  label: string;
  value: number;
  unit: string | null;
  period_start: string | null;
  period_end: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface MetricFormState {
  metricType: string;
  label: string;
  value: string;
  unit: string;
  periodStart: string;
  periodEnd: string;
  notes: string;
}

const EMPTY_FORM: MetricFormState = {
  metricType: 'community',
  label: '',
  value: '',
  unit: '',
  periodStart: '',
  periodEnd: '',
  notes: '',
};

const METRIC_TYPES = [
  { value: 'community', label: 'Community' },
  { value: 'environment', label: 'Environment' },
  { value: 'economic', label: 'Economic' },
  { value: 'education', label: 'Education' },
  { value: 'health', label: 'Health' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'donation', label: 'Donation' },
  { value: 'custom', label: 'Custom' },
];

const TYPE_COLORS: Record<string, string> = {
  community: 'text-primary',
  environment: 'text-emerald-600',
  economic: 'text-amber-600',
  education: 'text-blue-600',
  health: 'text-rose-600',
  volunteer: 'text-purple-600',
  donation: 'text-orange-600',
  custom: 'text-slate-600',
};

function useImpactMetrics(businessId: string) {
  return useQuery({
    queryKey: ['admin-impact-metrics', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('impact_metrics')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as MetricRow[];
    },
    enabled: !!businessId,
  });
}

export function ImpactManager({ businessId }: ImpactManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: metrics, isLoading } = useImpactMetrics(businessId);

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MetricFormState>(EMPTY_FORM);

  const update = <K extends keyof MetricFormState>(key: K, value: MetricFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openComposer = () => {
    resetForm();
    setComposerOpen(true);
  };

  const openEditor = (metric: MetricRow) => {
    setForm({
      metricType: metric.metric_type,
      label: metric.label,
      value: metric.value.toString(),
      unit: metric.unit || '',
      periodStart: metric.period_start || '',
      periodEnd: metric.period_end || '',
      notes: metric.notes || '',
    });
    setEditingId(metric.id);
    setComposerOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('impact_metrics').insert({
        business_id: businessId,
        metric_type: form.metricType,
        label: form.label.trim(),
        value: parseFloat(form.value) || 0,
        unit: form.unit.trim() || null,
        period_start: form.periodStart || null,
        period_end: form.periodEnd || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-impact-metrics', businessId] });
      toast({ title: 'Impact metric added' });
      setComposerOpen(false);
      resetForm();
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not save', description: e.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('impact_metrics')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-impact-metrics', businessId] });
    },
  });

  const handleSave = () => {
    if (!form.label.trim() || !form.value) return;
    if (editingId) {
      updateMutation.mutate(
        {
          id: editingId,
          data: {
            metric_type: form.metricType,
            label: form.label.trim(),
            value: parseFloat(form.value) || 0,
            unit: form.unit.trim() || null,
            period_start: form.periodStart || null,
            period_end: form.periodEnd || null,
            notes: form.notes.trim() || null,
          },
        },
        {
          onSuccess: () => {
            toast({ title: 'Metric updated' });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('impact_metrics')
        .delete()
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-impact-metrics', businessId] });
      toast({ title: 'Metric removed' });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not delete', description: e.message });
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const canSubmit = form.label.trim().length > 0 && form.value.length > 0;
  const isPending = createMutation.isPending || updateMutation.isPending;

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
          <h2 className="font-display text-lg font-bold tracking-tight">Impact</h2>
          <p className="text-sm text-muted-foreground">
            Track and share your community impact. These metrics appear on your public profile.
          </p>
        </div>
        <Button onClick={openComposer} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Metric
        </Button>
      </div>

      {!metrics?.length ? (
        <div className="card-elevated p-8 text-center space-y-3">
          <Heart className="h-10 w-10 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium text-sm">No impact metrics yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Track your contributions to Toledo -- volunteer hours, donations, jobs created, meals served, and more. Impact metrics show on your public profile.
            </p>
          </div>
          <Button onClick={openComposer} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add your first metric
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => {
            const typeLabel = METRIC_TYPES.find((t) => t.value === metric.metric_type)?.label || metric.metric_type;
            const color = TYPE_COLORS[metric.metric_type] || TYPE_COLORS.custom;

            return (
              <div key={metric.id} className="card-elevated p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className={cn('h-4 w-4 shrink-0', color)} />
                      <p className="font-medium text-sm truncate">{metric.label}</p>
                    </div>
                    <div className="mt-1">
                      <span className="text-2xl font-bold tabular-nums">
                        {metric.value.toLocaleString()}
                      </span>
                      {metric.unit && (
                        <span className="text-sm text-muted-foreground ml-1">{metric.unit}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize shrink-0">{typeLabel}</span>
                </div>

                {(metric.period_start || metric.notes) && (
                  <div className="text-xs text-muted-foreground">
                    {metric.period_start && (
                      <p>
                        {new Date(metric.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {metric.period_end && ` -- ${new Date(metric.period_end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                      </p>
                    )}
                    {metric.notes && <p className="mt-0.5 line-clamp-2">{metric.notes}</p>}
                  </div>
                )}

                <div className="flex gap-1.5 pt-1 border-t border-border/50">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openEditor(metric)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive ml-auto"
                    onClick={() => handleDelete(metric.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={composerOpen} onOpenChange={(open) => { if (!open) { setComposerOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Metric' : 'Add Impact Metric'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={form.metricType} onValueChange={(v) => update('metricType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRIC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="metric-label">Label</Label>
              <Input
                id="metric-label"
                value={form.label}
                onChange={(e) => update('label', e.target.value)}
                placeholder="e.g. Volunteer hours, Meals served, Trees planted"
                maxLength={100}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => update('value', e.target.value)}
                  placeholder="500"
                  min={0}
                />
              </div>
              <div>
                <Label>Unit (optional)</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => update('unit', e.target.value)}
                  placeholder="hours, meals, lbs, dollars"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Period start (optional)</Label>
                <Input
                  type="date"
                  value={form.periodStart}
                  onChange={(e) => update('periodStart', e.target.value)}
                />
              </div>
              <div>
                <Label>Period end (optional)</Label>
                <Input
                  type="date"
                  value={form.periodEnd}
                  onChange={(e) => update('periodEnd', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Context or details about this metric"
                rows={2}
                maxLength={300}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setComposerOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!canSubmit || isPending}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...</>
                ) : editingId ? 'Update' : 'Add Metric'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
