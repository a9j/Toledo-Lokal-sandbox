import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Info
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useBusinessRewards, LoopReward } from '@/hooks/useLoopRewards';
import { useBusinessGate } from '@/hooks/useBusinessGate';
import { loopEnabled, LOOP_UPGRADE_NUDGE } from '@/lib/business-access';
import { 
  REWARD_TEMPLATES, 
  CATEGORY_LABELS, 
  CATEGORY_DESCRIPTIONS,
  getTemplatesByCategory,
  getTemplateById,
  POINT_BANDS,
  RewardTemplate 
} from '@/lib/loop-reward-templates';
import { cn } from '@/lib/utils';

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

interface RewardFormData {
  templateId: string;
  customName: string;
  description: string;
  pointsCost: number;
  dailyLimit: number | null;
  monthlyLimit: number | null;
  quantityAvailable: number | null;
  requiresStaffConfirm: boolean;
  isActive: boolean;
}

const defaultFormData: RewardFormData = {
  templateId: '',
  customName: '',
  description: '',
  pointsCost: 100,
  dailyLimit: null,
  monthlyLimit: null,
  quantityAvailable: null,
  requiresStaffConfirm: true,
  isActive: true,
};

export default function BusinessRewards() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { rewards, isLoading, createReward, updateReward, deleteReward } = useBusinessRewards();
  const { data: gate } = useBusinessGate();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<LoopReward | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'perk' | 'experience' | 'service_credit'>('perk');
  const [formData, setFormData] = useState<RewardFormData>(defaultFormData);
  const [selectedTemplate, setSelectedTemplate] = useState<RewardTemplate | null>(null);

  const handleSelectTemplate = (template: RewardTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      ...formData,
      templateId: template.id,
      customName: template.name,
      description: template.description,
      pointsCost: template.suggestedPoints,
    });
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;

    try {
      await createReward.mutateAsync({
        name: formData.customName || selectedTemplate.name,
        description: formData.description || selectedTemplate.description,
        category: selectedTemplate.category,
        points_cost: formData.pointsCost,
        daily_limit: formData.dailyLimit,
        monthly_limit: formData.monthlyLimit,
        quantity_available: formData.quantityAvailable,
        is_active: formData.isActive,
        valid_from: null,
        valid_until: null,
      });

      toast({
        title: 'Reward created',
        description: 'Your new reward is now available for customers.',
      });

      setShowCreateDialog(false);
      setFormData(defaultFormData);
      setSelectedTemplate(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create reward.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingReward) return;

    try {
      await updateReward.mutateAsync({
        id: editingReward.id,
        name: formData.customName,
        description: formData.description,
        points_cost: formData.pointsCost,
        daily_limit: formData.dailyLimit,
        monthly_limit: formData.monthlyLimit,
        quantity_available: formData.quantityAvailable,
        is_active: formData.isActive,
      });

      toast({
        title: 'Reward updated',
        description: 'Your changes have been saved.',
      });

      setEditingReward(null);
      setFormData(defaultFormData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update reward.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteReward.mutateAsync(deleteConfirmId);
      toast({
        title: 'Reward removed',
        description: 'The reward has been deleted.',
      });
      setDeleteConfirmId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete reward.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (reward: LoopReward) => {
    try {
      await updateReward.mutateAsync({
        id: reward.id,
        is_active: !reward.is_active,
      });
      toast({
        title: reward.is_active ? 'Reward paused' : 'Reward activated',
        description: reward.is_active 
          ? 'Customers can no longer redeem this reward.' 
          : 'Customers can now redeem this reward.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update reward status.',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (reward: LoopReward) => {
    setEditingReward(reward);
    setFormData({
      templateId: '',
      customName: reward.name,
      description: reward.description || '',
      pointsCost: reward.points_cost,
      dailyLimit: reward.daily_limit,
      monthlyLimit: reward.monthly_limit,
      quantityAvailable: reward.quantity_available,
      requiresStaffConfirm: true,
      isActive: reward.is_active,
    });
    // Find matching template for point bounds
    const template = REWARD_TEMPLATES.find(t => t.category === reward.category);
    if (template) {
      setSelectedTemplate(template);
      setSelectedCategory(reward.category);
    }
  };

  const getPointBounds = () => {
    if (selectedTemplate) {
      return { min: selectedTemplate.minPoints, max: selectedTemplate.maxPoints };
    }
    return POINT_BANDS[selectedCategory];
  };

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

  // Setting up redemption rewards is a paid-plan feature. Free (Community) is
  // "Visible Only": no Loop participation. Show an upgrade nudge instead.
  if (gate && !loopEnabled(gate.tier_status)) {
    return (
      <>
        <Header title="Rewards" />
        <PageContainer className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">{LOOP_UPGRADE_NUDGE}</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Upgrade your plan to set up rewards customers can redeem with their Loop Points.
              </p>
              <Button onClick={() => navigate('/dashboard/subscription')}>
                View plans
              </Button>
            </CardContent>
          </Card>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Rewards" />
      <PageContainer className="space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="-ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Redemption Rewards</h1>
            <p className="text-sm text-muted-foreground">
              Choose what customers can redeem with their points
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Reward
          </Button>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>How it works:</strong> Select from reward templates with preset point ranges. Set limits to control volume.</p>
                <p>Customers redeem via QR code confirmation — no screenshots, no abuse.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards List */}
        {rewards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold mb-1">No rewards yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first reward to let customers redeem their points
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create First Reward
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => {
              const CategoryIcon = categoryIcons[reward.category];
              return (
                <Card key={reward.id} className={cn(!reward.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        categoryColors[reward.category]
                      )}>
                        <CategoryIcon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{reward.name}</h3>
                          <Badge variant="secondary" className={cn("text-xs", categoryColors[reward.category])}>
                            {CATEGORY_LABELS[reward.category]}
                          </Badge>
                          {!reward.is_active && (
                            <Badge variant="secondary" className="text-xs">Paused</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {reward.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="font-medium text-primary">{reward.points_cost} pts</span>
                          {reward.daily_limit && <span>Daily: {reward.daily_limit}</span>}
                          {reward.monthly_limit && <span>Monthly: {reward.monthly_limit}</span>}
                          <span>{reward.quantity_redeemed} redeemed</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(reward)}
                        >
                          {reward.is_active ? (
                            <ToggleRight className="h-5 w-5 text-primary" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(reward)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(reward.id)}
                        >
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
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setFormData(defaultFormData);
          setSelectedTemplate(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Reward</DialogTitle>
            <DialogDescription>
              Choose a reward template and customize it for your business
            </DialogDescription>
          </DialogHeader>

          {!selectedTemplate ? (
            <div className="space-y-4">
              {/* Category Tabs */}
              <div className="flex gap-2">
                {(['perk', 'experience', 'service_credit'] as const).map((cat) => {
                  const Icon = categoryIcons[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "flex-1 p-3 rounded-xl border-2 transition-all",
                        selectedCategory === cat 
                          ? "border-primary bg-primary/5" 
                          : "border-transparent bg-muted hover:bg-muted/80"
                      )}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <div className="text-xs font-medium">{CATEGORY_LABELS[cat]}</div>
                    </button>
                  );
                })}
              </div>

              <p className="text-sm text-muted-foreground">
                {CATEGORY_DESCRIPTIONS[selectedCategory]}
              </p>

              {/* Templates */}
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
                      Range: {template.minPoints} - {template.maxPoints} points
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTemplate(null)}
                className="-ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Choose different template
              </Button>

              {/* Customize Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Reward Name</Label>
                  <Input
                    value={formData.customName}
                    onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
                    placeholder={selectedTemplate.name}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={selectedTemplate.description}
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
                  <p className="text-xs text-muted-foreground">
                    Range: {getPointBounds().min} - {getPointBounds().max} points
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Limit (optional)</Label>
                    <Input
                      type="number"
                      value={formData.dailyLimit || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        dailyLimit: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      placeholder="No limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monthly Limit (optional)</Label>
                    <Input
                      type="number"
                      value={formData.monthlyLimit || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        monthlyLimit: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Total Quantity Available (optional)</Label>
                  <Input
                    type="number"
                    value={formData.quantityAvailable || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      quantityAvailable: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreateDialog(false);
                  setFormData(defaultFormData);
                  setSelectedTemplate(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createReward.isPending}>
                  {createReward.isPending ? 'Creating...' : 'Create Reward'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingReward} onOpenChange={(open) => {
        if (!open) {
          setEditingReward(null);
          setFormData(defaultFormData);
          setSelectedTemplate(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Reward</DialogTitle>
            <DialogDescription>
              Update your reward settings
            </DialogDescription>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Limit</Label>
                <Input
                  type="number"
                  value={formData.dailyLimit || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dailyLimit: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="No limit"
                />
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit</Label>
                <Input
                  type="number"
                  value={formData.monthlyLimit || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    monthlyLimit: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="No limit"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Total Quantity Available</Label>
              <Input
                type="number"
                value={formData.quantityAvailable || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  quantityAvailable: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Unlimited"
              />
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
            <Button variant="outline" onClick={() => {
              setEditingReward(null);
              setFormData(defaultFormData);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateReward.isPending}>
              {updateReward.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reward?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Customers will no longer be able to redeem this reward.
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
    </>
  );
}
