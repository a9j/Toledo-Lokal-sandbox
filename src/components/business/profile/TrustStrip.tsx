import { Crown, Store, Users, Zap, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrustStripProps {
  businessId: string;
  isFoundingMember?: boolean;
  isLocallyOwned?: boolean;
  isCommunityPartner?: boolean;
  isNonprofit?: boolean;
}

interface Badge {
  id: string;
  label: string;
  icon: React.ElementType;
  className: string;
  active: boolean;
}

export function TrustStrip({ 
  businessId,
  isFoundingMember,
  isLocallyOwned = true, // Default to true for local businesses
  isCommunityPartner,
  isNonprofit
}: TrustStripProps) {
  // Check if business was active this week (has recent pulse posts or events)
  const { data: isActiveThisWeek } = useQuery({
    queryKey: ['business-activity', businessId],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Check for recent pulse posts
      const { count: pulseCount } = await supabase
        .from('pulse_posts')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'active')
        .gte('created_at', oneWeekAgo.toISOString());

      // Check for recent events
      const { count: eventCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'approved')
        .gte('start_date_time', oneWeekAgo.toISOString());

      return (pulseCount || 0) + (eventCount || 0) > 0;
    },
    enabled: !!businessId,
  });

  const badges: Badge[] = [
    {
      id: 'founding5',
      label: 'Founding 5',
      icon: Crown,
      className: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-white shadow-amber-500/30',
      active: !!isFoundingMember,
    },
    {
      id: 'locally-owned',
      label: 'Locally Owned',
      icon: Store,
      className: 'bg-lokal-forest-light text-lokal-forest border border-lokal-forest/20',
      active: isLocallyOwned && !isNonprofit,
    },
    {
      id: 'community-partner',
      label: 'Community Partner',
      icon: Users,
      className: 'bg-lokal-terracotta-light text-lokal-terracotta border border-lokal-terracotta/20',
      active: !!isCommunityPartner || !!isNonprofit,
    },
    {
      id: 'active-week',
      label: 'Active This Week',
      icon: Zap,
      className: 'bg-primary/10 text-primary border border-primary/20',
      active: !!isActiveThisWeek,
    },
  ];

  const activeBadges = badges.filter(b => b.active);

  if (activeBadges.length === 0) return null;

  return (
    <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex items-center gap-2 py-1">
        {activeBadges.map((badge) => (
          <div
            key={badge.id}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm ${badge.className}`}
          >
            <badge.icon className="h-3.5 w-3.5" />
            {badge.label}
          </div>
        ))}
      </div>
    </div>
  );
}
