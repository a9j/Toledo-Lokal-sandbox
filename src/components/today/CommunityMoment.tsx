import { Link } from 'react-router-dom';
import { Heart, ExternalLink, ArrowRight } from 'lucide-react';
import { SecureImage } from '@/components/ui/secure-image';
import { Button } from '@/components/ui/button';
import { DailyDropMoment } from '@/hooks/useDailyDrop';

interface CommunityMomentProps {
  moment: DailyDropMoment;
}

export function CommunityMoment({ moment }: CommunityMomentProps) {
  const isExternal = moment.link_url?.startsWith('http');

  return (
    <div className="card-elevated-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-toledo-rose" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Community Moment
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Image */}
        {moment.image_url && (
          <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
          <SecureImage
            storagePath={moment.image_url}
            alt={moment.title}
            className="w-full h-full object-cover"
          />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Title & Description */}
        <h3 className="font-display text-xl font-bold text-foreground mb-2">
          {moment.title}
        </h3>
        
        {moment.description && (
          <p className="text-muted-foreground leading-relaxed mb-4">
            {moment.description}
          </p>
        )}

        {/* Link */}
        {moment.link_url && (
          isExternal ? (
            <a 
              href={moment.link_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full gap-2">
                {moment.link_text || 'Learn More'}
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          ) : (
            <Link to={moment.link_url}>
              <Button variant="outline" className="w-full gap-2">
                {moment.link_text || 'Read More'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
