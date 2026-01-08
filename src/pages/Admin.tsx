import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Tag, 
  Calendar, 
  Check, 
  X, 
  Star,
  ArrowLeft,
  Shield
} from 'lucide-react';

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pending businesses
  const { data: pendingBusinesses } = useQuery({
    queryKey: ['admin-pending-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*, category:categories(name), neighborhood:neighborhoods(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Pending deals
  const { data: pendingDeals } = useQuery({
    queryKey: ['admin-pending-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, business:businesses(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Pending events
  const { data: pendingEvents } = useQuery({
    queryKey: ['admin-pending-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, business:businesses(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const updateBusinessStatus = useMutation({
    mutationFn: async ({ id, status, featured }: { id: string; status?: string; featured?: boolean }) => {
      const updates: Record<string, any> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;
      
      const { error } = await supabase
        .from('businesses')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast({ title: 'Business updated' });
    },
  });

  const updateDealStatus = useMutation({
    mutationFn: async ({ id, status, featured }: { id: string; status?: string; featured?: boolean }) => {
      const updates: Record<string, any> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;
      
      const { error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({ title: 'Deal updated' });
    },
  });

  const updateEventStatus = useMutation({
    mutationFn: async ({ id, status, featured }: { id: string; status?: string; featured?: boolean }) => {
      const updates: Record<string, any> = {};
      if (status !== undefined) updates.status = status;
      if (featured !== undefined) updates.featured = featured;
      
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event updated' });
    },
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    return (
      <>
        <Header title="Admin" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have admin privileges.</p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Admin Panel" />
      
      <PageContainer>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <Tabs defaultValue="businesses" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="businesses" className="flex-1 gap-1.5">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Businesses</span>
              {pendingBusinesses && pendingBusinesses.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingBusinesses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex-1 gap-1.5">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Deals</span>
              {pendingDeals && pendingDeals.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingDeals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
              {pendingEvents && pendingEvents.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingEvents.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="space-y-3">
            {pendingBusinesses?.length ? (
              pendingBusinesses.map(biz => (
                <div key={biz.id} className="card-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{biz.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {biz.category?.name} · {biz.neighborhood?.name}
                      </p>
                      {biz.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {biz.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateBusinessStatus.mutate({ id: biz.id, status: 'approved' })}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateBusinessStatus.mutate({ id: biz.id, status: 'rejected' })}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateBusinessStatus.mutate({ id: biz.id, status: 'approved', featured: true })}
                      className="gap-1 ml-auto"
                    >
                      <Star className="h-4 w-4" />
                      Feature
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending businesses</p>
            )}
          </TabsContent>

          <TabsContent value="deals" className="space-y-3">
            {pendingDeals?.length ? (
              pendingDeals.map(deal => (
                <div key={deal.id} className="card-elevated p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground">{deal.business?.name}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateDealStatus.mutate({ id: deal.id, status: 'approved' })}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateDealStatus.mutate({ id: deal.id, status: 'rejected' })}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending deals</p>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-3">
            {pendingEvents?.length ? (
              pendingEvents.map(event => (
                <div key={event.id} className="card-elevated p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.business?.name}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => updateEventStatus.mutate({ id: event.id, status: 'approved' })}
                      className="gap-1"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateEventStatus.mutate({ id: event.id, status: 'rejected' })}
                      className="gap-1"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending events</p>
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
