import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Trash2, Lock, Rocket, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  title: string;
  emoji: string | null;
  description: string | null;
  campaign_type: string;
  point_multiplier: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  challenge: 'Challenge', seasonal: 'Seasonal', passport: 'Passport', double_points: 'Double Points', spotlight: 'Spotlight',
};

const TEMPLATES = [
  { title: 'Downtown Week', emoji: '🏙️', campaign_type: 'challenge', point_multiplier: 2, description: 'Earn double points at Downtown businesses all week.' },
  { title: 'Support Local Saturday', emoji: '🛍️', campaign_type: 'double_points', point_multiplier: 2, description: 'Double Loop Points everywhere this Saturday.' },
  { title: 'Coffee Passport', emoji: '☕', campaign_type: 'passport', point_multiplier: 1, description: 'Visit local coffee shops to fill your passport.' },
  { title: 'Nonprofit Month', emoji: '❤️', campaign_type: 'spotlight', point_multiplier: 1, description: 'Spotlighting Toledo nonprofits and ways to give back.' },
];

const EMPTY = { title: '', emoji: '', description: '', campaign_type: 'challenge', point_multiplier: '2', starts_at: '', ends_at: '' };

export function RewardsAdmin() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_campaigns')
        .select('*')
        .order('is_active', { ascending: false })
        .order('starts_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: can('manage_rewards'),
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('city_campaigns').insert({
        title: form.title.trim(),
        emoji: form.emoji.trim() || null,
        description: form.description.trim() || null,
        campaign_type: form.campaign_type,
        point_multiplier: Number(form.point_multiplier) || 1,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        is_active: false,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      setForm(EMPTY);
      toast.success('Campaign created as a draft. Toggle it live when ready.');
    },
    onError: () => toast.error('Could not create campaign.'),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from('city_campaigns').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] }),
    onError: () => toast.error('Could not update campaign.'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('city_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      toast.success('Campaign deleted.');
    },
    onError: () => toast.error('Could not delete campaign.'),
  });

  if (!can('manage_rewards')) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" /> You don't have rewards access.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Launch */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Rocket className="h-4 w-4 text-primary" /> Launch a campaign</h3>
        <p className="mb-3 text-xs text-muted-foreground">Start from a template or build your own. New campaigns start as drafts.</p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.title}
              onClick={() => setForm({ ...EMPTY, ...tpl, point_multiplier: String(tpl.point_multiplier) })}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground/80 hover:bg-secondary"
            >
              <span>{tpl.emoji}</span> {tpl.title}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2 flex gap-2">
            <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🏙️" className="w-16 text-center" maxLength={4} />
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Campaign title" className="flex-1" maxLength={120} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select value={form.campaign_type} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Point multiplier</Label>
            <Input type="number" min="1" step="0.5" value={form.point_multiplier} onChange={(e) => setForm({ ...form, point_multiplier: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Starts</Label>
            <Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ends</Label>
            <Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </div>
          <Textarea className="sm:col-span-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is this campaign about?" rows={2} maxLength={500} />
        </div>
        <Button className="mt-3 w-full gap-1.5" disabled={!form.title.trim() || create.isPending} onClick={() => create.mutate()}>
          <Sparkles className="h-4 w-4" /> Create campaign
        </Button>
      </div>

      {/* List */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Campaigns</h3>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : !campaigns || campaigns.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-4 text-sm text-muted-foreground shadow-sm">No campaigns yet. Launch one above to energize the city.</p>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-sm">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-lg">{c.emoji || '🎯'}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{c.title}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground')}>{c.is_active ? 'Live' : 'Draft'}</span>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {TYPE_LABELS[c.campaign_type] ?? c.campaign_type}
                    {c.point_multiplier > 1 && <span className="inline-flex items-center gap-0.5"><Coins className="h-3 w-3" />{c.point_multiplier}x</span>}
                    {c.starts_at && <span>· {c.starts_at}{c.ends_at ? ` → ${c.ends_at}` : ''}</span>}
                  </p>
                </div>
                <Switch checked={c.is_active} onCheckedChange={(v) => toggle.mutate({ id: c.id, isActive: v })} />
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive" onClick={() => remove.mutate(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Manual point grants/claw-backs and reward-abuse monitoring build on this and arrive in a later phase.
        </p>
      </div>
    </div>
  );
}
