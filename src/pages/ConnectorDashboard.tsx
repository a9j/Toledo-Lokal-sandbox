import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectorByUserId, useConnectorReferrals, useConnectorEvents } from '@/hooks/useConnectors';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, ArrowLeft, Copy, Building2, Calendar, Users, Eye, 
  Link as LinkIcon, Plus, MapPin, Clock, BarChart3, Share2
} from 'lucide-react';
import { format } from 'date-fns';

export default function ConnectorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connector, isLoading } = useConnectorByUserId(user?.id);
  const { data: referrals } = useConnectorReferrals(connector?.id);
  const { data: events } = useConnectorEvents(connector?.id);

  const [showEventForm, setShowEventForm] = useState(false);

  const activeBusinesses = referrals?.filter(r => r.business?.status === 'approved') || [];

  const createEvent = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!connector) throw new Error('Not a connector');
      const { error } = await supabase.from('events').insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        location_text: formData.get('location') as string,
        start_date_time: formData.get('start_date_time') as string,
        end_date_time: (formData.get('end_date_time') as string) || null,
        connector_id: connector.id,
        status: 'approved', // connector events auto-approved
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connector-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEventForm(false);
      toast({ title: 'Event created!' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to create event' });
    },
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/create-business?ref=${connector?.referral_code}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Referral link copied!' });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(connector?.referral_code || '');
    toast({ title: 'Referral code copied!' });
  };

  if (!user) { navigate('/auth'); return null; }

  if (isLoading) {
    return (
      <>
        <Header title="Connector" />
        <PageContainer><p className="text-center py-8 text-muted-foreground">Loading...</p></PageContainer>
      </>
    );
  }

  if (!connector) {
    return (
      <>
        <Header title="Connector" />
        <PageContainer>
          <div className="text-center py-16 space-y-3">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Not a Connector</h2>
            <p className="text-muted-foreground">You don't have Connector access yet.</p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Connector Hub" />
      <PageContainer className="space-y-6 pb-24">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {/* Header Card */}
        <div className="card-elevated p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Founding Connector</h1>
              <p className="text-sm text-muted-foreground">Your networking dashboard</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-elevated p-4 text-center">
            <Building2 className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{activeBusinesses.length}</p>
            <p className="text-xs text-muted-foreground">Active Businesses</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{events?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Events Hosted</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{connector.follower_count || 0}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <Eye className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{connector.profile_views || 0}</p>
            <p className="text-xs text-muted-foreground">Profile Views</p>
          </div>
        </div>

        {/* Referral Links */}
        <div className="card-elevated p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <LinkIcon className="h-4 w-4" /> Your Referral Links
          </h2>
          <div className="flex items-center gap-2">
            <Input 
              readOnly 
              value={`${window.location.origin}/create-business?ref=${connector.referral_code}`}
              className="text-xs font-mono"
            />
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Code:</span>
            <Badge variant="outline" className="font-mono">{connector.referral_code}</Badge>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopyCode}>
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Public Profile:</span>
            <a 
              href={`/connector/${connector.referral_slug}`}
              className="text-sm text-primary hover:underline"
            >
              /connector/{connector.referral_slug}
            </a>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/connector/${connector.referral_slug}`);
              toast({ title: 'Profile link copied!' });
            }}>
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="events">
          <TabsList className="w-full">
            <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
            <TabsTrigger value="businesses" className="flex-1">Businesses</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-3 mt-3">
            <Button onClick={() => setShowEventForm(!showEventForm)} className="w-full gap-2">
              <Plus className="h-4 w-4" /> Create Event
            </Button>

            {showEventForm && (
              <form 
                className="card-elevated p-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  createEvent.mutate(new FormData(e.currentTarget));
                }}
              >
                <div className="space-y-2">
                  <Label>Event Title *</Label>
                  <Input name="title" required maxLength={200} placeholder="Networking Mixer" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" rows={3} placeholder="What's this event about?" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input name="location" placeholder="Venue name or address" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start *</Label>
                    <Input name="start_date_time" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label>End</Label>
                    <Input name="end_date_time" type="datetime-local" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createEvent.isPending} className="flex-1">
                    {createEvent.isPending ? 'Creating...' : 'Create Event'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowEventForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {events?.length ? (
              events.map(event => (
                <div key={event.id} className="card-elevated p-3">
                  <h3 className="font-medium">{event.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
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
                  <Badge variant={event.status === 'approved' ? 'default' : 'secondary'} className="mt-2 text-[10px]">
                    {event.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-6">No events yet</p>
            )}
          </TabsContent>

          <TabsContent value="businesses" className="space-y-3 mt-3">
            {referrals?.length ? (
              referrals.map(ref => (
                <div key={ref.id} className="card-elevated p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{ref.business?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {ref.business?.category?.name} · {format(new Date(ref.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={ref.business?.status === 'approved' ? 'default' : 'secondary'}>
                      {ref.business?.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-muted-foreground">No businesses connected yet</p>
                <p className="text-sm text-muted-foreground">Share your referral link to get started</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
