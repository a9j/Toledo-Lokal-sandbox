import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useBusinessJobs, useCreateJob, useUpdateJob, useDeleteJob, JobType, PayType, ApplyMethod } from '@/hooks/useJobs';
import { useBusinessFeatures, useUpdateBusinessFeatures } from '@/hooks/useBusinessFeatures';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Plus, 
  Briefcase, 
  Trash2, 
  Edit, 
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const jobTypes: { value: JobType; label: string }[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'entry-level', label: 'Entry-level' },
  { value: 'skilled-trades', label: 'Skilled Trades' },
  { value: 'internship', label: 'Internship' },
  { value: 'gig', label: 'Gig' },
];

const payTypes: { value: PayType; label: string }[] = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
  { value: 'flat-rate', label: 'Flat Rate' },
  { value: 'tips', label: 'Tips' },
];

const applyMethods: { value: ApplyMethod; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'link', label: 'External Link' },
];

interface JobFormData {
  title: string;
  job_type: JobType;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: PayType;
  schedule: string;
  description: string;
  start_date: string;
  hiring_now: boolean;
  apply_method: ApplyMethod;
  apply_contact: string;
}

const defaultFormData: JobFormData = {
  title: '',
  job_type: 'part-time',
  pay_min: null,
  pay_max: null,
  pay_type: 'hourly',
  schedule: '',
  description: '',
  start_date: '',
  hiring_now: true,
  apply_method: 'email',
  apply_contact: '',
};

export default function DashboardJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [formData, setFormData] = useState<JobFormData>(defaultFormData);

  // Get user's business
  const { data: business } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: features, isLoading: featuresLoading } = useBusinessFeatures(business?.id);
  const { data: jobs, isLoading: jobsLoading } = useBusinessJobs(business?.id);
  const updateFeatures = useUpdateBusinessFeatures();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleToggleHiring = () => {
    if (!business) return;
    updateFeatures.mutate({
      businessId: business.id,
      hiring_enabled: !features?.hiring_enabled,
    });
  };

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setEditingJob(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (job: typeof jobs[0]) => {
    setFormData({
      title: job.title,
      job_type: job.job_type as JobType,
      pay_min: job.pay_min,
      pay_max: job.pay_max,
      pay_type: job.pay_type as PayType,
      schedule: job.schedule || '',
      description: job.description || '',
      start_date: job.start_date || '',
      hiring_now: job.hiring_now,
      apply_method: job.apply_method as ApplyMethod,
      apply_contact: job.apply_contact,
    });
    setEditingJob(job.id);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    const jobData = {
      ...formData,
      business_id: business.id,
    };

    if (editingJob) {
      updateJob.mutate({ id: editingJob, ...jobData });
    } else {
      createJob.mutate(jobData);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteJob.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Pending</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-destructive/10 text-destructive">Rejected</Badge>;
      case 'filled':
        return <Badge variant="secondary">Filled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isLoading = featuresLoading || jobsLoading;

  return (
    <>
      <Header title="Hiring" />
      
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

        {/* Enable Hiring Toggle */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Enable Hiring</h3>
                <p className="text-xs text-muted-foreground">
                  Show job listings on your profile
                </p>
              </div>
            </div>
            <Switch 
              checked={features?.hiring_enabled || false}
              onCheckedChange={handleToggleHiring}
              disabled={updateFeatures.isPending}
            />
          </div>
        </div>

        {features?.hiring_enabled && (
          <>
            {/* Create Job Button */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post a Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingJob ? 'Edit Job' : 'Post a Job'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Weekend Server"
                      required
                    />
                  </div>

                  {/* Job Type */}
                  <div className="space-y-2">
                    <Label>Job Type *</Label>
                    <Select 
                      value={formData.job_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, job_type: v as JobType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {jobTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pay Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pay_min">Min Pay</Label>
                      <Input
                        id="pay_min"
                        type="number"
                        value={formData.pay_min || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pay_min: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pay_max">Max Pay</Label>
                      <Input
                        id="pay_max"
                        type="number"
                        value={formData.pay_max || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, pay_max: e.target.value ? Number(e.target.value) : null }))}
                        placeholder="20"
                      />
                    </div>
                  </div>

                  {/* Pay Type */}
                  <div className="space-y-2">
                    <Label>Pay Type</Label>
                    <Select 
                      value={formData.pay_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, pay_type: v as PayType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {payTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Schedule</Label>
                    <Input
                      id="schedule"
                      value={formData.schedule}
                      onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
                      placeholder="e.g. Weekends, 10am-6pm"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell applicants about this role..."
                      rows={3}
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date (optional)</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  {/* Hiring Now */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label>Hiring Now</Label>
                      <p className="text-xs text-muted-foreground">Mark as urgent</p>
                    </div>
                    <Switch
                      checked={formData.hiring_now}
                      onCheckedChange={(v) => setFormData(prev => ({ ...prev, hiring_now: v }))}
                    />
                  </div>

                  {/* Apply Method */}
                  <div className="space-y-2">
                    <Label>How to Apply *</Label>
                    <Select 
                      value={formData.apply_method} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, apply_method: v as ApplyMethod }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {applyMethods.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Apply Contact */}
                  <div className="space-y-2">
                    <Label htmlFor="apply_contact">
                      {formData.apply_method === 'email' ? 'Email Address' : 
                       formData.apply_method === 'phone' ? 'Phone Number' : 'Application URL'} *
                    </Label>
                    <Input
                      id="apply_contact"
                      type={formData.apply_method === 'email' ? 'email' : 'text'}
                      value={formData.apply_contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, apply_contact: e.target.value }))}
                      placeholder={formData.apply_method === 'email' ? 'jobs@yourbusiness.com' : 
                                  formData.apply_method === 'phone' ? '(419) 555-1234' : 'https://...'}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createJob.isPending || updateJob.isPending}>
                    {editingJob ? 'Update Job' : 'Post Job'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Job List */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Your Job Listings
              </h3>

              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="card-elevated p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : jobs && jobs.length > 0 ? (
                jobs.map(job => (
                  <div key={job.id} className="card-elevated p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium truncate">{job.title}</h4>
                          {getStatusBadge(job.status)}
                          {job.hiring_now && (
                            <Badge variant="outline" className="text-[10px]">
                              <Zap className="h-2.5 w-2.5 mr-0.5" />
                              Hiring Now
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {jobTypes.find(t => t.value === job.job_type)?.label}
                          {job.pay_min && ` · $${job.pay_min}${job.pay_max ? `-${job.pay_max}` : '+'}/hr`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEdit(job)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete job?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this job listing.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(job.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No job listings yet</p>
                  <p className="text-sm">Post your first job to get started</p>
                </div>
              )}
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
