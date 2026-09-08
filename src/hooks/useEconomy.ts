import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

/**
 * Phase 6: the wallet, empty space, business to business requests, jobs you can
 * get to, and where the money goes.
 *
 * One privacy rule runs through it: who supplies whom is public, what it costs
 * is not. The chain reads from a world readable table; every number attached to
 * it comes back through a function that checks you own the business first.
 */

export type Space = Database['public']['Tables']['spaces']['Row'];
export type BusinessInsight = Database['public']['Tables']['business_insights']['Row'];

export const SPACE_KINDS = [
  { value: 'storefront', label: 'Shop' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'studio', label: 'Studio' },
  { value: 'land', label: 'Land' },
  { value: 'popup', label: 'Pop up' },
] as const;

/** The ten filters, in the order they matter to someone who needs work. */
export const JOB_FILTERS = [
  { value: 'hiring_now', label: 'Hiring now' },
  { value: 'no_experience_needed', label: 'No experience' },
  { value: 'transit_accessible', label: 'On a bus route' },
  { value: 'second_chance', label: 'Records considered' },
  { value: 'training_provided', label: 'Training given' },
  { value: 'weekly_pay', label: 'Paid weekly' },
  { value: 'benefits_offered', label: 'Benefits' },
  { value: 'teen_friendly', label: 'Under 18 welcome' },
  { value: 'weekends_only', label: 'Weekends' },
  { value: 'evenings_nights', label: 'Evenings' },
  { value: 'remote_ok', label: 'Remote' },
] as const;

export const WALLET_KIND_LABEL: Record<string, string> = {
  gift_card: 'Gift card',
  ticket: 'Ticket',
  coupon: 'Coupon',
  transit: 'Transit',
  volunteer_credit: 'Volunteer credit',
  membership: 'Membership',
};

export interface WalletItem {
  id: string;
  kind: string;
  title: string;
  issuer: string | null;
  business_id: string | null;
  business_name: string | null;
  value_cents: number | null;
  quantity: number;
  code: string | null;
  expires_at: string | null;
  used_at: string | null;
  expired: boolean;
  notes: string | null;
}

export interface JobNearHome {
  id: string;
  title: string;
  business_id: string;
  business_name: string;
  job_type: string | null;
  pay_min: number | null;
  pay_max: number | null;
  pay_type: string | null;
  schedule: string | null;
  hiring_now: boolean | null;
  neighborhood_name: string | null;
  /** Null when you have not set a home address. */
  distance_miles: number | null;
  walk_minutes: number | null;
  drive_minutes: number | null;
  bus_minutes: number | null;
  flags: string[];
  created_at: string;
}

export interface B2BRequest {
  id: string;
  title: string;
  description: string | null;
  need_category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  is_barter: boolean;
  needed_by: string | null;
  poster_entity_id: string | null;
  poster_name: string | null;
  poster_business_id: string | null;
  neighborhood_name: string | null;
  created_at: string;
}

export interface EconomicLoop {
  months: { month: string; points: number; transactions: number; businesses: number }[];
  top_businesses: { business_id: string; name: string; points: number }[];
  links: {
    business_id: string;
    buyer: string;
    supplier_id: string | null;
    supplier: string;
    is_local: boolean;
    category: string | null;
  }[];
  supplier_count: number;
  local_supplier_count: number;
  /** False when no points have ever moved. The page says so rather than drawing nothing. */
  has_spend_data: boolean;
}

export interface CommandCenter {
  days: number;
  profile_views: number;
  events_logged: number;
  checkins: number;
  deal_redemptions: number;
  followers: number;
  active_deals: number;
  open_jobs: number;
  upcoming_events: number;
  suppliers: number;
  local_suppliers: number;
}

/** Everything in your wallet that is not points. */
export function useWalletItems(includeUsed = false) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wallet-items', user?.id, includeUsed],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_wallet_items', {
        p_include_used: includeUsed,
      });
      if (error) throw error;
      return (data ?? []) as WalletItem[];
    },
  });
}

export function useSpaces(kinds: string[] = []) {
  return useQuery({
    queryKey: ['spaces', kinds],
    queryFn: async () => {
      let query = supabase
        .from('spaces')
        .select('*')
        .in('status', ['available', 'under_offer'])
        .order('updated_at', { ascending: false })
        .limit(100);
      if (kinds.length > 0) query = query.in('kind', kinds);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Space[];
    },
  });
}

/** Jobs sorted by distance from home, with rough travel times. */
export function useJobsNearHome(filters: string[] = [], radiusMiles?: number | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['jobs-near-home', filters, radiusMiles ?? null, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('jobs_near_home', {
        p_filters: filters.length ? filters : undefined,
        p_radius_miles: radiusMiles ?? undefined,
      });
      if (error) throw error;
      return (data ?? []) as JobNearHome[];
    },
  });
}

export function useB2BRequests(barterOnly = false) {
  return useQuery({
    queryKey: ['b2b-requests', barterOnly],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('b2b_requests', {
        p_barter_only: barterOnly,
      });
      if (error) throw error;
      return (data ?? []) as B2BRequest[];
    },
  });
}

export function usePostB2BRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      businessId: string;
      title: string;
      description?: string;
      needCategory?: string;
      budgetMin?: number | null;
      budgetMax?: number | null;
      isBarter?: boolean;
    }) => {
      const { data, error } = await supabase.rpc('post_b2b_request', {
        p_business_id: input.businessId,
        p_title: input.title,
        p_description: input.description ?? undefined,
        p_need_category: input.needCategory ?? undefined,
        p_budget_min: input.budgetMin ?? undefined,
        p_budget_max: input.budgetMax ?? undefined,
        p_is_barter: input.isBarter ?? false,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2b-requests'] });
    },
  });
}

export function useEconomicLoop(months = 6) {
  return useQuery({
    queryKey: ['economic-loop', months],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('local_economic_loop', { p_months: months });
      if (error) throw error;
      return data as unknown as EconomicLoop;
    },
  });
}

/** The Business Command Center numbers. Owner or admin only, enforced in the database. */
export function useCommandCenter(businessId?: string, days = 30) {
  return useQuery({
    queryKey: ['command-center', businessId, days],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('business_command_center', {
        p_business_id: businessId as string,
        p_days: days,
      });
      if (error) throw error;
      return data as unknown as CommandCenter;
    },
  });
}

export function useBusinessInsights(businessId?: string) {
  return useQuery({
    queryKey: ['business-insights', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_insights')
        .select('*')
        .eq('business_id', businessId as string)
        .order('priority');
      if (error) throw error;
      return (data ?? []) as BusinessInsight[];
    },
  });
}

/**
 * Regenerate the recommendations.
 *
 * The plan asks for a nightly job. Nothing schedules one here, so the dashboard
 * calls this instead. It is idempotent: the same inputs replace the same rows.
 */
export function useRefreshInsights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      const { data, error } = await supabase.rpc('refresh_business_insights', {
        p_business_id: businessId,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (_r, businessId) => {
      queryClient.invalidateQueries({ queryKey: ['business-insights', businessId] });
    },
  });
}

export interface StartStep {
  key: string;
  title: string;
  body: string;
  category: string | null;
}

export function useStartABusiness() {
  return useQuery({
    queryKey: ['start-a-business'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'start_a_business')
        .maybeSingle();
      if (error) throw error;
      const value = (data?.value ?? {}) as { steps?: StartStep[]; note?: string };
      return { steps: value.steps ?? [], note: value.note ?? null };
    },
  });
}
