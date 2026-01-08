import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Building2, Calendar, Tag } from 'lucide-react';

const neighborhoods = [
  {
    id: '1',
    name: 'Downtown Toledo',
    description: 'The heart of the city with restaurants, nightlife & culture',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop',
    stats: { places: 45, events: 12 }
  },
  {
    id: '2', 
    name: 'Old West End',
    description: 'Historic homes, tree-lined streets & local gems',
    image: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=600&h=400&fit=crop',
    stats: { places: 28, events: 8 }
  },
];

export function NeighborhoodHighlight() {
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
          to="/neighborhoods" 
          className="flex items-center gap-0.5 text-sm font-medium text-primary hover:underline pt-1"
        >
          All areas
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide pb-2">
        {neighborhoods.map((hood) => (
          <Link 
            key={hood.id} 
            to={`/explore?neighborhood=${hood.id}`}
            className="block group flex-shrink-0 w-72"
          >
            <div className="card-elevated overflow-hidden hover-lift">
              <div className="relative h-36 overflow-hidden">
                <img
                  src={hood.image}
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
                  {hood.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{hood.stats.places} places</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{hood.stats.events} events</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
