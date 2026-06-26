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
import { Heart, Upload, CheckCircle2 } from 'lucide-react';

export default function NonprofitSignup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: neighborhoods } = useNeighborhoods();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ein, setEin] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const createNonprofit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      let letterUrl: string | null = null;
      if (letterFile) {
        const ext = letterFile.name.split('.').pop();
        const path = `determination-letters/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('nonprofit-docs')
          .upload(path, letterFile);
        if (uploadErr) throw uploadErr;
        letterUrl = path;
      }

      const { error } = await supabase.from('businesses').insert({
        name: name.trim(),
        description: description.trim(),
        owner_user_id: user.id,
        status: 'pending',
        account_type: 'nonprofit' as never,
        verification_status: 'pending' as never,
        ein: ein.trim() || null,
        determination_letter_url: letterUrl,
        neighborhood_id: neighborhoodId || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
      });

      if (error) throw error;

      await supabase.from('user_roles').upsert({
        user_id: user.id,
        role: 'nonprofit',
      }, { onConflict: 'user_id,role', ignoreDuplicates: true });
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      console.error('Nonprofit signup error:', err);
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
            <h2 className="text-xl font-bold mb-2">You're in the queue</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              Our team will review your nonprofit registration and verify your
              501(c)(3) status. You will be notified once approved.
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
    if (!name.trim() || !description.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
      });
      return;
    }
    createNonprofit.mutate();
  };

  return (
    <>
      <Header title="Register Nonprofit" showBack />
      <PageContainer>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-medium text-rose-500">Nonprofit Registration</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">
            Register your 501(c)(3)
          </h1>
          <p className="text-muted-foreground text-sm">
            Verified nonprofits get a free listing in the Community directory.
            Core features are always free. You can optionally promote drives or
            volunteer needs later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="np-name">Organization Name *</Label>
            <Input
              id="np-name"
              placeholder="Your nonprofit name"
              maxLength={200}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-desc">Mission / Description *</Label>
            <Textarea
              id="np-desc"
              placeholder="What does your organization do?"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-ein">EIN (Employer Identification Number)</Label>
            <Input
              id="np-ein"
              placeholder="XX-XXXXXXX"
              maxLength={20}
              value={ein}
              onChange={e => setEin(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-letter">501(c)(3) Determination Letter</Label>
            <div className="flex items-center gap-3">
              <label
                htmlFor="np-letter"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-border cursor-pointer hover:bg-muted transition-colors"
              >
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {letterFile ? letterFile.name : 'Upload PDF or image'}
                </span>
              </label>
              <input
                id="np-letter"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => setLetterFile(e.target.files?.[0] || null)}
              />
            </div>
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
            <Label htmlFor="np-phone">Phone</Label>
            <Input
              id="np-phone"
              placeholder="(419) 555-0123"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-website">Website</Label>
            <Input
              id="np-website"
              placeholder="https://yourorg.org"
              value={website}
              onChange={e => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="np-address">Address</Label>
            <Input
              id="np-address"
              placeholder="123 Main St, Toledo, OH"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createNonprofit.isPending}
          >
            {createNonprofit.isPending ? 'Submitting...' : 'Submit for Verification'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your listing will be reviewed before appearing in the Community directory.
            There is no fee to register or to use the platform.
          </p>
        </form>
      </PageContainer>
    </>
  );
}
