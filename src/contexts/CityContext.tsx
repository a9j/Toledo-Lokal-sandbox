import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CityConfig {
  id: string;
  slug: string;
  name: string;
  region: string | null;
  tagline: string | null;
  primary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  timezone: string;
  center_lat: number;
  center_lng: number;
  default_radius_miles: number;
  units: string;
  feature_flags: Record<string, boolean>;
  data_source_ids: string[];
  is_active: boolean;
}

/**
 * What the app falls back to before the city loads, or if it cannot.
 *
 * These are Toledo's values, which makes the fallback a lie in any other city.
 * That is deliberate and better than the alternatives: a blank name renders as
 * an empty hole in every heading, and throwing takes the whole app down
 * because one row was slow. The slug is carried so a mismatch is visible.
 */
const FALLBACK: CityConfig = {
  id: '',
  slug: 'toledo',
  name: 'Toledo',
  region: 'Ohio',
  tagline: null,
  primary_color: null,
  accent_color: null,
  logo_url: null,
  timezone: 'America/New_York',
  center_lat: 41.6528,
  center_lng: -83.5379,
  default_radius_miles: 3,
  units: 'imperial',
  feature_flags: {},
  data_source_ids: [],
  is_active: true,
};

interface CityContextValue {
  city: CityConfig;
  isLoading: boolean;
  isFallback: boolean;
  /** True only when the flag is explicitly on. An unknown flag is off. */
  hasFeature: (flag: string) => boolean;
}

const CityContext = createContext<CityContextValue | undefined>(undefined);

const ACTIVE_SLUG = (import.meta.env.VITE_CITY_SLUG as string | undefined) || 'toledo';

export function CityProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['city-config', ACTIVE_SLUG],
    // A city changes about never. Keep it for the session.
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async (): Promise<CityConfig | null> => {
      const { data, error } = await supabase.rpc('city_config', { p_slug: ACTIVE_SLUG });
      if (error) throw error;
      const rows = (data ?? []) as unknown as CityConfig[];
      return rows[0] ?? null;
    },
  });

  const city = data ?? FALLBACK;

  const value: CityContextValue = {
    city,
    isLoading,
    isFallback: !data,
    hasFeature: (flag: string) => city.feature_flags?.[flag] === true,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity(): CityContextValue {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error('useCity must be used inside a CityProvider');
  }
  return context;
}
