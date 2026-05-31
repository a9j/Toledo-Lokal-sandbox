import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessJobs, useCreateJob, useDeleteJob, type JobType, type PayType, type ApplyMethod } from '@/hooks/useJobs';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Briefcase,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobManagerProps {
  businessId: string;
}

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'entry-level', label: 'Entry-level' },
  { value: 'skilled-trades', label: 'Skilled Trades' },
  { value: 'internship', label: 'Internship' },
  { value: 'gig', label: 'Gig' },
];

const PAY_TYPES: { value: PayType; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
  { value: 'flat-rate', label: 'Flat Rate' },
  { value: 'tips', label: 'Tips' },
];

const APPLY_METHODS: { value: ApplyMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'link', label: 'External Link' },
];

interface JobFormState {
  title: string;
  jobType: JobType;
  payMin: string;
  payMax: string;
  payType: PayType;
  schedule: string;
  description: string;
  startDate: string;
  hiringNow: boolean;
  applyMethod: ApplyMethod;
  applyContact: string;
}

const EMPTY_FORM: JobFormState = {
  title: '',
  jobType: 'part-time',
  payMin: '',
  payMax: '',
  payType: 'hourly',
  schedule: '',
  description: '',
  startDate: '',
  hiringNow: true,
  applyMethod: 'email',
  applyContact: '',
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  approved: { label: 'Active', className: 'bg-emerald-100 text-emerald-800' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
  filled: { label: 'Filled', className: 'bg-slate-100 text-slate-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
  expired: { label: 'Expired', className: 'bg-amber-100 text-amber-800' },
};

export function JobManager({ businessId }: JobManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: jobs, isLoading } = useBusinessJobs(businessId);
  const createJob = useCreateJob();
  const deleteJob = useDeleteJob();

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);

  const updateField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openComposer = () => {
    resetForm();
    setComposerOpen(true);
  };

  const openEditor = (job: NonNullable<typeof jobs>[number]) => {
    setForm({
      title: job.title,
      jobType: job.job_type as JobType,
      payMin: job.pay_min?.toString() || '',
      payMax: job.pay_max?.toString() || '',
      payType: (job.pay_type as PayType) || 'hourly',
      schedule: job.schedule || '',
      description: job.description || '',
      startDate: job.start_date || '',
      hiringNow: job.hiring_now,
      applyMethod: job.apply_method as ApplyMethod,
      applyContact: job.apply_contact,
    });
    setEditingId(job.id);
    setComposerOpen(true);
  };

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('jobs')
        .update(data)
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-jobs'] });
    },
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.applyContact.trim()) return;

    const payload = {
      title: form.title.trim(),
      job_type: form.jobType,
      pay_min: form.payMin ? Number(form.payMin) : null,
      pay_max: form.payMax ? Number(form.payMax) : null,
      pay_type: form.payType,
      schedule: form.schedule.trim() || null,
      description: form.description.trim() || null,
      start_date: form.startDate || null,
      hiring_now: form.hiringNow,
      apply_method: form.applyMethod,
      apply_contact: form.applyContact.trim(),
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: 'Job updated' });
            setComposerOpen(false);
            resetForm();
          },
          onError: (e: Error) => {
            toast({ variant: 'destructive', title: 'Could not update', description: e.message });
          },
        }
      );
    } else {
      createJob.mutate(
        { ...payload, business_id: businessId },
        {
          onSuccess: () => {
            toast({ title: 'Job posted' });
            setComposerOpen(false);
            resetForm();
          },
          onError: (e: Error) => {
            toast({ variant: 'destructive', title: 'Could not create', description: e.message });
          },
        }
      );
    }
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'filled' : 'approved';
    updateMutation.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => toast({ title: newStatus === 'approved' ? 'Job reactivated' : 'Marked as filled' }),
        onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteJob.mutate(id, {
      onSuccess: () => toast({ title: 'Job removed' }),
      onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
    });
  };

  const canSubmit = form.title.trim().length > 0 && form.applyContact.trim().length > 0;
  const isPending = createJob.isPending || updateMutation.isPending;

  const filtered = jobs?.filter((j) => {
    if (filter === 'all') return true;
    if (filter === 'active') return j.status === 'approved';
    if (filter === 'filled') return j.status === 'filled';
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
          <h2 className="font-display text-lg font-bold tracking-tight">Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Post openings and manage your hiring.
          </p>
        </div>
        <Button onClick={openComposer} className="gap-1.5">
          <Plus className="h-4 w-4" /> Post Job
        </Button>
      </div>

      <div className="flex gap-2">
        {['all', 'active', 'filled'].map((f) => (
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
          <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {filter === 'all'
              ? 'No job postings yet. Post your first opening to start hiring.'
              : `No ${filter} jobs.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const statusInfo = STATUS_LABELS[job.status] || STATUS_LABELS.approved;
            const payLabel = job.pay_min
              ? `$${job.pay_min}${job.pay_max ? `–$${job.pay_max}` : '+'}/${job.pay_type === 'salary' ? 'yr' : 'hr'}`
              : null;

            return (
              <div key={job.id} className={cn('card-elevated p-4 space-y-3', job.status === 'filled' && 'opacity-70')}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{job.title}</p>
                      {job.hiring_now && (
                        <Badge variant="outline" className="text-[10px] gap-0.5">
                          <Zap className="h-2.5 w-2.5" /> Hiring Now
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span>{JOB_TYPES.find((t) => t.value === job.job_type)?.label}</span>
                      {payLabel && <span>{payLabel}</span>}
                      {job.schedule && <span>{job.schedule}</span>}
                    </div>
                    {job.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-[10px]', statusInfo.className)}>
                    {statusInfo.label}
                  </Badge>
                  {job.view_count > 0 && (
                    <span className="text-[10px] text-muted-foreground">{job.view_count} views</span>
                  )}
                </div>

                <div className="flex gap-1.5 pt-1 border-t border-border/50">
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openEditor(job)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => toggleStatus(job.id, job.status)}>
                    {job.status === 'approved' ? <><EyeOff className="h-3 w-3" /> Mark Filled</> : <><Eye className="h-3 w-3" /> Reactivate</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive ml-auto"
                    onClick={() => handleDelete(job.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
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
            <DialogTitle>{editingId ? 'Edit Job' : 'Post a Job'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="job-title">Title</Label>
              <Input
                id="job-title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Weekend Server, Line Cook, Retail Associate..."
                maxLength={120}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Job type</Label>
                <Select value={form.jobType} onValueChange={(v) => updateField('jobType', v as JobType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pay type</Label>
                <Select value={form.payType} onValueChange={(v) => updateField('payType', v as PayType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min pay</Label>
                <Input
                  type="number"
                  value={form.payMin}
                  onChange={(e) => updateField('payMin', e.target.value)}
                  placeholder="15"
                />
              </div>
              <div>
                <Label>Max pay</Label>
                <Input
                  type="number"
                  value={form.payMax}
                  onChange={(e) => updateField('payMax', e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>
            <div>
              <Label>Schedule</Label>
              <Input
                value={form.schedule}
                onChange={(e) => updateField('schedule', e.target.value)}
                placeholder="e.g. Weekends, 10am-6pm"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Tell applicants about the role, expectations, and perks"
                rows={3}
                maxLength={1000}
                className="resize-none"
              />
            </div>
            <div>
              <Label>Start date (optional)</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <Label>Hiring now</Label>
                <p className="text-xs text-muted-foreground">Mark as urgent</p>
              </div>
              <Switch
                checked={form.hiringNow}
                onCheckedChange={(v) => updateField('hiringNow', v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>How to apply</Label>
                <Select value={form.applyMethod} onValueChange={(v) => updateField('applyMethod', v as ApplyMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPLY_METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {form.applyMethod === 'email' ? 'Email' : form.applyMethod === 'phone' ? 'Phone' : 'URL'}
                </Label>
                <Input
                  value={form.applyContact}
                  onChange={(e) => updateField('applyContact', e.target.value)}
                  placeholder={
                    form.applyMethod === 'email' ? 'jobs@business.com'
                    : form.applyMethod === 'phone' ? '(419) 555-1234'
                    : 'https://...'
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setComposerOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!canSubmit || isPending}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...</>
                ) : editingId ? 'Update' : 'Post Job'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
