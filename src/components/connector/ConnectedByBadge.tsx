import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ConnectedByBadgeProps {
  connectorId: string;
  compact?: boolean;
}

export function ConnectedByBadge({ connectorId, compact = false }: ConnectedByBadgeProps) {
  const { data } = useQuery({
    queryKey: ['connector-badge', connectorId],
    queryFn: async () => {
      const { data: connector, error } = await supabase
        .from('connectors')
        .select('referral_slug, user_id')
        .eq('id', connectorId)
        .single();
      if (error) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', connector.user_id)
        .single();

      return { name: profile?.name, slug: connector.referral_slug };
    },
    enabled: !!connectorId,
    staleTime: 60000,
  });

  if (!data?.name) return null;

  if (compact) {
    return (
      <Link to={`/connector/${data.slug}`} className="inline-flex items-center gap-1 text-[10px] text-amber-700">
        <Crown className="h-2.5 w-2.5" />
        Connected by {data.name}
      </Link>
    );
  }

  return (
    <Link to={`/connector/${data.slug}`}>
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors">
        <Crown className="h-3 w-3" />
        <span>Connected by {data.name}</span>
      </div>
    </Link>
  );
}
