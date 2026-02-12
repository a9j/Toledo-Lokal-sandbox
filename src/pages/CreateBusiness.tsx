import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Crown } from 'lucide-react';

export default function CreateBusiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: neighborhoods } = useNeighborhoods();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref');

  // Look up connector from referral code
  const { data: referralConnector } = useQuery({
    queryKey: ['referral-connector', refCode],
    queryFn: async () => {
      if (!refCode) return null;
      const { data } = await supabase
        .from('connectors')
        .select('id, user_id')
        .eq('referral_code', refCode)
        .maybeSingle();
      return data;
    },
    enabled: !!refCode,
  });

  // Fetch all connectors for the dropdown
  const { data: allConnectors } = useQuery({
    queryKey: ['all-connectors-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connectors')
        .select('id, referral_code, user_id');
      if (error) return [];
      // Get names
      const userIds = data.map(c => c.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      return data.map(c => ({
        ...c,
        name: profiles?.find(p => p.user_id === c.user_id)?.name || 'Connector',
      }));
    },
  });

  const createBusiness = useMutation({
    mutationFn: async (formData: {
      name: string;
      description: string;
      category_id: string;
      neighborhood_id: string;
      phone?: string;
      website?: string;
      instagram?: string;
      address?: string;
      referral_source?: string;
      connected_by_connector_id?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');

      const connectorId = formData.connected_by_connector_id || referralConnector?.id || undefined;
      
      const { data: biz, error } = await supabase.from('businesses').insert({
        ...formData,
        owner_user_id: user.id,
        status: 'pending',
        connected_by_connector_id: connectorId || null,
        referral_source: formData.referral_source || (refCode ? 'referral_link' : null),
      }).select('id').single();
      
      if (error) throw error;
      
      // Add business role to user
      await supabase.from('user_roles').insert({
        user_id: user.id,
        role: 'business',
      });

      // Create connector referral record if connected
      if (connectorId && biz) {
        await supabase.from('connector_referrals').insert({
          connector_id: connectorId,
          business_id: biz.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-business'] });
      toast({ 
        title: 'Business submitted!',
        description: 'Your listing is pending approval.',
      });
      navigate('/profile');
    },
    onError: () => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to create business. Please try again.' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createBusiness.mutate({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category_id: formData.get('category_id') as string,
      neighborhood_id: formData.get('neighborhood_id') as string,
      phone: formData.get('phone') as string || undefined,
      website: formData.get('website') as string || undefined,
      instagram: formData.get('instagram') as string || undefined,
      address: formData.get('address') as string || undefined,
      referral_source: formData.get('referral_source') as string || undefined,
      connected_by_connector_id: formData.get('connector_id') as string || undefined,
    });
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <>
      <Header title="List Your Business" />
      
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input 
              id="name" 
              name="name" 
              placeholder="Your business name"
              required 
              maxLength={200}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select name="category_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Neighborhood *</Label>
              <Select name="neighborhood_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods?.map(n => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              name="description" 
              placeholder="Tell people about your business..."
              rows={4}
              required
              maxLength={5000}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address" 
              placeholder="123 Main St, Toledo, OH"
              maxLength={500}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel"
              placeholder="(419) 555-0123"
              maxLength={50}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              name="website" 
              type="url"
              placeholder="https://yourbusiness.com"
              maxLength={500}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram Handle</Label>
            <Input 
              id="instagram" 
              name="instagram" 
              placeholder="@yourbusiness"
              maxLength={100}
            />
          </div>

          {/* How did you hear about us */}
          <div className="space-y-2">
            <Label>How did you hear about Toledo Lokal?</Label>
            <Select name="referral_source">
              <SelectTrigger>
                <SelectValue placeholder="Select (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="search">Search / Google</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="word_of_mouth">Word of Mouth</SelectItem>
                <SelectItem value="connector">A Connector</SelectItem>
                <SelectItem value="event">An Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Connector selection */}
          {(refCode || allConnectors?.length) ? (
            <div className="space-y-2">
              <Label>Connected by</Label>
              {referralConnector ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <Crown className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    Referred by connector (code: {refCode})
                  </span>
                  <input type="hidden" name="connector_id" value={referralConnector.id} />
                </div>
              ) : (
                <Select name="connector_id">
                  <SelectTrigger>
                    <SelectValue placeholder="Select connector (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {allConnectors?.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.referral_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : null}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={createBusiness.isPending}
          >
            {createBusiness.isPending ? 'Submitting...' : 'Submit for Approval'}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Your listing will be reviewed before going live.
          </p>
        </form>
      </PageContainer>
    </>
  );
}
