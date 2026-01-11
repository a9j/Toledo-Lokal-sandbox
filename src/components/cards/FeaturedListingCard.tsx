import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, CheckCircle2, Infinity } from 'lucide-react';
import { SecureImage } from '@/components/ui/secure-image';
import { Json } from '@/integrations/supabase/types';

interface FeaturedListingCardProps {
  business: {
    id: string;
    name: string;
    description?: string | null;
    verified?: boolean | null;
    featured?: boolean | null;
    isInLoop?: boolean;
    photos?: string[] | null;
    hours?: Json | null;
    neighborhood?: { name: string } | null;
    category?: { name: string; icon: string } | null;
  };
  showImage?: boolean;
}

// Convert 24-hour time to 12-hour format
const formatTime12hr = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}${minutes ? `:${minutes.toString().padStart(2, '0')}` : ''} ${period}`;
};

// Get today's hours status
const getTodayHoursStatus = (hours: Json | null): string => {
  if (!hours || typeof hours !== 'object' || Array.isArray(hours)) return '';
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];
  const todayHours = (hours as Record<string, { open?: string; close?: string; closed?: boolean }>)[today];
  
  if (!todayHours || todayHours.closed) return 'Closed today';
  if (todayHours.close) return `Open until ${formatTime12hr(todayHours.close)}`;
  return '';
};

// Placeholder images for demo
const placeholderImages = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop',
];

export function FeaturedListingCard({ business, showImage = true }: FeaturedListingCardProps) {
  const imageUrl = business.photos?.[0] || placeholderImages[Math.floor(Math.random() * placeholderImages.length)];

  return (
    <Link to={`/business/${business.id}`} className="block group">
      <div className="card-elevated overflow-hidden hover-lift">
        {showImage && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <SecureImage
              storagePath={imageUrl}
              alt={business.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 image-overlay" />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {business.category && (
                <span className="px-2.5 py-1 rounded-full bg-white/95 text-xs font-semibold text-foreground shadow-sm">
                  {business.category.name}
                </span>
              )}
              {business.featured && (
                <span className="badge-featured">
                  Featured
                </span>
              )}
            </div>
            
            {/* Open status - demo */}
            <div className="absolute top-3 right-3">
              <span className="badge-open flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-soft" />
                Open Now
              </span>
            </div>

            {/* Bottom info on image */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">
                  {business.name}
                </h3>
                {business.isInLoop && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-medium">
                    <Infinity className="h-2.5 w-2.5" />
                    in the loop
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-white/90 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-toledo-gold text-toledo-gold" />
                  <span className="font-medium">4.8</span>
                </div>
                {business.neighborhood && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{business.neighborhood.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Card content */}
        <div className="p-4">
        {!showImage && (
            <>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground">{business.name}</h3>
                    {business.verified && (
                      <CheckCircle2 className="h-4 w-4 text-toledo-teal" />
                    )}
                    {business.isInLoop && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                        <Infinity className="h-2.5 w-2.5" />
                        in the loop
                      </span>
                    )}
                  </div>
                  {business.category && (
                    <p className="text-sm text-muted-foreground">{business.category.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-toledo-gold text-toledo-gold" />
                  <span className="font-semibold">4.8</span>
                </div>
              </div>
            </>
          )}
          
          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {business.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              {business.neighborhood && showImage && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{business.neighborhood.name}</span>
                </div>
              )}
              {getTodayHoursStatus(business.hours) && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{getTodayHoursStatus(business.hours)}</span>
                </div>
              )}
            </div>
            {business.verified && showImage && (
              <CheckCircle2 className="h-5 w-5 text-toledo-teal" />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
