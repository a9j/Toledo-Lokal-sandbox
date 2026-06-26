import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useBusinessFoodLocations, useCreateFoodLocation, useUpdateFoodLocation, useDeleteFoodLocation } from '@/hooks/useFoodTruckLocations';
import { useBusinessFeatures, useUpdateBusinessFeatures } from '@/hooks/useBusinessFeatures';
import { isFoodTruckCategory } from '@/lib/business-access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { 
  ArrowLeft, 
  Plus, 
  Truck, 
  Trash2, 
  Edit,
  MapPin,
  Clock,
  Copy
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LocationFormData {
  location_date: string;
  location_name: string;
  address: string;
  start_time: string;
  end_time: string;
  notes: string;
}

const defaultFormData: LocationFormData = {
  location_date: format(new Date(), 'yyyy-MM-dd'),
  location_name: '',
  address: '',
  start_time: '11:00',
  end_time: '19:00',
  notes: '',
};

export default function DashboardFoodTruck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);

  // Get user's business
  const { data: business } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, category')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: features, isLoading: featuresLoading } = useBusinessFeatures(business?.id);
  const { data: locations, isLoading: locationsLoading } = useBusinessFoodLocations(business?.id);
  const updateFeatures = useUpdateBusinessFeatures();
  const createLocation = useCreateFoodLocation();
  const updateLocation = useUpdateFoodLocation();
  const deleteLocation = useDeleteFoodLocation();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleToggleFoodTruck = () => {
    if (!business) return;
    updateFeatures.mutate({
      businessId: business.id,
      food_truck_enabled: !features?.food_truck_enabled,
    });
  };

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setEditingLocation(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (location: NonNullable<typeof locations>[number]) => {
    setFormData({
      location_date: location.location_date,
      location_name: location.location_name,
      address: location.address || '',
      start_time: location.start_time.slice(0, 5),
      end_time: location.end_time.slice(0, 5),
      notes: location.notes || '',
    });
    setEditingLocation(location.id);
    setDialogOpen(true);
  };

  const handleDuplicate = (location: NonNullable<typeof locations>[number]) => {
    setFormData({
      location_date: format(new Date(), 'yyyy-MM-dd'),
      location_name: location.location_name,
      address: location.address || '',
      start_time: location.start_time.slice(0, 5),
      end_time: location.end_time.slice(0, 5),
      notes: location.notes || '',
    });
    setEditingLocation(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    const locationData = {
      ...formData,
      business_id: business.id,
      latitude: null,
      longitude: null,
    };

    if (editingLocation) {
      updateLocation.mutate({ id: editingLocation, ...locationData });
    } else {
      createLocation.mutate(locationData);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteLocation.mutate(id);
  };

  const isLoading = featuresLoading || locationsLoading;

  // Food-truck tools (current location, schedule editor) are food-truck only.
  // `business` may still be loading; only treat as "not a truck" once loaded.
  const isTruck = isFoodTruckCategory(business?.category);

  if (business && !isTruck) {
    return (
      <>
        <Header title="Food Truck" />
        <PageContainer className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>

          <div className="card-elevated p-6 text-center space-y-2">
            <Truck className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <h2 className="font-semibold">Food Truck Mode is for food trucks</h2>
            <p className="text-sm text-muted-foreground">
              These tools — daily locations and schedule — are only available to
              businesses listed as a food truck.
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Food Truck" />

      <PageContainer className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        {/* Enable Food Truck Toggle */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-medium">Food Truck Mode</h3>
                <p className="text-xs text-muted-foreground">
                  Post daily locations for customers
                </p>
              </div>
            </div>
            <Switch 
              checked={features?.food_truck_enabled || false}
              onCheckedChange={handleToggleFoodTruck}
              disabled={updateFeatures.isPending}
            />
          </div>
        </div>

        {features?.food_truck_enabled && (
          <>
            {/* Create Location Button */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Today's Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingLocation ? 'Edit Location' : "Post Today's Location"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="location_date">Date *</Label>
                    <Input
                      id="location_date"
                      type="date"
                      value={formData.location_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_date: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Location Name */}
                  <div className="space-y-2">
                    <Label htmlFor="location_name">Location Name *</Label>
                    <Input
                      id="location_name"
                      value={formData.location_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                      placeholder="e.g. Toledo Zoo Parking Lot"
                      required
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="2700 Broadway, Toledo, OH"
                    />
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (menu, specials, etc.)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Today's specials, sold out items, etc."
                      rows={2}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={createLocation.isPending || updateLocation.isPending}>
                    {editingLocation ? 'Update Location' : 'Post Location'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* Location List */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Upcoming Locations
              </h3>

              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="card-elevated p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : locations && locations.length > 0 ? (
                locations.map(location => (
                  <div key={location.id} className="card-elevated p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">{format(parseISO(location.location_date), 'EEE, MMM d')}</h4>
                          {location.status === 'cancelled' && (
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                              Cancelled
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{location.location_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {location.start_time.slice(0, 5)} – {location.end_time.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDuplicate(location)}
                          title="Duplicate for today"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenEdit(location)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete location?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove this location post.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(location.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No upcoming locations</p>
                  <p className="text-sm">Let customers know where you'll be</p>
                </div>
              )}
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
