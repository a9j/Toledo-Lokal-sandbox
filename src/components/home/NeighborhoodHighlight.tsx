import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Building2, Calendar } from 'lucide-react';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { Skeleton } from '@/components/ui/skeleton';

// Fallback data for neighborhoods that don't have images/descriptions in DB
const neighborhoodMeta: Record<string, { description: string; image: string }> = {
  'Downtown': {
    description: 'The heart of the city with restaurants, nightlife & culture',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop',
  },
  'Old West End': {
    description: 'Historic homes, tree-lined streets & local gems',
    image: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=600&h=400&fit=crop',
  },
  'South Toledo': {
    description: 'Diverse community with parks and family-friendly spots',
    image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
  },
  'West Toledo': {
    description: 'Shopping centers, eateries & suburban charm',
    image: 'https://images.unsplash.com/photo-1464082354059-27db6ce50048?w=600&h=400&fit=crop',
  },
  'East Toledo': {
    description: 'Waterfront views and growing arts scene',
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=400&fit=crop',
  },
  'Sylvania': {
    description: 'Upscale dining, boutiques & excellent schools',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&h=400&fit=crop',
  },
  'Perrysburg': {
    description: 'Historic downtown with shops & riverfront trails',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&h=400&fit=crop',
  },
  'Maumee': {
    description: 'Scenic river town with antique shops & local flavor',
    image: 'https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=600&h=400&fit=crop',
  },
};

const defaultMeta = {
  description: 'Explore this vibrant Toledo neighborhood',
  image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop',
};

export function NeighborhoodHighlight() {
  const { data: neighborhoods, isLoading } = useNeighborhoods();

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-5 px-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="eyebrow">Explore Toledo</span>
          </div>
          <h2
            className="text-2xl md:text-3xl font-normal text-foreground tracking-tight"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.015em', lineHeight: 1.05 }}
          >
            Neighborhood Guides
          </h2>
        </div>
        <Link
          to="/explore"
          className="flex items-center gap-0.5 text-xs uppercase tracking-[0.12em] font-semibold text-primary hover:text-primary/80 transition-colors pb-1"
        >
          All areas
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Horizontal scroll — large editorial tiles */}
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <Skeleton className="h-96 rounded-3xl" />
            </div>
          ))
        ) : (
          neighborhoods?.slice(0, 6).map((hood) => {
            const meta = neighborhoodMeta[hood.name] || defaultMeta;
            return (
              <Link
                key={hood.id}
                to={`/explore?neighborhood=${hood.id}`}
                className="block group flex-shrink-0 w-80 snap-start"
              >
                <div className="relative h-96 rounded-3xl overflow-hidden border border-border/40">
                  <img
                    src={meta.image}
                    alt={hood.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 cinematic-overlay" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <span className="eyebrow text-white/70 mb-2 block">Neighborhood</span>
                    <h3
                      className="text-white font-normal mb-2 tracking-tight"
                      style={{
                        fontFamily: "'Instrument Serif', Georgia, serif",
                        fontSize: '2rem',
                        lineHeight: 1.05,
                        letterSpacing: '-0.015em',
                      }}
                    >
                      {hood.name}
                    </h3>
                    <p className="text-sm text-white/75 leading-relaxed line-clamp-2 mb-4 font-light">
                      {meta.description}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.12em] text-white/60">
                      <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Places</span>
                      <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Events</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
