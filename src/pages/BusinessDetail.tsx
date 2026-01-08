import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DealCard } from '@/components/cards/DealCard';
import { EventCard } from '@/components/cards/EventCard';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Instagram, 
  Clock, 
  CheckCircle,
  ArrowLeft,
  Building2
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          *,
          neighborhood:neighborhoods(name),
          category:categories(name, icon)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
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

  if (isLoading) {
    return (
      <>
        <Header title="Business" />
        <PageContainer>
          <Skeleton className="h-40 rounded-2xl mb-4" />
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

  return (
    <>
      <Header title={business.name} />
      
      <PageContainer className="space-y-6">
        <Link to="/explore" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Explore
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <Icon className="h-8 w-8 text-foreground" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate">{business.name}</h1>
              {business.verified && (
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
              )}
            </div>
            
            {business.category && (
              <p className="text-muted-foreground">{business.category.name}</p>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              {business.featured && (
                <Badge variant="secondary" className="bg-warning/10 text-warning">Featured</Badge>
              )}
              {business.neighborhood && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {business.neighborhood.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <p className="text-foreground">{business.description}</p>
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
      </PageContainer>
    </>
  );
}
