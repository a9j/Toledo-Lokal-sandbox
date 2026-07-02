import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SecureAvatar } from '@/components/ui/secure-avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectorReferrals, useConnectorEvents, useIsFollowingConnector, useToggleFollowConnector } from '@/hooks/useConnectors';
import { Crown, Globe, Instagram, Users, Building2, Calendar, MapPin, Clock, ExternalLink, UserPlus, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ConnectorProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const { data: connector, isLoading } = useQuery({
    queryKey: ['connector-profile', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('connectors')
        .select('*')
        .eq('referral_slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: profile } = useQuery({
    queryKey: ['connector-profile-user', connector?.user_id],
    queryFn: async () => {
      if (!connector?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('user_id', connector.user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!connector?.user_id,
  });

  const { data: referrals } = useConnectorReferrals(connector?.id);
  const { data: events } = useConnectorEvents(connector?.id);
  const { data: isFollowing } = useIsFollowingConnector(connector?.id);
  const toggleFollow = useToggleFollowConnector();

  const now = new Date();
  const upcomingEvents = events?.filter(e => new Date(e.start_date_time) > now) || [];
  const pastEvents = events?.filter(e => new Date(e.start_date_time) <= now) || [];
  const activeBusinesses = referrals?.filter(r => r.business?.status === 'approved') || [];

  const socialLinks = (connector?.social_links as Record<string, string>) || {};

  if (isLoading) {
    return (
      <>
        <Header title="Connector" showBack />
        <PageContainer>
          <div className="animate-pulse space-y-4 py-8">
            <div className="h-20 w-20 rounded-full bg-muted mx-auto" />
            <div className="h-6 w-48 bg-muted mx-auto rounded" />
          </div>
        </PageContainer>
      </>
    );
  }

  if (!connector) {
    return (
      <>
        <Header title="Not Found" showBack />
        <PageContainer>
          <p className="text-center text-muted-foreground py-16">Connector not found.</p>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title={profile?.name || 'Connector'} showBack />
      <PageContainer className="space-y-6 pb-24">
        {/* Header Section */}
        <div className="text-center space-y-3 pt-4">
          <SecureAvatar
            storagePath={profile?.avatar_url}
            fallbackText={profile?.name || 'C'}
            className="h-24 w-24 mx-auto ring-4 ring-amber-400/30"
            fallbackClassName="text-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white"
          />

          <div>
            <h1 className="text-2xl font-bold">{profile?.name}</h1>
            <Badge className="mt-2 gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 px-3 py-1">
              <Crown className="h-3.5 w-3.5" />
              {connector.title || 'Founding Connector'}
            </Badge>
          </div>

          {connector.bio && (
            <p className="text-muted-foreground max-w-md mx-auto">{connector.bio}</p>
          )}

          {/* Social Links */}
          <div className="flex items-center justify-center gap-3">
            {socialLinks.website && (
              <a href={socialLinks.website} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                <Globe className="h-4 w-4" />
              </a>
            )}
            {socialLinks.instagram && (
              <a href={`https://instagram.com/${socialLinks.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Follow Button */}
          {user && user.id !== connector.user_id && (
            <Button
              onClick={() => toggleFollow.mutate({ connectorId: connector.id, isFollowing: !!isFollowing })}
              variant={isFollowing ? 'outline' : 'default'}
              className={`gap-2 ${!isFollowing ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600' : ''}`}
              disabled={toggleFollow.isPending}
            >
              {isFollowing ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? 'Following' : 'Follow Connector'}
            </Button>
          )}

          {/* Stats */}
          <div className="flex justify-center gap-8 pt-2">
            <div className="text-center">
              <p className="text-xl font-bold">{activeBusinesses.length}</p>
              <p className="text-xs text-muted-foreground">Connected</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{events?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{connector.follower_count || 0}</p>
              <p className="text-xs text-muted-foreground">Followers</p>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </h2>
            {upcomingEvents.map(event => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <div className="card-elevated p-4 space-y-1 hover:bg-secondary/50 transition-colors">
                  <h3 className="font-medium">{event.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(event.start_date_time), 'MMM d · h:mm a')}
                    </span>
                    {event.location_text && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location_text}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}

        {/* Businesses Connected */}
        {activeBusinesses.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Businesses Connected
            </h2>
            {activeBusinesses.map(ref => (
              <Link key={ref.id} to={`/business/${ref.business?.id}`}>
                <div className="card-elevated p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{ref.business?.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{ref.business?.category?.name}</span>
                        <span>·</span>
                        <span>{format(new Date(ref.created_at), 'MMM yyyy')}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1 text-[10px] text-amber-700 border-amber-200 bg-amber-50">
                      <Crown className="h-2.5 w-2.5" />
                      Connected
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-muted-foreground">Past Events</h2>
            {pastEvents.slice(0, 5).map(event => (
              <div key={event.id} className="card-elevated p-3 opacity-70">
                <h3 className="font-medium text-sm">{event.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.start_date_time), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </section>
        )}
      </PageContainer>
    </>
  );
}
