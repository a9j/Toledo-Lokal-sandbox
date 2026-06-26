import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { TablesUpdate } from '@/integrations/supabase/types';

export type JobType = 'full-time' | 'part-time' | 'seasonal' | 'entry-level' | 'skilled-trades' | 'internship' | 'gig';
export type PayType = 'hourly' | 'salary' | 'flat-rate' | 'tips';
export type ApplyMethod = 'email' | 'phone' | 'link';
export type JobStatus = 'pending' | 'approved' | 'rejected' | 'filled' | 'expired';
export type JobVisibility = 'public' | 'beta';

export interface Job {
  id: string;
  business_id: string;
  title: string;
  job_type: JobType;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: PayType;
  schedule: string | null;
  description: string | null;
  start_date: string | null;
  hiring_now: boolean;
  apply_method: ApplyMethod;
  apply_contact: string;
  status: JobStatus;
  // 'public' (everyone) or 'beta' (active Founding Beta members only, enforced
  // server-side via RLS). Defaults to 'public'.
  visibility: JobVisibility;
  featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
    neighborhood?: { name: string } | null;
    category?: { name: string; icon: string } | null;
    business_loop_settings?: { loop_tier_id: string; is_active: boolean } | null;
  } | null;
}

export interface JobFilters {
  jobType?: JobType;
  hiringNow?: boolean;
  payMin?: number;
  businessId?: string;
}

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          business:businesses(
            id,
            name,
            logo_url,
            neighborhood:neighborhoods(name),
            category:categories!category_id(name, icon),
            business_loop_settings(loop_tier_id, is_active)
          )
        `)
        .eq('status', 'approved')
        .order('featured', { ascending: false })
        .order('hiring_now', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.jobType) {
        query = query.eq('job_type', filters.jobType);
      }
      if (filters?.hiringNow) {
        query = query.eq('hiring_now', true);
      }
      if (filters?.payMin) {
        query = query.gte('pay_min', filters.payMin);
      }
      if (filters?.businessId) {
        query = query.eq('business_id', filters.businessId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Job[];
    },
  });
}

export function useBusinessJobs(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-jobs', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Job[];
    },
    enabled: !!businessId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'status' | 'featured' | 'business'>) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert(job)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['business-jobs'] });
      toast({
        title: 'Job posted!',
        description: 'Your job listing is pending approval.',
      });
    },
    onError: () => {
      toast({
        title: 'Error posting job',
        description: 'Failed to post job. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Job> & { id: string }) => {
      const { business: _business, ...dbUpdates } = updates;
      const { data, error } = await supabase
        .from('jobs')
        .update(dbUpdates as TablesUpdate<'jobs'>)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['business-jobs'] });
      toast({
        title: 'Job updated',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating job',
        description: 'Failed to update job. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['business-jobs'] });
      toast({
        title: 'Job deleted',
      });
    },
    onError: () => {
      toast({
        title: 'Error deleting job',
        description: 'Failed to delete job. Please try again.',
        variant: 'destructive',
      });
    },
  });
}
