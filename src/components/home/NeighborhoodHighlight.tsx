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
    <section className="py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 px-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="section-label">Explore Toledo</span>
          </div>
          <h2 className="text-xl font-bold text-foreground">Neighborhood Guides</h2>
        </div>
        <Link 
          to="/explore" 
          className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline pt-1"
        >
          All areas
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <Skeleton className="h-36 rounded-t-xl" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))
        ) : (
          neighborhoods?.slice(0, 6).map((hood) => {
            const meta = neighborhoodMeta[hood.name] || defaultMeta;
            return (
              <Link 
                key={hood.id} 
                to={`/explore?neighborhood=${hood.id}`}
                className="block group flex-shrink-0 w-72"
              >
                <div className="card-elevated overflow-hidden hover-lift">
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={meta.image}
                      alt={hood.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg">{hood.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {meta.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Explore places</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>See events</span>
                      </div>
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
