import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Lock, Plus, Trash2, Pencil, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface City {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  tagline: string | null;
  primary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  is_active: boolean;
}

const EMPTY = { slug: '', name: '', region: '', tagline: '', primary_color: '#3B82F6', accent_color: '#D4A853', logo_url: '', is_active: true };

export function CitiesAdmin() {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: cities, isLoading } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('cities').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data as City[];
    },
    enabled: can('manage_white_label'),
  });

  const reset = () => { setForm(EMPTY); setEditingId(null); };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        name: form.name.trim(),
        region: form.region.trim() || null,
        tagline: form.tagline.trim() || null,
        primary_color: form.primary_color,
        accent_color: form.accent_color,
        logo_url: form.logo_url.trim() || null,
        is_active: form.is_active,
      };
      if (editingId) {
        const { error } = await supabase.from('cities').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cities').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      toast.success(editingId ? 'City updated.' : 'City added.');
      reset();
    },
    onError: () => toast.error('Could not save city. Slug may already exist.'),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('cities').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-cities'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-cities'] }); toast.success('City removed.'); },
    onError: () => toast.error('Could not remove city.'),
  });

  const startEdit = (c: City) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug, name: c.name, region: c.region ?? '', tagline: c.tagline ?? '',
      primary_color: c.primary_color ?? '#3B82F6', accent_color: c.accent_color ?? '#D4A853',
      logo_url: c.logo_url ?? '', is_active: c.is_active,
    });
  };

  if (!can('manage_white_label')) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" /> White-label management is restricted to platform admins.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
        Each city is an independent tenant with its own branding. Per-city data scoping (so content, rewards, and moderation stay isolated) is the next layer on this foundation.
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-primary" /> {editingId ? 'Edit city' : 'Add a city'}
          </h3>
          {editingId && <button onClick={reset} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /> Cancel</button>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Detroit" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="detroit" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Region</Label>
            <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="MI" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tagline</Label>
            <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="The Motor City" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Primary color</Label>
            <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 p-1" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Accent color</Label>
            <Input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="h-10 p-1" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">Logo URL</Label>
            <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <span className="text-sm">Active</span>
          </div>
        </div>
        <Button className="mt-3 w-full gap-1.5" disabled={!form.name.trim() || !form.slug.trim() || save.isPending} onClick={() => save.mutate()}>
          <Plus className="h-4 w-4" /> {editingId ? 'Save changes' : 'Add city'}
        </Button>
      </div>

      {/* List */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Cities</h3>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {(cities ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: c.primary_color ?? '#3B82F6' }}>
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    {c.region && <span className="text-xs text-muted-foreground">{c.region}</span>}
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground')}>{c.is_active ? 'Active' : 'Off'}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">/{c.slug}{c.tagline ? ` · ${c.tagline}` : ''}</p>
                </div>
                <Switch checked={c.is_active} onCheckedChange={(v) => toggle.mutate({ id: c.id, isActive: v })} />
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive" onClick={() => remove.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
