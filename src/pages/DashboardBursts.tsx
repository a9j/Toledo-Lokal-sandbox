import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, Pencil, Zap, ToggleLeft, ToggleRight,
  TrendingUp, Gift, UserPlus, Info, Calendar, Clock
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useBusinessBursts, BurstType, LoopBurst } from '@/hooks/useLoopBursts';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const burstTypeConfig = {
  multiplier: {
    icon: TrendingUp,
    label: 'Multiplier',
    description: 'Multiply the base earning rate (e.g., 2x points)',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  flat_bonus: {
    icon: Gift,
    label: 'Flat Bonus',
    description: 'Add a fixed number of bonus points per scan',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  first_visit: {
    icon: UserPlus,
    label: 'First Visit',
    description: 'Bonus points for customers scanning for the first time',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
};

interface BurstFormData {
  burstType: BurstType;
  name: string;
  description: string;
  multiplier: number;
  bonusPoints: number;
  startsAt: string;
  endsAt: string;
  maxRedemptions: number | null;
  isActive: boolean;
}

const defaultForm: BurstFormData = {
  burstType: 'multiplier',
  name: '',
  description: '',
  multiplier: 2,
  bonusPoints: 50,
  startsAt: '',
  endsAt: '',
  maxRedemptions: null,
  isActive: true,
};

export default function DashboardBursts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bursts, activeBursts, isLoading, createBurst, updateBurst, deleteBurst } = useBusinessBursts();
  const { tier: currentTier, tierConfig } = useSubscription();

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<LoopBurst | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<BurstFormData>(defaultForm);

  // Tier limits
  const maxActiveBursts = tierConfig.limits.maxActiveBursts;
  const maxMultiplier = tierConfig.limits.maxMultiplier;
  const atLimit = maxActiveBursts !== -1 && activeBursts.length >= maxActiveBursts;

  const handleCreate = async () => {
    try {
      await createBurst.mutateAsync({
        burst_type: form.burstType,
        name: form.name,
        description: form.description || null,
        multiplier: form.burstType === 'multiplier' ? form.multiplier : 1,
        bonus_points: form.burstType !== 'multiplier' ? form.bonusPoints : 0,
        starts_at: new Date(form.startsAt).toISOString(),
        ends_at: new Date(form.endsAt).toISOString(),
        recurrence: null,
        recurrence_days: [],
        recurrence_start_time: null,
        recurrence_end_time: null,
        is_active: form.isActive,
        max_redemptions: form.maxRedemptions,
      });
      toast({ title: 'Burst created', description: 'Your point promotion is live!' });
      setShowCreate(false);
      setForm(defaultForm);
    } catch {
      toast({ title: 'Error', description: 'Failed to create burst.', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateBurst.mutateAsync({
        id: editing.id,
        name: form.name,
        description: form.description || null,
        multiplier: form.burstType === 'multiplier' ? form.multiplier : 1,
        bonus_points: form.burstType !== 'multiplier' ? form.bonusPoints : 0,
        starts_at: new Date(form.startsAt).toISOString(),
        ends_at: new Date(form.endsAt).toISOString(),
        max_redemptions: form.maxRedemptions,
        is_active: form.isActive,
      });
      toast({ title: 'Burst updated' });
      setEditing(null);
      setForm(defaultForm);
    } catch {
      toast({ title: 'Error', description: 'Failed to update burst.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBurst.mutateAsync(deleteId);
      toast({ title: 'Burst deleted' });
      setDeleteId(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to delete burst.', variant: 'destructive' });
    }
  };

  const handleToggle = async (burst: LoopBurst) => {
    try {
      await updateBurst.mutateAsync({ id: burst.id, is_active: !burst.is_active });
      toast({ title: burst.is_active ? 'Burst paused' : 'Burst activated' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const openEdit = (burst: LoopBurst) => {
    setEditing(burst);
    setForm({
      burstType: burst.burst_type as BurstType,
      name: burst.name,
      description: burst.description || '',
      multiplier: Number(burst.multiplier),
      bonusPoints: burst.bonus_points,
      startsAt: burst.starts_at.slice(0, 16),
      endsAt: burst.ends_at.slice(0, 16),
      maxRedemptions: burst.max_redemptions,
      isActive: burst.is_active,
    });
  };

  const isFormValid = form.name.trim() && form.startsAt && form.endsAt;
  const now = new Date();

  const getBurstStatus = (b: LoopBurst) => {
    if (!b.is_active) return 'paused';
    if (new Date(b.ends_at) < now) return 'ended';
    if (new Date(b.starts_at) > now) return 'scheduled';
    return 'active';
  };

  if (isLoading) {
    return (
      <>
        <Header title="Bursts" />
        <PageContainer className="space-y-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </PageContainer>
      </>
    );
  }

  const renderForm = () => {
    const cfg = burstTypeConfig[form.burstType];
    return (
      <div className="space-y-4">
        {/* Type selector (create only) */}
        {!editing && (
          <div className="space-y-2">
            <Label>Burst Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(burstTypeConfig) as BurstType[]).map(type => {
                const tc = burstTypeConfig[type];
                const Icon = tc.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setForm({ ...form, burstType: type })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-center",
                      form.burstType === type
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    )}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">{tc.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{cfg.description}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Double Points Tuesday"
          />
        </div>

        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Short description for customers"
            rows={2}
          />
        </div>

        {form.burstType === 'multiplier' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Multiplier</Label>
              <span className="text-sm font-bold text-primary">{form.multiplier}x</span>
            </div>
            <Slider
              value={[form.multiplier]}
              onValueChange={([v]) => setForm({ ...form, multiplier: v })}
              min={1.5}
              max={maxMultiplier}
              step={0.5}
            />
            <p className="text-xs text-muted-foreground">
              Max {maxMultiplier}x on your plan
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Bonus Points</Label>
            <Input
              type="number"
              value={form.bonusPoints}
              onChange={e => setForm({ ...form, bonusPoints: parseInt(e.target.value) || 0 })}
              min={10}
              max={500}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Starts
            </Label>
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={e => setForm({ ...form, startsAt: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Ends
            </Label>
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={e => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Max Redemptions (optional)</Label>
          <Input
            type="number"
            value={form.maxRedemptions ?? ''}
            onChange={e => setForm({ ...form, maxRedemptions: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Unlimited"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Active immediately</Label>
          <Switch
            checked={form.isActive}
            onCheckedChange={v => setForm({ ...form, isActive: v })}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Header title="Bursts" />
      <PageContainer className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Point Bursts
            </h1>
            <p className="text-sm text-muted-foreground">
              Scheduled promotions that boost customer points
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} disabled={atLimit}>
            <Plus className="h-4 w-4 mr-1" /> New Burst
          </Button>
        </div>

        {/* Limit indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" />
          <span>
            {activeBursts.length} / {maxActiveBursts === -1 ? '∞' : maxActiveBursts} active bursts
          </span>
          {atLimit && (
            <Badge variant="secondary" className="text-xs">
              Upgrade for more
            </Badge>
          )}
        </div>

        {/* Info */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>No stacking:</strong> When multiple bursts are active, only the most generous one applies to each scan.</p>
                <p>Bursts draw from your monthly LP allocation.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bursts list */}
        {bursts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold mb-1">No bursts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a burst to drive more visits with bonus points
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> Create First Burst
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bursts.map(burst => {
              const cfg = burstTypeConfig[burst.burst_type as BurstType];
              const Icon = cfg.icon;
              const status = getBurstStatus(burst);
              const statusColors = {
                active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                ended: 'bg-muted text-muted-foreground',
              };

              return (
                <Card key={burst.id} className={cn(status === 'ended' && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cfg.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{burst.name}</h3>
                          <Badge variant="secondary" className={cn("text-xs", statusColors[status])}>
                            {status}
                          </Badge>
                          <Badge variant="secondary" className={cn("text-xs", cfg.color)}>
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {burst.burst_type === 'multiplier' ? (
                            <span className="font-medium text-primary">{Number(burst.multiplier)}x points</span>
                          ) : (
                            <span className="font-medium text-primary">+{burst.bonus_points} pts</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(burst.starts_at), 'MMM d')} – {format(new Date(burst.ends_at), 'MMM d')}
                          </span>
                          <span>{burst.total_redemptions} used</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleToggle(burst)}>
                          {burst.is_active ? (
                            <ToggleRight className="h-5 w-5 text-primary" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(burst)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(burst.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageContainer>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={open => { setShowCreate(open); if (!open) setForm(defaultForm); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Point Burst</DialogTitle>
            <DialogDescription>Set up a scheduled points promotion</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!isFormValid || createBurst.isPending}>
              {createBurst.isPending ? 'Creating...' : 'Create Burst'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={open => { if (!open) { setEditing(null); setForm(defaultForm); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Burst</DialogTitle>
            <DialogDescription>Update your point promotion</DialogDescription>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!isFormValid || updateBurst.isPending}>
              {updateBurst.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={open => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this burst?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
