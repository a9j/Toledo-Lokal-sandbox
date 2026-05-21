import { Link } from 'react-router-dom';
import { Heart, ExternalLink, ArrowRight } from 'lucide-react';
import { SecureImage } from '@/components/ui/secure-image';
import { DailyDropMoment } from '@/hooks/useDailyDrop';

interface CommunityMomentProps {
  moment: DailyDropMoment;
}

export function CommunityMoment({ moment }: CommunityMomentProps) {
  const isExternal = moment.link_url?.startsWith('http');

  return (
    <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Heart className="h-3.5 w-3.5 text-primary fill-primary/30" />
          <h2 className="text-[11px] font-bold tracking-[0.22em] uppercase text-foreground/90">
            Community Moment
          </h2>
        </div>
      </div>

      <div className="px-5 pb-5">
        {moment.image_url && (
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 border border-border/60">
            <SecureImage
              storagePath={moment.image_url}
              alt={moment.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <h3
          className="text-[22px] font-bold text-foreground leading-tight mb-2"
          style={{ fontFamily: "'Anton', 'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.01em' }}
        >
          {moment.title}
        </h3>

        {moment.description && (
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
            {moment.description}
          </p>
        )}

        {moment.link_url && (
          isExternal ? (
            <a href={moment.link_url} target="_blank" rel="noopener noreferrer">
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm py-3 shadow-glow-blue hover:brightness-110 transition-all">
                {moment.link_text || 'Learn More'}
                <ExternalLink className="h-4 w-4" />
              </button>
            </a>
          ) : (
            <Link to={moment.link_url}>
              <button className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm py-3 shadow-glow-blue hover:brightness-110 transition-all">
                {moment.link_text || 'Read More'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
