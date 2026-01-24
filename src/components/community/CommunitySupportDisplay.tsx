import { Users, HandHeart, Package, Calendar, Megaphone } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { COMMUNITY_SUPPORT_LABELS } from '@/hooks/useNonprofits';

type CommunitySupportType = Database['public']['Enums']['community_support_type'];

interface CommunitySupportDisplayProps {
  supportTypes: CommunitySupportType[];
}

const SUPPORT_CONFIG: Record<CommunitySupportType, { 
  icon: typeof Users; 
  color: string;
  description: string;
}> = {
  volunteers: { 
    icon: Users, 
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    description: 'We welcome volunteers'
  },
  donations: { 
    icon: HandHeart, 
    color: 'bg-rose-50 text-rose-600 border-rose-200',
    description: 'Accepting monetary donations'
  },
  supplies: { 
    icon: Package, 
    color: 'bg-amber-50 text-amber-600 border-amber-200',
    description: 'We need supplies and materials'
  },
  events: { 
    icon: Calendar, 
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    description: 'Join us at our events'
  },
  awareness: { 
    icon: Megaphone, 
    color: 'bg-teal-50 text-teal-600 border-teal-200',
    description: 'Help spread the word'
  },
};

export function CommunitySupportDisplay({ supportTypes }: CommunitySupportDisplayProps) {
  if (!supportTypes?.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        How the Community Shows Up
      </h3>
      <div className="grid gap-2">
        {supportTypes.map((type) => {
          const config = SUPPORT_CONFIG[type];
          const Icon = config.icon;
          
          return (
            <div
              key={type}
              className={`flex items-center gap-3 p-3 rounded-xl border ${config.color}`}
            >
              <Icon className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">{COMMUNITY_SUPPORT_LABELS[type]}</p>
                <p className="text-xs opacity-80">{config.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
