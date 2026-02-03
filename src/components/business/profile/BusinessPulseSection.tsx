import { Radio, ChevronRight, Zap, AlertTriangle, Activity, HelpCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { CollapsibleSection } from './CollapsibleSection';
import { PULSE_CATEGORIES, PulseCategory } from '@/lib/pulse-config';

interface BusinessPulseSectionProps {
  businessId: string;
  businessName: string;
}

// Map icon names to actual icons
const PULSE_ICONS: Record<string, React.ElementType> = {
  Zap,
  AlertTriangle,
  Activity,
  HelpCircle,
  Heart,
};

export function BusinessPulseSection({ businessId, businessName }: BusinessPulseSectionProps) {
  const { data: pulsePosts, isLoading } = useQuery({
    queryKey: ['business-pulse', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pulse_posts')
        .select('*')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  if (isLoading || !pulsePosts || pulsePosts.length === 0) return null;

  const getCategoryConfig = (category: string) => {
    const config = PULSE_CATEGORIES[category as PulseCategory];
    return config || PULSE_CATEGORIES.right_now;
  };

  const getCategoryIcon = (iconName: string) => {
    return PULSE_ICONS[iconName] || Zap;
  };

  return (
    <CollapsibleSection title="Recent Activity" icon={Radio} defaultOpen>
      <div className="space-y-3">
        {pulsePosts.map((post) => {
          const categoryConfig = getCategoryConfig(post.category);
          const CategoryIcon = getCategoryIcon(categoryConfig.icon);
          
          return (
            <div
              key={post.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/30"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${categoryConfig.bgColor}`}>
                <CategoryIcon className={`h-4 w-4 ${categoryConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2">
                  {post.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium ${categoryConfig.color}`}>
                    {categoryConfig.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Link to full Pulse feed */}
        <Link 
          to="/pulse" 
          className="flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline"
        >
          See more on The Pulse
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </CollapsibleSection>
  );
}
