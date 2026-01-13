import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SecureImage } from '@/components/ui/secure-image';
import { DealCard } from '@/components/cards/DealCard';
import { EventCard } from '@/components/cards/EventCard';
import { BusinessMap } from '@/components/maps/BusinessMap';
import { ReviewsSection } from '@/components/reviews/ReviewsSection';
import { StarRating } from '@/components/reviews/StarRating';
import { ShareButton } from '@/components/sharing/ShareButton';
import { SEOHead, createBusinessJsonLd } from '@/components/seo/SEOHead';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Instagram, 
  Clock, 
  CheckCircle,
  ArrowLeft,
  Building2,
  Heart,
  Infinity
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

// Day order for displaying hours
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();

  // Public-safe columns that don't expose owner_user_id
  const PUBLIC_BUSINESS_COLUMNS = `
    id,
    name,
    slug,
    description,
    address,
    phone,
    website,
    instagram,
    tiktok,
    facebook,
    category_id,
    neighborhood_id,
    featured,
    verified,
    average_rating,
    review_count,
    photos,
    logo_url,
    hours,
    editor_pick_image,
    story,
    status,
    created_at,
    updated_at,
    owner_user_id
  `;

  // Check if id is a UUID or a slug
  const isUUID = id ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) : false;

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      // Use businesses_public view which masks phone for unauthenticated users
      let query = supabase
        .from('businesses_public')
        .select(`
          ${PUBLIC_BUSINESS_COLUMNS},
          neighborhood:neighborhoods(name),
          category:categories(name, icon),
          business_loop_settings(is_active, loop_tier_id)
        `);
      
      // Query by UUID or slug
      if (isUUID) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }
      
      const { data, error } = await query.single();
      
      if (error) throw error;
      
      // Add isInLoop flag
      return {
        ...data,
        isInLoop: data.business_loop_settings?.is_active && 
          data.business_loop_settings?.loop_tier_id !== 'visible_only'
      };
    },
    enabled: !!id,
  });

  const { data: deals } = useQuery({
    queryKey: ['business-deals', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('business_id', id)
        .eq('status', 'approved')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: events } = useQuery({
    queryKey: ['business-events', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('business_id', id)
        .eq('status', 'approved')
        .gte('start_date_time', new Date().toISOString())
        .order('start_date_time', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const getIcon = (iconName?: string) => {
    if (!iconName) return Building2;
    const name = iconName.charAt(0).toUpperCase() + iconName.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase());
    return (LucideIcons as Record<string, any>)[name] || Building2;
  };

  // Convert 24hr to 12hr format
  const formatTime12hr = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Parse hours if available
  const parseHours = (hours: unknown): Record<string, { open: string; close: string; closed?: boolean } | null> | null => {
    if (!hours || typeof hours !== 'object') return null;
    return hours as Record<string, { open: string; close: string; closed?: boolean } | null>;
  };

  if (isLoading) {
    return (
      <>
        <Header title="Business" />
        <PageContainer>
          <Skeleton className="h-56 rounded-2xl mb-4" />
          <Skeleton className="h-24 rounded-xl mb-4" />
          <Skeleton className="h-20 rounded-xl mb-2" />
          <Skeleton className="h-20 rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (!business) {
    return (
      <>
        <Header title="Business" />
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Business not found</p>
            <Link to="/explore">
              <Button variant="link">Back to Explore</Button>
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const Icon = getIcon(business.category?.icon);
  const photos = business.photos && business.photos.length > 0 ? business.photos : [];
  const hasPhotos = photos.length > 0;
  const parsedHours = parseHours(business.hours);

  return (
    <>
      <SEOHead 
        title={business.name}
        description={business.description || `${business.name} - a local business in Toledo, Ohio. ${business.category?.name || ''}`}
        url={`/business/${business.slug || business.id}`}
        type="business.business"
        image={photos[0] || business.logo_url}
        keywords={[
          business.name,
          business.category?.name || '',
          business.neighborhood?.name || '',
          'Toledo business',
          'Glass City',
        ].filter(Boolean)}
        jsonLd={createBusinessJsonLd({
          name: business.name,
          description: business.description || undefined,
          address: business.address || undefined,
          phone: business.phone || undefined,
          website: business.website || undefined,
          rating: business.average_rating || undefined,
          reviewCount: business.review_count || undefined,
          image: photos[0] || business.logo_url || undefined,
          slug: business.slug || undefined,
        })}
      />
      <Header title={business.name} />
      
      <PageContainer className="space-y-6">
        <Link to="/explore" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Explore
        </Link>

        {/* Main Photo */}
        {hasPhotos ? (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-secondary">
            <SecureImage
              storagePath={photos[0]}
              alt={`${business.name} photo`}
              className="w-full h-full object-cover"
            />
            {business.featured && (
              <Badge className="absolute top-3 left-3 bg-warning text-warning-foreground">
                Featured
              </Badge>
            )}
          </div>
        ) : (
          /* Fallback header when no photos */
          <div className="aspect-[16/9] rounded-2xl bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center">
            <div className="text-center">
              {business.logo_url ? (
                <SecureImage
                  storagePath={business.logo_url}
                  alt={business.name}
                  className="w-24 h-24 rounded-2xl object-cover mx-auto mb-3"
                  loading="lazy"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {business.featured && (
                <Badge className="bg-warning text-warning-foreground">Featured</Badge>
              )}
            </div>
          </div>
        )}

        {/* Business Info Header */}
        <div className="flex items-start gap-4">
          {hasPhotos && (
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 border-2 border-background shadow-md -mt-10 relative z-10">
              {business.logo_url ? (
                <SecureImage
                  storagePath={business.logo_url}
                  alt={business.name}
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                />
              ) : (
                <Icon className="h-6 w-6 text-foreground" />
              )}
            </div>
          )}
          
          <div className={`flex-1 min-w-0 ${hasPhotos ? '-mt-2' : ''}`}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl font-bold truncate">{business.name}</h1>
              {business.verified && (
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              )}
              {business.isInLoop && (
                <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-0.5 flex items-center gap-1">
                  <Infinity className="h-3 w-3" />
                  in the loop
                </Badge>
              )}
              <ShareButton 
                title={business.name}
                text={business.description || `Check out ${business.name} on Toledo Connect`}
                className="ml-auto"
              />
            </div>
            
            {/* Rating display */}
            {(business.review_count ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 mb-1">
                <StarRating rating={business.average_rating ?? 0} size="sm" />
                <span className="text-sm text-muted-foreground">
                  ({business.review_count})
                </span>
              </div>
            )}
            
            {business.category && (
              <p className="text-muted-foreground">{business.category.name}</p>
            )}
            
            {business.neighborhood && (
              <span className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {business.neighborhood.name}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <p className="text-foreground leading-relaxed">{business.description}</p>
        )}

        {/* Our Story Section */}
        {business.story && (
          <section className="card-elevated p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Our Story</h2>
            </div>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
              {business.story}
            </p>
          </section>
        )}

        {/* Hours */}
        {parsedHours && (
          <section className="card-elevated p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Hours</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {DAY_ORDER.map(day => {
                const dayHours = parsedHours[day];
                const isClosed = !dayHours || dayHours.closed;
                return (
                  <div key={day} className="contents">
                    <span className="text-muted-foreground">{DAY_LABELS[day]}</span>
                    <span className="text-foreground">
                      {isClosed ? 'Closed' : `${formatTime12hr(dayHours.open)} - ${formatTime12hr(dayHours.close)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Map */}
        {business.address && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Location</h2>
            <BusinessMap 
              address={business.address} 
              businessName={business.name}
              className="h-48"
            />
          </section>
        )}

        {/* Contact info */}
        <div className="space-y-3">
          {business.address && (
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(business.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{business.address}</span>
            </a>
          )}
          
          {business.phone && (
            <a 
              href={`tel:${business.phone}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{business.phone}</span>
            </a>
          )}
          
          {business.website && (
            <a 
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Globe className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm truncate">{business.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
          
          {business.instagram && (
            <a 
              href={`https://instagram.com/${business.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <Instagram className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{business.instagram}</span>
            </a>
          )}
          
          {(business as any).tiktok && (
            <a 
              href={`https://tiktok.com/@${(business as any).tiktok.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="text-sm">{(business as any).tiktok}</span>
            </a>
          )}
          
          {(business as any).facebook && (
            <a 
              href={`https://facebook.com/${(business as any).facebook.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm">{(business as any).facebook}</span>
            </a>
          )}
        </div>

        {/* Active Deals */}
        {deals && deals.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Active Deals</h2>
            <div className="space-y-3">
              {deals.map(deal => (
                <DealCard key={deal.id} deal={{ ...deal, business }} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {events && events.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Upcoming Events</h2>
            <div className="space-y-3">
              {events.map(event => (
                <EventCard key={event.id} event={{ ...event, business }} compact />
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <ReviewsSection 
          businessId={business.id}
          businessOwnerId={(business as any).owner_user_id}
          averageRating={business.average_rating ?? 0}
          reviewCount={business.review_count ?? 0}
        />
      </PageContainer>
    </>
  );
}
