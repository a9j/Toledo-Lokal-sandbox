import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
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
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useToast } from '@/hooks/use-toast';
import { Building2, CheckCircle2 } from 'lucide-react';

export default function CommunityPartnerSignup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: neighborhoods } = useNeighborhoods();

  const [name, setName] = useState('');
  const [mission, setMission] = useState('');
  const [reason, setReason] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const createPartner = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase.from('businesses').insert({
        name: name.trim(),
        description: mission.trim(),
        owner_user_id: user.id,
        status: 'pending',
        category_id: '94102354-adc1-4da0-91b7-de7f71e5127f',
        neighborhood_id: neighborhoodId || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
      });

      if (error) throw error;

      await supabase.from('user_roles').upsert({
        user_id: user.id,
        role: 'partner',
      }, { onConflict: 'user_id,role', ignoreDuplicates: true });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      console.error('Community partner signup error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit. Please try again.',
      });
    },
  });

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (submitted) {
    return (
      <>
        <Header title="Application Submitted" />
        <PageContainer>
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Application received</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              Our team will review your application. Community partners are
              mission-driven organizations that serve Toledo, even without formal
              nonprofit status. You will be notified once reviewed.
            </p>
            <Button onClick={() => navigate('/community')} className="rounded-full">
              Back to Community
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mission.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in the organization name and mission.',
      });
      return;
    }
    createPartner.mutate();
  };

  return (
    <>
      <Header title="Community Partner" showBack />
      <PageContainer>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Community Partner Application</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">
            Apply as a Community Partner
          </h1>
          <p className="text-muted-foreground text-sm">
            For mission-driven organizations that serve Toledo but do not have
            formal 501(c)(3) status. Approved partners get a free listing in the
            Community directory. Core features are always free.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cp-name">Organization Name *</Label>
            <Input
              id="cp-name"
              placeholder="Your organization name"
              maxLength={200}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-mission">Mission *</Label>
            <Textarea
              id="cp-mission"
              placeholder="What is your organization's mission?"
              rows={3}
              maxLength={2000}
              value={mission}
              onChange={e => setMission(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-reason">Why do you belong in the Community directory?</Label>
            <Textarea
              id="cp-reason"
              placeholder="Tell us how your organization serves Toledo..."
              rows={3}
              maxLength={2000}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Neighborhood</Label>
            <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {neighborhoods?.map(n => (
                  <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-phone">Phone</Label>
            <Input
              id="cp-phone"
              placeholder="(419) 555-0123"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-website">Website</Label>
            <Input
              id="cp-website"
              placeholder="https://yourorg.org"
              value={website}
              onChange={e => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-address">Address</Label>
            <Input
              id="cp-address"
              placeholder="123 Main St, Toledo, OH"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createPartner.isPending}
          >
            {createPartner.isPending ? 'Submitting...' : 'Submit Application'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your application will be reviewed before appearing in the Community
            directory. There is no fee.
          </p>
        </form>
      </PageContainer>
    </>
  );
}
