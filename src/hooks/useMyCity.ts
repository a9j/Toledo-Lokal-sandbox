import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * My City, Phase 2.
 *
 * Every read goes through a SECURITY DEFINER function scoped to `auth.uid()`.
 * None of them takes a user id, so one signed in person can never ask the
 * database about someone else's home. Keep it that way.
 */

export interface MyHome {
  parcel_id: string;
  address: string;
  neighborhood_id: string | null;
  neighborhood_name: string | null;
  council_district: string | null;
  precinct: string | null;
  school_district: string | null;
  refuse_day: string | null;
  recycling_week: string | null;
  snow_route: string | null;
  tax_year_amount: number | null;
  assessed_value: number | null;
  verified_at: string | null;
  /** 'seed' means placeholder data, not a real city record. Say so in the UI. */
  source: string;
}

export interface NearMeItem {
  log_id: string;
  entity_id: string;
  entity_name: string;
  source_table: string;
  source_id: string;
  event_type: string;
  title: string;
  body: string | null;
  occurs_at: string;
  distance_miles: number | null;
  /** 'neighborhood' means it covers the whole area, not a point near you. */
  scope: string;
}

export interface NearbyBusiness {
  business_id: string;
  name: string;
  category: string;
  address: string | null;
  created_at: string;
  distance_miles: number | null;
}

export interface ParcelMatch {
  id: string;
  address: string;
  neighborhood_id: string | null;
  neighborhood_name: string | null;
}

/** The caller's home, or null when they have not set one. */
export function useMyHome() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-home', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_home');
      if (error) throw error;
      return ((data ?? [])[0] as MyHome | undefined) ?? null;
    },
  });
}

/** Address type ahead. Runs from two characters, so it does not fire per keystroke. */
export function useParcelSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: ['parcel-search', trimmed],
    enabled: trimmed.length >= 2,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_parcels', {
        p_query: trimmed,
        p_limit: 8,
      });
      if (error) throw error;
      return (data ?? []) as ParcelMatch[];
    },
  });
}

/** Set the home address. The database also follows the home and its neighborhood. */
export function useSetHomeParcel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (parcelId: string) => {
      const { error } = await supabase.rpc('set_home_parcel', { p_parcel_id: parcelId });
      if (error) throw error;
    },
    onSuccess: () => {
      // The home changed, so everything keyed off it is stale, and the auto
      // follows will have put new rows in the inbox.
      for (const key of [
        ['my-home', user?.id],
        ['my-city-near-me'],
        ['my-city-nearby-businesses'],
        ['civic-inbox', user?.id],
        ['inbox-unread-count'],
      ]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

/** Recent changes near home, plus anything covering the whole neighborhood. */
export function useNearMe(radiusMiles = 0.5, limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-city-near-me', user?.id, radiusMiles, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_city_near_me', {
        p_radius_miles: radiusMiles,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as NearMeItem[];
    },
  });
}

/** Businesses near home, newest first. */
export function useNearbyBusinesses(radiusMiles = 1, limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-city-nearby-businesses', user?.id, radiusMiles, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_city_nearby_businesses', {
        p_radius_miles: radiusMiles,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as NearbyBusiness[];
    },
  });
}

/** Lokal ID: ask for a code, then confirm it. */
export function useAddressVerification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const sendCode = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('send-address-code');
      if (error) throw error;
      if (data && (data as { error?: string }).error) {
        throw new Error((data as { error: string }).error);
      }
      return data as { ok: true; sent_to: string };
    },
  });

  const confirmCode = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('confirm_address_verification', {
        p_code: code,
      });
      if (error) throw error;
      return data as { ok: boolean; reason?: string; attempts_left?: number };
    },
    onSuccess: (result) => {
      if (result?.ok) {
        queryClient.invalidateQueries({ queryKey: ['my-home', user?.id] });
      }
    },
  });

  return { sendCode, confirmCode };
}

/**
 * The published budget split behind the City Receipt. Editable in app_settings
 * rather than hard coded, because the percentages change every year.
 */
export interface BudgetShare {
  label: string;
  percent: number;
}

export function useCityBudgetSplit() {
  return useQuery({
    queryKey: ['city-budget-split'],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'city_budget_split')
        .maybeSingle();
      if (error) throw error;

      const value = (data?.value ?? {}) as {
        shares?: BudgetShare[];
        source?: string;
        note?: string;
      };
      return {
        shares: value.shares ?? [],
        source: value.source ?? 'unknown',
        note: value.note ?? null,
      };
    },
  });
}
