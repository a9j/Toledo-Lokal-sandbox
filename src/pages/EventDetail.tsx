import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShareButton } from '@/components/sharing/ShareButton';
import { SEOHead, createEventJsonLd } from '@/components/seo/SEOHead';
import { format } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ExternalLink,
  ArrowLeft,
  Users,
  Check,
  Bookmark
} from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) throw new Error('Event not found');
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          business:businesses(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: rsvpCount } = useQuery({
    queryKey: ['event-rsvp-count', id],
    queryFn: async () => {
      if (!id) return 0;
      const { count, error } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id)
        .eq('status', 'going');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!id,
  });

  const { data: userRsvp } = useQuery({
    queryKey: ['event-rsvp', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: isSaved } = useQuery({
    queryKey: ['saved-event', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return false;
      const { data, error } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_type', 'event')
        .eq('item_id', id)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    },
    enabled: !!id && !!user,
  });

  const rsvpMutation = useMutation({
    mutationFn: async (status: 'going' | 'interested') => {
      if (!user || !id) throw new Error('Must be logged in');
      
      if (userRsvp) {
        if (userRsvp.status === status) {
          // Remove RSVP
          const { error } = await supabase
            .from('event_rsvps')
            .delete()
            .eq('id', userRsvp.id);
          if (error) throw error;
        } else {
          // Update RSVP
          const { error } = await supabase
            .from('event_rsvps')
            .update({ status })
            .eq('id', userRsvp.id);
          if (error) throw error;
        }
      } else {
        // Create RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .insert({ event_id: id, user_id: user.id, status });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-rsvp', id] });
      queryClient.invalidateQueries({ queryKey: ['event-rsvp-count', id] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Must be logged in');

      if (isSaved) {
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_type', 'event')
          .eq('item_id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_items')
          .insert({ user_id: user.id, item_type: 'event', item_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-event', id] });
      toast({ title: isSaved ? 'Removed from saved' : 'Saved!' });
    },
  });

  if (isLoading) {
    return (
      <>
        <Header title="Event" />
        <PageContainer>
          <Skeleton className="h-40 rounded-2xl mb-4" />
          <Skeleton className="h-20 rounded-xl" />
        </PageContainer>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Header title="Event" />
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Event not found</p>
            <Link to="/events">
              <Button variant="link">Back to Events</Button>
            </Link>
          </div>
        </PageContainer>
      </>
    );
  }

  const startDate = new Date(event.start_date_time);

  return (
    <>
      <SEOHead 
        title={event.title}
        description={event.description || `${event.title} - ${format(startDate, 'MMMM d, yyyy')} in Toledo, Ohio`}
        url={`/events/${event.id}`}
        type="event"
        image={event.image_url || undefined}
        keywords={[
          event.title,
          'Toledo event',
          format(startDate, 'MMMM yyyy'),
          event.location_text || '',
          'Glass City events',
        ].filter(Boolean)}
        jsonLd={createEventJsonLd({
          title: event.title,
          description: event.description || undefined,
          startDate: event.start_date_time,
          endDate: event.end_date_time || undefined,
          location: event.location_text || undefined,
          image: event.image_url || undefined,
          ticketUrl: event.ticket_url || undefined,
        })}
      />
      <Header title="Event" />
      
      <PageContainer className="space-y-6">
        <Link to="/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Events
        </Link>

        {/* Date display */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-primary uppercase">
              {format(startDate, 'MMM')}
            </span>
            <span className="text-2xl font-bold text-primary">
              {format(startDate, 'd')}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {event.featured && (
                <Badge variant="secondary" className="bg-warning/10 text-warning">Featured</Badge>
              )}
              <ShareButton 
                title={event.title}
                text={`${event.title} - ${format(startDate, 'MMM d')} at ${event.location_text || 'TBD'}`}
                className="ml-auto"
              />
            </div>
            <h1 className="text-xl font-bold">{event.title}</h1>
            {event.business && (
              <Link to={`/business/${event.business.id}`} className="text-primary hover:underline text-sm">
                by {event.business.name}
              </Link>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{format(startDate, 'EEEE, MMMM d, yyyy')}</p>
              <p className="text-xs text-muted-foreground">
                {format(startDate, 'h:mm a')}
                {event.end_date_time && ` - ${format(new Date(event.end_date_time), 'h:mm a')}`}
              </p>
            </div>
          </div>

          {event.location_text && (
            <a 
              href={`https://maps.google.com/?q=${encodeURIComponent(event.location_text)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{event.location_text}</span>
            </a>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">{rsvpCount} going</span>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">About</h2>
            <p className="text-foreground whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {user ? (
            <>
              <Button 
                className="flex-1 gap-2"
                variant={userRsvp?.status === 'going' ? 'default' : 'outline'}
                onClick={() => rsvpMutation.mutate('going')}
                disabled={rsvpMutation.isPending}
              >
                {userRsvp?.status === 'going' && <Check className="h-4 w-4" />}
                {userRsvp?.status === 'going' ? 'Going' : 'RSVP Going'}
              </Button>
              
              <Button 
                variant="outline"
                size="icon"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              </Button>
            </>
          ) : (
            <Link to="/auth" className="flex-1">
              <Button className="w-full">Sign in to RSVP</Button>
            </Link>
          )}
        </div>

        {event.ticket_url && (
          <Button variant="outline" asChild className="w-full gap-2">
            <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
              Get Tickets
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </PageContainer>
    </>
  );
}
