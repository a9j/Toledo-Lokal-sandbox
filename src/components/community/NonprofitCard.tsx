import { Link } from 'react-router-dom';
import { Heart, Users, Package, Calendar, Megaphone, HandHeart, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Nonprofit, CAUSE_CATEGORY_LABELS, COMMUNITY_SUPPORT_LABELS } from '@/hooks/useNonprofits';
import { SecureImage } from '@/components/ui/secure-image';
import { Database } from '@/integrations/supabase/types';

type CommunitySupportType = Database['public']['Enums']['community_support_type'];

interface NonprofitCardProps {
  nonprofit: Nonprofit;
}

const SUPPORT_ICONS: Record<CommunitySupportType, typeof Heart> = {
  volunteers: Users,
  donations: HandHeart,
  supplies: Package,
  events: Calendar,
  awareness: Megaphone,
};

export function NonprofitCard({ nonprofit }: NonprofitCardProps) {
  const supportTypes = nonprofit.community_support_types || [];
  
  return (
    <Link 
      to={`/community/${nonprofit.slug || nonprofit.id}`}
      className="group block"
    >
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-border hover:-translate-y-0.5">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-br from-muted to-muted/50">
          {nonprofit.cover_image_url ? (
            <SecureImage
              storagePath={nonprofit.cover_image_url}
              alt={nonprofit.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Founding Partner Badge */}
          {nonprofit.founding_community_partner && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-amber-500/90 text-white border-0 gap-1 text-[10px] backdrop-blur-sm">
                <Award className="h-3 w-3" />
                Founding Partner
              </Badge>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4">
          {/* Logo + Name */}
          <div className="flex items-start gap-3 mb-3">
            {nonprofit.logo_url && (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                <SecureImage
                  storagePath={nonprofit.logo_url}
                  alt={nonprofit.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {nonprofit.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {CAUSE_CATEGORY_LABELS[nonprofit.cause_category]}
              </p>
            </div>
          </div>
          
          {/* Mission Statement */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {nonprofit.mission_statement}
          </p>
          
          {/* How Community Shows Up */}
          {supportTypes.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {supportTypes.slice(0, 3).map((type) => {
                const Icon = SUPPORT_ICONS[type];
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-muted-foreground"
                    title={COMMUNITY_SUPPORT_LABELS[type]}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="text-[10px]">{COMMUNITY_SUPPORT_LABELS[type]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
