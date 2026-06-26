import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { StatCard } from '@/components/admin/StatCard';
import {
  Loader2,
  Stamp,
  Users,
  Award,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PassportManagerProps {
  businessId: string;
}

interface StampConfig {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  reward_description: string | null;
  visits_required: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CheckinRow {
  id: string;
  user_id: string;
  business_id: string;
  stamp_id: string | null;
  created_at: string;
  user_profile?: { display_name: string | null; avatar_url: string | null } | null;
}

interface StampFormState {
  name: string;
  description: string;
  rewardDescription: string;
  visitsRequired: number;
}

const DEFAULT_FORM: StampFormState = {
  name: 'Visit',
  description: '',
  rewardDescription: '',
  visitsRequired: 5,
};

function useStampConfig(businessId: string) {
  return useQuery({
    queryKey: ['admin-passport-stamp', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passport_stamps')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();
      if (error) throw error;
      return data as StampConfig | null;
    },
    enabled: !!businessId,
  });
}

function useCheckinStats(businessId: string) {
  return useQuery({
    queryKey: ['admin-passport-stats', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passport_checkins')
        .select('id, user_id, created_at')
        .eq('business_id', businessId);
      if (error) throw error;

      const rows = data || [];
      const totalCheckins = rows.length;
      const uniqueVisitors = new Set(rows.map((r) => r.user_id)).size;

      return { totalCheckins, uniqueVisitors };
    },
    enabled: !!businessId,
  });
}

function useRecentCheckins(businessId: string) {
  return useQuery({
    queryKey: ['admin-passport-recent', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passport_checkins')
        .select('id, user_id, stamp_id, created_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name:name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      return data.map((row) => ({
        ...row,
        user_profile: profileMap.get(row.user_id) || null,
      })) as CheckinRow[];
    },
    enabled: !!businessId,
  });
}

export function PassportManager({ businessId }: PassportManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stamp, isLoading: stampLoading } = useStampConfig(businessId);
  const { data: stats } = useCheckinStats(businessId);
  const { data: recentCheckins } = useRecentCheckins(businessId);

  const [form, setForm] = useState<StampFormState>(DEFAULT_FORM);
  const [editing, setEditing] = useState(false);

  const update = <K extends keyof StampFormState>(key: K, value: StampFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const startEditing = () => {
    if (stamp) {
      setForm({
        name: stamp.name,
        description: stamp.description || '',
        rewardDescription: stamp.reward_description || '',
        visitsRequired: stamp.visits_required,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setEditing(true);
  };

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (stamp) {
        const { error } = await supabase
          .from('passport_stamps')
          .update({
            name: form.name.trim(),
            description: form.description.trim() || null,
            reward_description: form.rewardDescription.trim() || null,
            visits_required: form.visitsRequired,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stamp.id)
          .eq('business_id', businessId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('passport_stamps')
          .insert({
            business_id: businessId,
            name: form.name.trim(),
            description: form.description.trim() || null,
            reward_description: form.rewardDescription.trim() || null,
            visits_required: form.visitsRequired,
            is_active: true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-passport-stamp', businessId] });
      toast({ title: stamp ? 'Stamp card updated' : 'Stamp card created' });
      setEditing(false);
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not save', description: e.message });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async () => {
      if (!stamp) return;
      const { error } = await supabase
        .from('passport_stamps')
        .update({ is_active: !stamp.is_active, updated_at: new Date().toISOString() })
        .eq('id', stamp.id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-passport-stamp', businessId] });
      toast({ title: stamp?.is_active ? 'Stamp card paused' : 'Stamp card activated' });
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Failed', description: e.message });
    },
  });

  if (stampLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight">Passport</h2>
        <p className="text-sm text-muted-foreground">
          Set up your stamp card so visitors earn rewards for repeat visits.
        </p>
      </div>

      {/* Stats */}
      {stamp && stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            icon={Stamp}
            label="Total check-ins"
            value={stats.totalCheckins}
            iconColor="text-primary"
          />
          <StatCard
            icon={Users}
            label="Unique visitors"
            value={stats.uniqueVisitors}
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={Award}
            label="Visits for reward"
            value={stamp.visits_required}
            iconColor="text-amber-600"
          />
        </div>
      )}

      {/* Stamp card config */}
      {!stamp && !editing ? (
        <div className="card-elevated p-8 text-center space-y-3">
          <Stamp className="h-10 w-10 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium text-sm">No stamp card yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create a stamp card to reward repeat visitors. Customers earn a stamp each visit and unlock a reward after reaching the target.
            </p>
          </div>
          <Button onClick={startEditing} className="gap-1.5">
            <Stamp className="h-4 w-4" /> Create Stamp Card
          </Button>
        </div>
      ) : editing ? (
        <div className="card-elevated p-5 space-y-4">
          <h3 className="font-semibold text-sm">
            {stamp ? 'Edit Stamp Card' : 'Create Stamp Card'}
          </h3>
          <div>
            <Label htmlFor="stamp-name">Stamp name</Label>
            <Input
              id="stamp-name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Visit, Coffee, Meal..."
              maxLength={60}
            />
          </div>
          <div>
            <Label htmlFor="stamp-desc">Description (optional)</Label>
            <Textarea
              id="stamp-desc"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="How does it work? e.g. Get a stamp with every purchase"
              rows={2}
              maxLength={300}
              className="resize-none"
            />
          </div>
          <div>
            <Label htmlFor="stamp-visits">Visits required for reward</Label>
            <Input
              id="stamp-visits"
              type="number"
              min={2}
              max={50}
              value={form.visitsRequired}
              onChange={(e) => update('visitsRequired', Math.max(2, parseInt(e.target.value, 10) || 2))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many check-ins before the customer unlocks the reward
            </p>
          </div>
          <div>
            <Label htmlFor="stamp-reward">Reward description</Label>
            <Textarea
              id="stamp-reward"
              value={form.rewardDescription}
              onChange={(e) => update('rewardDescription', e.target.value)}
              placeholder="e.g. Free coffee, 25% off your next visit..."
              rows={2}
              maxLength={300}
              className="resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            <Button
              onClick={() => upsertMutation.mutate()}
              disabled={!form.name.trim() || !form.rewardDescription.trim() || upsertMutation.isPending}
            >
              {upsertMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...</>
              ) : stamp ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      ) : stamp ? (
        <div className="card-elevated p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Stamp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{stamp.name}</h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px]',
                      stamp.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {stamp.is_active ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                {stamp.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{stamp.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={stamp.is_active}
                onCheckedChange={() => toggleActive.mutate()}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Visits required</p>
              <p className="font-semibold text-lg">{stamp.visits_required}</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Reward</p>
              <p className="font-medium text-sm mt-0.5">{stamp.reward_description || 'Not set'}</p>
            </div>
          </div>

          <div className="pt-2">
            <Button size="sm" variant="outline" onClick={startEditing} className="text-xs">
              Edit stamp card
            </Button>
          </div>
        </div>
      ) : null}

      {/* Recent check-ins */}
      {stamp && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Recent check-ins</h3>
          {!recentCheckins?.length ? (
            <div className="card-elevated p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No check-ins yet. Once customers start visiting, their activity will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCheckins.map((checkin) => (
                <div key={checkin.id} className="card-elevated p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    {checkin.user_profile?.avatar_url ? (
                      <img
                        src={checkin.user_profile.avatar_url}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {checkin.user_profile?.display_name || 'Anonymous visitor'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(checkin.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
