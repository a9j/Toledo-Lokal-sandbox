import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { CAUSE_CATEGORY_LABELS, COMMUNITY_SUPPORT_LABELS } from '@/hooks/useNonprofits';
import { Database } from '@/integrations/supabase/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus,
  Pencil,
  Award,
  Heart,
  Trash2,
  Check
} from 'lucide-react';

type CauseCategory = Database['public']['Enums']['cause_category'];
type CommunitySupportType = Database['public']['Enums']['community_support_type'];

const CAUSE_CATEGORIES = Object.keys(CAUSE_CATEGORY_LABELS) as CauseCategory[];
const SUPPORT_TYPES = Object.keys(COMMUNITY_SUPPORT_LABELS) as CommunitySupportType[];

interface NonprofitFormData {
  name: string;
  cause_category: CauseCategory;
  neighborhood_id: string;
  mission_statement: string;
  what_this_helps: string;
  community_support_types: CommunitySupportType[];
  human_note: string;
  founding_community_partner: boolean;
  website: string;
  email: string;
  phone: string;
  address: string;
}

const initialFormData: NonprofitFormData = {
  name: '',
  cause_category: 'community_support',
  neighborhood_id: '',
  mission_statement: '',
  what_this_helps: '',
  community_support_types: [],
  human_note: '',
  founding_community_partner: false,
  website: '',
  email: '',
  phone: '',
  address: '',
};

