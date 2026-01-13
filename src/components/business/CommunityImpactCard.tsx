import { Heart, Users, HandHeart } from 'lucide-react';

interface CommunityImpactCardProps {
  nonprofitsSupported?: string[];
  volunteerLink?: string | null;
  localCauses?: string[];
}

export function CommunityImpactCard({ 
  nonprofitsSupported, 
  volunteerLink, 
  localCauses 
}: CommunityImpactCardProps) {
  const hasContent = (nonprofitsSupported && nonprofitsSupported.length > 0) || 
                     volunteerLink || 
                     (localCauses && localCauses.length > 0);

  if (!hasContent) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Community Impact
      </h2>

      <div className="space-y-3">
        {/* Nonprofits Supported */}
        {nonprofitsSupported && nonprofitsSupported.length > 0 && (
          <div className="flex items-start gap-3">
            <Heart className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-foreground font-medium">Supports</p>
              <p className="text-sm text-muted-foreground">
                {nonprofitsSupported.join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Volunteer Opportunities */}
        {volunteerLink && (
          <div className="flex items-start gap-3">
            <HandHeart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-foreground font-medium">Volunteer</p>
              <a 
                href={volunteerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View opportunities
              </a>
            </div>
          </div>
        )}

        {/* Local Causes */}
        {localCauses && localCauses.length > 0 && (
          <div className="flex items-start gap-3">
            <Users className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-foreground font-medium">Community</p>
              <p className="text-sm text-muted-foreground">
                {localCauses.join(', ')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
