import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useToast } from '@/hooks/use-toast';
import { Plus, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function Requests() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { data: neighborhoods } = useNeighborhoods();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          category:categories(name),
          neighborhood:neighborhoods(name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createRequest = useMutation({
    mutationFn: async (formData: {
      title: string;
      description: string;
      category_id: string;
      neighborhood_id: string;
      budget_min?: number;
      budget_max?: number;
      needed_by_date_time?: string;
    }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase.from('requests').insert({
        ...formData,
        created_by_user_id: user.id,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setIsOpen(false);
      toast({ title: 'Request posted successfully!' });
    },
    onError: () => {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to post request. Please try again.' 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createRequest.mutate({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category_id: formData.get('category_id') as string,
      neighborhood_id: formData.get('neighborhood_id') as string,
      budget_min: formData.get('budget_min') ? Number(formData.get('budget_min')) : undefined,
      budget_max: formData.get('budget_max') ? Number(formData.get('budget_max')) : undefined,
      needed_by_date_time: formData.get('needed_by') ? new Date(formData.get('needed_by') as string).toISOString() : undefined,
    });
  };

  return (
    <>
      <Header title="Requests" />
      
      <PageContainer className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Need help with something? Post a request.
          </p>
          
          {user ? (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full gap-1.5">
                  <Plus className="h-4 w-4" />
                  Post Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Post a Request</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">What do you need?</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      placeholder="e.g., Need snow shoveling help"
                      required 
                      maxLength={200}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Details</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Describe what you need..."
                      rows={3}
                      maxLength={2000}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Category</Label>
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
                      <Label>Neighborhood</Label>
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
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="budget_min">Budget Min ($)</Label>
                      <Input 
                        id="budget_min" 
                        name="budget_min" 
                        type="number" 
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget_max">Budget Max ($)</Label>
                      <Input 
                        id="budget_max" 
                        name="budget_max" 
                        type="number" 
                        placeholder="100"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="needed_by">Needed by</Label>
                    <Input 
                      id="needed_by" 
                      name="needed_by" 
                      type="datetime-local" 
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={createRequest.isPending}>
                    {createRequest.isPending ? 'Posting...' : 'Post Request'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Link to="/auth">
              <Button size="sm" variant="outline" className="rounded-full">
                Sign in to post
              </Button>
            </Link>
          )}
        </div>

        {/* Requests list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : requests?.length ? (
          <div className="space-y-3">
            {requests.map(request => (
              <div key={request.id} className="card-elevated p-4">
                <h3 className="font-semibold text-foreground">{request.title}</h3>
                {request.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {request.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  {request.category && (
                    <span className="bg-secondary px-2 py-1 rounded-full">
                      {request.category.name}
                    </span>
                  )}
                  {request.neighborhood && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {request.neighborhood.name}
                    </span>
                  )}
                  {(request.budget_min || request.budget_max) && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {request.budget_min && request.budget_max 
                        ? `$${request.budget_min} - $${request.budget_max}`
                        : request.budget_max 
                          ? `Up to $${request.budget_max}`
                          : `From $${request.budget_min}`}
                    </span>
                  )}
                  {request.needed_by_date_time && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(request.needed_by_date_time), 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No open requests</p>
          </div>
        )}
      </PageContainer>
    </>
  );
}
