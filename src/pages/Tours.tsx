import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { useTours } from '@/hooks/useTours';
import { MapPin, Clock, Footprints, Star, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function Tours() {
  const { data: tours, isLoading } = useTours();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header title="Walking Tours" />

      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Explore Toledo on Foot</h1>
          <p className="text-muted-foreground">
            Curated walking routes to discover the best of the Glass City
          </p>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))
          ) : tours && tours.length > 0 ? (
            tours.map((tour) => (
              <Link
                key={tour.id}
                to={`/tours/${tour.id}`}
                className="block bg-card rounded-2xl overflow-hidden border border-border hover-lift"
              >
                {tour.image_url && (
                  <div className="relative h-32">
                    <img
                      src={tour.image_url}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {tour.featured && (
                      <Badge className="absolute top-3 left-3 bg-toledo-gold text-foreground">
                        <Star className="h-3 w-3 mr-1" /> Featured
                      </Badge>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{tour.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {tour.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {tour.neighborhood && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tour.neighborhood.name}
                      </span>
                    )}
                    {tour.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tour.duration_minutes} min
                      </span>
                    )}
                    {tour.distance_miles && (
                      <span className="flex items-center gap-1">
                        <Footprints className="h-3 w-3" />
                        {tour.distance_miles} mi
                      </span>
                    )}
                    <span className="ml-auto flex items-center text-primary font-medium">
                      Start Tour <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-12">
              <Footprints className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-1">Tours Coming Soon</h3>
              <p className="text-sm text-muted-foreground">
                We're curating the best walking routes for you
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
