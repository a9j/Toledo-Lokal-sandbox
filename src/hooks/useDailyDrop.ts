import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface DailyDropHighlight {
  id: string;
  highlight_type: 'event' | 'deal' | 'announcement' | 'weather' | 'tip';
  title: string;
  subtitle: string | null;
  link_url: string | null;
  link_text: string | null;
  icon: string | null;
  sort_order: number;
}

export interface DailyDropSpotlight {
  id: string;
  spotlight_type: 'business' | 'food_truck' | 'nonprofit';
  custom_headline: string | null;
  custom_description: string | null;
  sort_order: number;
  business: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
    slug: string | null;
    category: { name: string; icon: string | null } | null;
    neighborhood: { name: string } | null;
  } | null;
}

export interface DailyDropMoment {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
}

export interface DailyDrop {
  id: string;
  drop_date: string;
  title: string | null;
  subtitle: string | null;
  status: string;
  highlights: DailyDropHighlight[];
  spotlights: DailyDropSpotlight[];
  moment: DailyDropMoment | null;
}

export function useDailyDrop(date?: Date) {
  const targetDate = date || new Date();
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['daily-drop', dateStr],
    queryFn: async (): Promise<DailyDrop | null> => {
      // First try to get today's drop
      const { data: drop, error } = await supabase
        .from('daily_drops')
        .select('*')
        .eq('drop_date', dateStr)
        .eq('status', 'published')
        .maybeSingle();

      if (error) throw error;
      
      // If no drop for today, get the most recent one
      let actualDrop = drop;
      if (!actualDrop) {
        const { data: recentDrop } = await supabase
          .from('daily_drops')
          .select('*')
          .eq('status', 'published')
          .lte('drop_date', dateStr)
          .order('drop_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        actualDrop = recentDrop;
      }

      if (!actualDrop) return null;

      // Fetch related data
      const [highlightsRes, spotlightsRes, momentsRes] = await Promise.all([
        supabase
          .from('daily_drop_highlights')
          .select('*')
          .eq('daily_drop_id', actualDrop.id)
          .order('sort_order'),
        supabase
          .from('daily_drop_spotlights')
          .select(`
            *,
            business:businesses(
              id, name, logo_url, description, slug,
              category:categories(name, icon),
              neighborhood:neighborhoods(name)
            )
          `)
          .eq('daily_drop_id', actualDrop.id)
          .order('sort_order'),
        supabase
          .from('daily_drop_moments')
          .select('*')
          .eq('daily_drop_id', actualDrop.id)
          .limit(1)
          .maybeSingle()
      ]);

      return {
        id: actualDrop.id,
        drop_date: actualDrop.drop_date,
        title: actualDrop.title,
        subtitle: actualDrop.subtitle,
        status: actualDrop.status,
        highlights: (highlightsRes.data || []) as DailyDropHighlight[],
        spotlights: (spotlightsRes.data || []) as DailyDropSpotlight[],
        moment: momentsRes.data as DailyDropMoment | null
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for checking if there's a drop for a specific date
export function useHasDailyDrop(date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['has-daily-drop', dateStr],
    queryFn: async () => {
      const { count } = await supabase
        .from('daily_drops')
        .select('*', { count: 'exact', head: true })
        .eq('drop_date', dateStr)
        .eq('status', 'published');
      
      return (count || 0) > 0;
    },
    staleTime: 1000 * 60 * 10,
  });
}