export function NonprofitAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<NonprofitFormData>(initialFormData);

  const { data: neighborhoods } = useNeighborhoods();

  const { data: nonprofits, isLoading } = useQuery({
    queryKey: ['admin-nonprofits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nonprofits')
        .select('*, neighborhood:neighborhoods(id, name)')
        .order('founding_community_partner', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const foundingCount = nonprofits?.filter(n => n.founding_community_partner).length || 0;

  const createNonprofit = useMutation({
    mutationFn: async (data: NonprofitFormData) => {
      const { error } = await supabase.from('nonprofits').insert({
        name: data.name,
        cause_category: data.cause_category,
        neighborhood_id: data.neighborhood_id || null,
        mission_statement: data.mission_statement,
        what_this_helps: data.what_this_helps || null,
        community_support_types: data.community_support_types,
        human_note: data.human_note || null,
        founding_community_partner: data.founding_community_partner,
        website: data.website || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nonprofits'] });
      queryClient.invalidateQueries({ queryKey: ['nonprofits'] });
      toast({ title: 'Nonprofit created!' });
      setIsCreateOpen(false);
      setFormData(initialFormData);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create nonprofit. Please try again.', variant: 'destructive' });
    },
  });

  const updateNonprofit = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NonprofitFormData> }) => {
      const { error } = await supabase
        .from('nonprofits')
        .update({
          name: data.name,
          cause_category: data.cause_category,
          neighborhood_id: data.neighborhood_id || null,
          mission_statement: data.mission_statement,
          what_this_helps: data.what_this_helps || null,
          community_support_types: data.community_support_types,
          human_note: data.human_note || null,
          founding_community_partner: data.founding_community_partner,
          website: data.website || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nonprofits'] });
      queryClient.invalidateQueries({ queryKey: ['nonprofits'] });
      toast({ title: 'Nonprofit updated!' });
      setEditingId(null);
      setFormData(initialFormData);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update nonprofit. Please try again.', variant: 'destructive' });
    },
  });

  const toggleFoundingPartner = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from('nonprofits')
        .update({ founding_community_partner: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { value }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-nonprofits'] });
      queryClient.invalidateQueries({ queryKey: ['nonprofits'] });
      toast({ 
        title: value ? 'Founding Partner added!' : 'Founding Partner status removed' 
      });
    },
  });

  const deleteNonprofit = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nonprofits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-nonprofits'] });
      queryClient.invalidateQueries({ queryKey: ['nonprofits'] });
      toast({ title: 'Nonprofit deleted' });
    },
  });

  const openEdit = (nonprofit: any) => {
    setEditingId(nonprofit.id);
    setFormData({
      name: nonprofit.name,
      cause_category: nonprofit.cause_category,
      neighborhood_id: nonprofit.neighborhood_id || '',
      mission_statement: nonprofit.mission_statement,
      what_this_helps: nonprofit.what_this_helps || '',
      community_support_types: nonprofit.community_support_types || [],
      human_note: nonprofit.human_note || '',
      founding_community_partner: nonprofit.founding_community_partner,
      website: nonprofit.website || '',
      email: nonprofit.email || '',
      phone: nonprofit.phone || '',
      address: nonprofit.address || '',
    });
  };

  const handleSupportTypeToggle = (type: CommunitySupportType) => {
    setFormData(prev => ({
      ...prev,
      community_support_types: prev.community_support_types.includes(type)
        ? prev.community_support_types.filter(t => t !== type)
        : [...prev.community_support_types, type]
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.mission_statement) {
      toast({ title: 'Missing required fields', variant: 'destructive' });
      return;
    }

    if (editingId) {
      updateNonprofit.mutate({ id: editingId, data: formData });
    } else {
      createNonprofit.mutate(formData);
    }
  };

  const NonprofitForm = () => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div>
        <Label>Name *</Label>
        <Input 
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Organization name"
        />
      </div>

      <div>
        <Label>Cause Category *</Label>
        <Select
          value={formData.cause_category}
          onValueChange={(value) => setFormData(prev => ({ ...prev, cause_category: value as CauseCategory }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAUSE_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {CAUSE_CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Neighborhood</Label>
        <Select
          value={formData.neighborhood_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, neighborhood_id: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select neighborhood" />
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

      <div>
        <Label>Mission Statement * (1 sentence)</Label>
        <Textarea
          value={formData.mission_statement}
          onChange={(e) => setFormData(prev => ({ ...prev, mission_statement: e.target.value }))}
          placeholder="What does this organization do?"
          rows={2}
        />
      </div>

      <div>
        <Label>What This Helps</Label>
        <Input
          value={formData.what_this_helps}
          onChange={(e) => setFormData(prev => ({ ...prev, what_this_helps: e.target.value }))}
          placeholder="Short description of impact"
        />
      </div>

      <div>
        <Label>How the Community Shows Up</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {SUPPORT_TYPES.map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.community_support_types.includes(type)}
                onCheckedChange={() => handleSupportTypeToggle(type)}
              />
              <span className="text-sm">{COMMUNITY_SUPPORT_LABELS[type]}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Human Note (optional)</Label>
        <Input
          value={formData.human_note}
          onChange={(e) => setFormData(prev => ({ ...prev, human_note: e.target.value }))}
          placeholder="A personal touch or story"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={formData.founding_community_partner}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, founding_community_partner: !!checked }))}
        />
        <Label className="cursor-pointer">Founding Community Partner</Label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Website</Label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="contact@..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="(419) ..."
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="123 Main St, Toledo"
          />
        </div>
      </div>

      <Button onClick={handleSubmit} className="w-full">
        {editingId ? 'Update Nonprofit' : 'Create Nonprofit'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-500" />
            Community Organizations
          </h2>
          <p className="text-sm text-muted-foreground">
            Founding Partners: {foundingCount}/5
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add Nonprofit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Nonprofit</DialogTitle>
            </DialogHeader>
            <NonprofitForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : nonprofits?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No nonprofits yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {nonprofits?.map((nonprofit) => (
            <div key={nonprofit.id} className="card-elevated p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{nonprofit.name}</h3>
                    {nonprofit.founding_community_partner && (
                      <Badge className="bg-amber-500 text-white text-[10px]">
                        <Award className="h-3 w-3 mr-1" />
                        Founding
                      </Badge>
                    )}
                    {nonprofit.claimed && (
                      <Badge variant="outline" className="text-[10px]">Claimed</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {CAUSE_CATEGORY_LABELS[nonprofit.cause_category as CauseCategory]}
                    {nonprofit.neighborhood && ` · ${nonprofit.neighborhood.name}`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {nonprofit.mission_statement}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  size="sm"
                  variant={nonprofit.founding_community_partner ? 'default' : 'outline'}
                  onClick={() => toggleFoundingPartner.mutate({ 
                    id: nonprofit.id, 
                    value: !nonprofit.founding_community_partner 
                  })}
                  disabled={!nonprofit.founding_community_partner && foundingCount >= 5}
                  className="gap-1"
                >
                  <Award className="h-4 w-4" />
                  {nonprofit.founding_community_partner ? <><Check className="h-3 w-3" /> Founding</> : 'Make Founding'}
                </Button>

                <Dialog open={editingId === nonprofit.id} onOpenChange={(open) => {
                  if (!open) {
                    setEditingId(null);
                    setFormData(initialFormData);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => openEdit(nonprofit)}
                      className="gap-1"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Nonprofit</DialogTitle>
                    </DialogHeader>
                    <NonprofitForm />
                  </DialogContent>
                </Dialog>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Delete this nonprofit?')) {
                      deleteNonprofit.mutate(nonprofit.id);
                    }
                  }}
                  className="gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
