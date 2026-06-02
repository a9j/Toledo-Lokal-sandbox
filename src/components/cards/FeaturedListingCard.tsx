import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, CheckCircle2, Infinity as InfinityIcon, ArrowUpRight } from 'lucide-react';
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

// Check if business is currently open
const isCurrentlyOpen = (hours: Json | null): boolean => {
  if (!hours || typeof hours !== 'object' || Array.isArray(hours)) return false;
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const today = days[now.getDay()];
  const todayHours = (hours as Record<string, { open?: string; close?: string; closed?: boolean }>)[today];
  
  if (!todayHours || todayHours.closed || !todayHours.open || !todayHours.close) return false;
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openHours, openMins] = todayHours.open.split(':').map(Number);
  const [closeHours, closeMins] = todayHours.close.split(':').map(Number);
  const openMinutes = openHours * 60 + (openMins || 0);
  const closeMinutes = closeHours * 60 + (closeMins || 0);
  
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

// Get today's hours status
const getTodayHoursStatus = (hours: Json | null): { text: string; isOpen: boolean } => {
  if (!hours || typeof hours !== 'object' || Array.isArray(hours)) return { text: '', isOpen: false };
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const today = days[now.getDay()];
  const todayHours = (hours as Record<string, { open?: string; close?: string; closed?: boolean }>)[today];
  
  if (!todayHours || todayHours.closed) return { text: 'Closed today', isOpen: false };
  
  const isOpen = isCurrentlyOpen(hours);
  
  if (isOpen && todayHours.close) {
    return { text: `Until ${formatTime12hr(todayHours.close)}`, isOpen: true };
  } else if (!isOpen && todayHours.open) {
    return { text: `Opens ${formatTime12hr(todayHours.open)}`, isOpen: false };
  }
  
  return { text: '', isOpen: false };
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
  const hoursStatus = getTodayHoursStatus(business.hours);

  return (
    <Link to={`/business/${business.id}`} className="block group">
      <div className="card-elevated overflow-hidden hover-lift">
        {showImage && (
          <div className="relative aspect-[16/10] overflow-hidden">
            <SecureImage
              storagePath={imageUrl}
              alt={business.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />

            {/* Refined overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            
            {/* Top badges row */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              <div className="flex gap-2 flex-wrap">
                {business.category && (
                  <span className="px-3 py-1.5 rounded-full bg-white/95 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
                    {business.category.name}
                  </span>
                )}
                {business.featured && (
                  <span className="badge-featured">
                    Featured
                  </span>
                )}
              </div>
              
              {/* Open status */}
              {hoursStatus.text && (
                <div>
                  {hoursStatus.isOpen ? (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/90 text-success-foreground text-xs font-medium shadow-sm backdrop-blur-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" />
                      Open
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-full bg-muted/95 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
                      Closed
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom content on image */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-end justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-white font-bold text-lg leading-tight truncate drop-shadow-md">
                      {business.name}
                    </h3>
                    {business.isInLoop && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold flex-shrink-0">
                        <InfinityIcon className="h-2.5 w-2.5" />
                        Loop
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-white/90 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-lokal-amber text-lokal-amber" />
                      <span className="font-semibold">4.8</span>
                    </div>
                    {business.neighborhood && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{business.neighborhood.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Arrow button */}
                <div className="flex-shrink-0 ml-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
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
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    )}
                    {business.isInLoop && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                        <InfinityIcon className="h-2.5 w-2.5" />
                        Loop
                      </span>
                    )}
                  </div>
                  {business.category && (
                    <p className="text-sm text-muted-foreground">{business.category.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-lokal-amber text-lokal-amber" />
                  <span className="font-semibold">4.8</span>
                </div>
              </div>
            </>
          )}
          
          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {business.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-muted-foreground">
              {business.neighborhood && showImage && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{business.neighborhood.name}</span>
                </div>
              )}
              {hoursStatus.text && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{hoursStatus.text}</span>
                </div>
              )}
            </div>
            {business.verified && showImage && (
              <div className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}