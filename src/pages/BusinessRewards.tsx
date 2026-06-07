import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Gift,
  Plus,
  Trash2,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Star,
  Briefcase,
  Info,
  Calendar,
  MapPin,
  Ticket,
  Tag,
  Crown,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useBusinessRewards, LoopReward } from '@/hooks/useLoopRewards';
import { useEventAttendees, useCheckInAttendee } from '@/hooks/useEventAttendees';
import {
  REWARD_TEMPLATES,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  getTemplatesByCategory,
  POINT_BANDS,
  RewardTemplate,
} from '@/lib/loop-reward-templates';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type RewardType =
  | 'discount'
  | 'freebie'
  | 'exclusive_event'
  | 'experience'
  | 'raffle_entry'
  | 'vip_upgrade'
  | 'early_access';

interface RewardTypeOption {
  value: RewardType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const REWARD_TYPE_OPTIONS: RewardTypeOption[] = [
  { value: 'discount',        label: 'Discount',        icon: Tag,       description: 'A percentage or dollar-off coupon' },
  { value: 'freebie',         label: 'Freebie',         icon: Sparkles,  description: 'A free item or add-on' },
  { value: 'exclusive_event', label: 'Exclusive Event', icon: Ticket,    description: 'Invite-only event for loyalty members' },
  { value: 'experience',      label: 'Experience',      icon: Star,      description: 'A curated in-person experience' },
  { value: 'raffle_entry',    label: 'Raffle',          icon: Gift,      description: 'Customers buy entries for a prize drawing' },
  { value: 'vip_upgrade',     label: 'VIP Upgrade',     icon: Crown,     description: 'Upgrade to VIP status or treatment' },
];

const EVENT_TYPES = new Set<RewardType>(['exclusive_event', 'experience', 'early_access', 'vip_upgrade']);
const RAFFLE_TYPES = new Set<RewardType>(['raffle_entry']);

const categoryIcons = {
  perk: Sparkles,
  experience: Star,
  service_credit: Briefcase,
};

const categoryColors = {
  perk: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  experience: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  service_credit: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

// ── Form data ────────────────────────────────────────────────────────────────

interface RewardFormData {
  rewardType: RewardType;
  templateId: string;
  customName: string;
  description: string;
  pointsCost: number;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  quantityAvailable: number | null;
  requiresStaffConfirm: boolean;
  isActive: boolean;
  // Event fields
  eventDate: string;
  eventLocation: string;
  capacity: number | null;
  imageUrl: string;
  // Raffle field
  raffleDrawingDate: string;
}

const defaultFormData: RewardFormData = {
  rewardType: 'discount',
  templateId: '',
  customName: '',
  description: '',
  pointsCost: 100,
  dailyLimit: null,
  monthlyLimit: null,
  quantityAvailable: null,
  requiresStaffConfirm: true,
  isActive: true,
  eventDate: '',
  eventLocation: '',
  capacity: null,
  imageUrl: '',
  raffleDrawingDate: '',
};

// ── Attendee sheet ────────────────────────────────────────────────────────────

function AttendeeSheet({
  rewardId,
  rewardName,
  open,
  onClose,
}: {
  rewardId: string;
  rewardName: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: attendees = [], isLoading } = useEventAttendees(open ? rewardId : undefined);
  const checkIn = useCheckInAttendee();

  const checkedIn = attendees.filter((a) => a.status === 'checked_in').length;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Attendees — {rewardName}</SheetTitle>
          <SheetDescription>
            {isLoading ? 'Loading...' : `${checkedIn} / ${attendees.length} checked in`}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : attendees.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No registrations yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attendees.map((attendee) => (
              <div key={attendee.id} className="card-elevated flex items-center gap-3 p-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={attendee.profiles_public?.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {(attendee.profiles_public?.name ?? 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {attendee.profiles_public?.name ?? 'Anonymous'}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono tracking-widest">
                    {attendee.ticket_code}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      attendee.status === 'checked_in'
                        ? 'bg-lokal-forest/10 text-lokal-forest'
                        : attendee.status === 'cancelled'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {attendee.status.replace('_', ' ')}
                  </Badge>
                  {attendee.status === 'registered' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-7 px-2"
                      disabled={checkIn.isPending}
                      onClick={() => checkIn.mutate({ id: attendee.id, rewardId })}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Check In
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function BusinessRewards() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { rewards, isLoading, createReward, updateReward, deleteReward } = useBusinessRewards();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<LoopReward | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'perk' | 'experience' | 'service_credit'>('perk');
  const [formData, setFormData] = useState<RewardFormData>(defaultFormData);
  const [selectedTemplate, setSelectedTemplate] = useState<RewardTemplate | null>(null);
  const [attendeeReward, setAttendeeReward] = useState<LoopReward | null>(null);

  // Step tracker for create flow: 'type' → 'template' → 'customize'
  type CreateStep = 'type' | 'template' | 'customize';
  const [createStep, setCreateStep] = useState<CreateStep>('type');

  const isEventType = EVENT_TYPES.has(formData.rewardType);
  const isRaffleType = RAFFLE_TYPES.has(formData.rewardType);
  const isSimpleType = !isEventType && !isRaffleType;

  const handleSelectRewardType = (type: RewardType) => {
    setFormData({ ...defaultFormData, rewardType: type });
    setSelectedTemplate(null);
    if (isEventType || RAFFLE_TYPES.has(type)) {
      // Skip template selection for events/raffles
      setCreateStep('customize');
    } else {
      setCreateStep('template');
    }
  };

  const handleSelectTemplate = (template: RewardTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      templateId: template.id,
      customName: template.name,
      description: template.description,
      pointsCost: template.suggestedPoints,
    });
    setCreateStep('customize');
  };

  const buildRewardPayload = () => {
    const base = {
      name: formData.customName,
      description: formData.description || null,
      category: (selectedTemplate?.category ?? 'perk') as 'perk' | 'experience' | 'service_credit',
      points_cost: formData.pointsCost,
      daily_limit: formData.dailyLimit,
      monthly_limit: formData.monthlyLimit,
      quantity_available: formData.quantityAvailable,
      is_active: formData.isActive,
      valid_from: null,
      valid_until: null,
      reward_type: formData.rewardType as LoopReward['reward_type'],
      requires_attendance: isEventType || isRaffleType,
      min_tier: null,
    };

    if (isEventType) {
      return {
        ...base,
        event_date: formData.eventDate || null,
        event_location: formData.eventLocation || null,
        capacity: formData.capacity,
        spots_remaining: formData.capacity,
        image_url: formData.imageUrl || null,
        raffle_drawing_date: null,
        raffle_entries_count: 0,
      };
    }
    if (isRaffleType) {
      return {
        ...base,
        event_date: null,
        event_location: null,
        capacity: null,
        spots_remaining: null,
        image_url: null,
        raffle_drawing_date: formData.raffleDrawingDate || null,
        raffle_entries_count: 0,
      };
    }
    return {
      ...base,
      event_date: null,
      event_location: null,
      capacity: null,
      spots_remaining: null,
      image_url: null,
      raffle_drawing_date: null,
      raffle_entries_count: 0,
    };
  };

  const handleCreate = async () => {
    if (!formData.customName.trim()) {
      toast({ title: 'Name required', description: 'Please enter a reward name.', variant: 'destructive' });
      return;
    }
    try {
      await createReward.mutateAsync(buildRewardPayload() as Parameters<typeof createReward.mutateAsync>[0]);
      toast({ title: 'Reward created', description: 'Your new reward is now live.' });
      setShowCreateDialog(false);
      setFormData(defaultFormData);
      setSelectedTemplate(null);
      setCreateStep('type');
    } catch {
      toast({ title: 'Error', description: 'Failed to create reward.', variant: 'destructive' });
    }
  };

  const handleUpdate = async () => {
    if (!editingReward) return;
    try {
      await updateReward.mutateAsync({
        id: editingReward.id,
        name: formData.customName,
        description: formData.description || null,
        points_cost: formData.pointsCost,
        daily_limit: formData.dailyLimit,
        monthly_limit: formData.monthlyLimit,
        quantity_available: formData.quantityAvailable,
        is_active: formData.isActive,
        event_date: formData.eventDate || null,
        event_location: formData.eventLocation || null,
        capacity: formData.capacity,
        image_url: formData.imageUrl || null,
        raffle_drawing_date: formData.raffleDrawingDate || null,
      });
      toast({ title: 'Reward updated', description: 'Changes saved.' });
      setEditingReward(null);
      setFormData(defaultFormData);
    } catch {
      toast({ title: 'Error', description: 'Failed to update reward.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteReward.mutateAsync(deleteConfirmId);
      toast({ title: 'Reward removed' });
      setDeleteConfirmId(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to delete reward.', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (reward: LoopReward) => {
    try {
      await updateReward.mutateAsync({ id: reward.id, is_active: !reward.is_active });
      toast({ title: reward.is_active ? 'Reward paused' : 'Reward activated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    }
  };

  const openEditDialog = (reward: LoopReward) => {
    setEditingReward(reward);
    setFormData({
      rewardType: (reward.reward_type as RewardType) ?? 'discount',
      templateId: '',
      customName: reward.name,
      description: reward.description || '',
      pointsCost: reward.points_cost,
      dailyLimit: reward.daily_limit,
      monthlyLimit: reward.monthly_limit,
      quantityAvailable: reward.quantity_available,
      requiresStaffConfirm: true,
      isActive: reward.is_active,
      eventDate: reward.event_date
        ? new Date(reward.event_date).toISOString().slice(0, 16)
        : '',
      eventLocation: reward.event_location ?? '',
      capacity: reward.capacity,
      imageUrl: reward.image_url ?? '',
      raffleDrawingDate: reward.raffle_drawing_date
        ? new Date(reward.raffle_drawing_date).toISOString().slice(0, 16)
        : '',
    });
    const template = REWARD_TEMPLATES.find((t) => t.category === reward.category);
    if (template) {
      setSelectedTemplate(template);
      setSelectedCategory(reward.category);
    }
  };

  const getPointBounds = () => {
    if (selectedTemplate) return { min: selectedTemplate.minPoints, max: selectedTemplate.maxPoints };
    return POINT_BANDS[selectedCategory];
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
    setFormData(defaultFormData);
    setSelectedTemplate(null);
    setCreateStep('type');
  };

  const eventRewards = rewards.filter((r) =>
    EVENT_TYPES.has((r.reward_type ?? '') as RewardType) ||
    RAFFLE_TYPES.has((r.reward_type ?? '') as RewardType)
  );

  if (isLoading) {
    return (
      <>
        <Header title="Rewards" />
        <PageContainer className="space-y-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Rewards" />
      <PageContainer className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Marketplace Rewards</h1>
            <p className="text-sm text-muted-foreground">
              Create discounts, events, raffles, and experiences
            </p>
          </div>
          <Button onClick={() => { setCreateStep('type'); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Add Reward
          </Button>
        </div>

        {/* Info card */}
        <div className="card-elevated p-4 flex gap-3">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>How it works:</strong> Create any reward type — discounts, events, raffles, VIP perks. Customers redeem via the Loop Marketplace.</p>
            <p>Event spots are deducted automatically on reservation.</p>
          </div>
        </div>

        {/* Rewards list */}
        {rewards.length === 0 ? (
          <div className="card-elevated py-12 text-center">
            <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold mb-1">No rewards yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first reward to let customers redeem their points
            </p>
            <Button onClick={() => { setCreateStep('type'); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" />
              Create First Reward
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => {
              const CategoryIcon = categoryIcons[reward.category] ?? Gift;
              return (
                <div key={reward.id} className={cn('card-elevated p-4', !reward.is_active && 'opacity-60')}>
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', categoryColors[reward.category])}>
                      <CategoryIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold truncate">{reward.name}</h3>
                        <Badge variant="secondary" className={cn('text-xs', categoryColors[reward.category])}>
                          {CATEGORY_LABELS[reward.category]}
                        </Badge>
                        {reward.reward_type && (
                          <Badge variant="secondary" className="text-xs">
                            {reward.reward_type.replace('_', ' ')}
                          </Badge>
                        )}
                        {!reward.is_active && (
                          <Badge variant="secondary" className="text-xs">Paused</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{reward.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium text-primary">{reward.points_cost} pts</span>
                        {reward.event_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(reward.event_date), 'MMM d')}
                          </span>
                        )}
                        {reward.capacity != null && (
                          <span>{reward.spots_remaining ?? reward.capacity}/{reward.capacity} spots</span>
                        )}
                        {reward.raffle_entries_count > 0 && (
                          <span>{reward.raffle_entries_count} entries</span>
                        )}
                        {reward.daily_limit && <span>Daily: {reward.daily_limit}</span>}
                        <span>{reward.quantity_redeemed} redeemed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleToggleActive(reward)}>
                        {reward.is_active ? (
                          <ToggleRight className="h-5 w-5 text-primary" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(reward)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(reward.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Attendee management section */}
        {eventRewards.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Attendee Management
            </h2>
            {eventRewards.map((reward) => (
              <div key={reward.id} className="card-elevated flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{reward.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {reward.reward_type?.replace('_', ' ')}
                    {reward.event_date && ` · ${format(new Date(reward.event_date), 'MMM d')}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs flex-shrink-0"
                  onClick={() => setAttendeeReward(reward)}
                >
                  Manage Attendees
                </Button>
              </div>
            ))}
          </div>
        )}
      </PageContainer>

      {/* ── Create Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) closeCreateDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Reward</DialogTitle>
            <DialogDescription>
              {createStep === 'type'
                ? 'What would you like to offer?'
                : createStep === 'template'
                ? 'Choose a template to get started'
                : 'Customize your reward'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Type selector */}
          {createStep === 'type' && (
            <div className="grid grid-cols-2 gap-2">
              {REWARD_TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleSelectRewardType(opt.value)}
                    className="p-4 rounded-xl border-2 border-transparent bg-muted hover:border-primary hover:bg-primary/5 text-left transition-all"
                  >
                    <Icon className="h-5 w-5 mb-2 text-primary" />
                    <div className="font-medium text-sm text-foreground">{opt.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{opt.description}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Template (simple types only) */}
          {createStep === 'template' && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setCreateStep('type')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <div className="flex gap-2">
                {(['perk', 'experience', 'service_credit'] as const).map((cat) => {
                  const Icon = categoryIcons[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        'flex-1 p-3 rounded-xl border-2 transition-all',
                        selectedCategory === cat
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent bg-muted hover:bg-muted/80'
                      )}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">{CATEGORY_LABELS[cat]}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[selectedCategory]}</p>

              <div className="space-y-2">
                {getTemplatesByCategory(selectedCategory).map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full p-4 rounded-xl border text-left hover:border-primary hover:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-sm text-primary">{template.suggestedPoints} pts</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: {template.minPoints} – {template.maxPoints} pts
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Customize */}
          {createStep === 'customize' && (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => setCreateStep(isEventType || isRaffleType ? 'type' : 'template')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>

              <div className="space-y-2">
                <Label>Reward Name</Label>
                <Input
                  value={formData.customName}
                  onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                  placeholder="e.g. VIP Happy Hour Access"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this reward for customers"
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    {isRaffleType ? 'Points per Entry' : 'Point Cost'}
                  </Label>
                  <span className="text-sm font-medium text-primary">{formData.pointsCost} pts</span>
                </div>
                <Slider
                  value={[formData.pointsCost]}
                  onValueChange={(v) => setFormData({ ...formData, pointsCost: v[0] })}
                  min={getPointBounds().min}
                  max={getPointBounds().max}
                  step={25}
                />
              </div>

              {/* Event-specific fields */}
              {isEventType && (
                <>
                  <div className="space-y-2">
                    <Label>Event Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={formData.eventLocation}
                      onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                      placeholder="Where is this happening?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Capacity (optional)</Label>
                      <Input
                        type="number"
                        value={formData.capacity ?? ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          capacity: e.target.value ? parseInt(e.target.value) : null,
                        })}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cover Image URL (optional)</Label>
                      <Input
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Raffle-specific field */}
              {isRaffleType && (
                <div className="space-y-2">
                  <Label>Drawing Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.raffleDrawingDate}
                    onChange={(e) => setFormData({ ...formData, raffleDrawingDate: e.target.value })}
                  />
                </div>
              )}

              {/* Limits (simple types) */}
              {isSimpleType && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Limit (optional)</Label>
                    <Input
                      type="number"
                      value={formData.dailyLimit ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        dailyLimit: e.target.value ? parseInt(e.target.value) : null,
                      })}
                      placeholder="No limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Limit (optional)</Label>
                    <Input
                      type="number"
                      value={formData.monthlyLimit ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        monthlyLimit: e.target.value ? parseInt(e.target.value) : null,
                      })}
                      placeholder="No limit"
                    />
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={closeCreateDialog}>
                  Cancel
                </Button>
                <Button className="rounded-xl" onClick={handleCreate} disabled={createReward.isPending}>
                  {createReward.isPending ? 'Creating...' : 'Create Reward'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ────────────────────────────────────────────────────── */}
      <Dialog
        open={!!editingReward}
        onOpenChange={(open) => {
          if (!open) {
            setEditingReward(null);
            setFormData(defaultFormData);
            setSelectedTemplate(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reward</DialogTitle>
            <DialogDescription>Update your reward settings</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reward Name</Label>
              <Input
                value={formData.customName}
                onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Point Cost</Label>
                <span className="text-sm font-medium text-primary">{formData.pointsCost} pts</span>
              </div>
              <Slider
                value={[formData.pointsCost]}
                onValueChange={(v) => setFormData({ ...formData, pointsCost: v[0] })}
                min={getPointBounds().min}
                max={getPointBounds().max}
                step={25}
              />
            </div>

            {/* Event fields in edit mode */}
            {editingReward && EVENT_TYPES.has((editingReward.reward_type ?? '') as RewardType) && (
              <>
                <div className="space-y-2">
                  <Label>Event Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.eventLocation}
                    onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      value={formData.capacity ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        capacity: e.target.value ? parseInt(e.target.value) : null,
                      })}
                      placeholder="Unlimited"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Image URL</Label>
                    <Input
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Raffle drawing date in edit mode */}
            {editingReward && RAFFLE_TYPES.has((editingReward.reward_type ?? '') as RewardType) && (
              <div className="space-y-2">
                <Label>Drawing Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.raffleDrawingDate}
                  onChange={(e) => setFormData({ ...formData, raffleDrawingDate: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Limit</Label>
                <Input
                  type="number"
                  value={formData.dailyLimit ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    dailyLimit: e.target.value ? parseInt(e.target.value) : null,
                  })}
                  placeholder="No limit"
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit</Label>
                <Input
                  type="number"
                  value={formData.monthlyLimit ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    monthlyLimit: e.target.value ? parseInt(e.target.value) : null,
                  })}
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
              <div>
                <Label className="font-medium">Active</Label>
                <p className="text-xs text-muted-foreground">Customers can redeem this reward</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setEditingReward(null); setFormData(defaultFormData); }}>
              Cancel
            </Button>
            <Button className="rounded-xl" onClick={handleUpdate} disabled={updateReward.isPending}>
              {updateReward.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirm ────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reward?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Customers will no longer be able to redeem this reward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Attendee Sheet ────────────────────────────────────────────────── */}
      {attendeeReward && (
        <AttendeeSheet
          rewardId={attendeeReward.id}
          rewardName={attendeeReward.name}
          open={!!attendeeReward}
          onClose={() => setAttendeeReward(null)}
        />
      )}
    </>
  );
}
