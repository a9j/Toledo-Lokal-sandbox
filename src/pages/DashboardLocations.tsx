import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { LocationForm } from '@/components/business/LocationForm';
import {
  useBusinessLocations,
  useSaveBusinessLocations,
  BusinessLocation,
  DEFAULT_LOCATION,
} from '@/hooks/useBusinessLocations';
import { LogoLoader } from '@/components/ui/logo-loader';
import { toast } from 'sonner';
import { ArrowLeft, Plus } from 'lucide-react';

export default function DashboardLocations() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: business } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: existingLocations, isLoading } = useBusinessLocations(business?.id);
  const saveMutation = useSaveBusinessLocations(business?.id);

  const [locations, setLocations] = useState<BusinessLocation[]>([]);

  useEffect(() => {
    if (existingLocations && existingLocations.length > 0) {
      setLocations(existingLocations);
    } else if (existingLocations && existingLocations.length === 0) {
      setLocations([{ ...DEFAULT_LOCATION, is_primary: true }]);
    }
  }, [existingLocations]);

  const addLocation = () => {
    if (locations.length >= 10) {
      toast.error('Maximum 10 locations allowed');
      return;
    }
    setLocations([...locations, { ...DEFAULT_LOCATION }]);
  };

  const updateLocation = (index: number, updated: BusinessLocation) => {
    const next = [...locations];
    next[index] = updated;
    setLocations(next);
  };

  const removeLocation = (index: number) => {
    if (locations[index].is_primary) return;
    setLocations(locations.filter((_, i) => i !== index));
  };

  const setPrimary = (index: number) => {
    setLocations(
      locations.map((loc, i) => ({
        ...loc,
        is_primary: i === index,
      }))
    );
  };

  const handleSave = async () => {
    const hasPrimary = locations.some((l) => l.is_primary);
    if (!hasPrimary && locations.length > 0) {
      locations[0].is_primary = true;
    }

    for (const loc of locations) {
      if (!loc.street_address.trim()) {
        toast.error('Each location needs a street address');
        return;
      }
    }

    await saveMutation.mutateAsync(locations);
    toast.success('Locations saved!');
  };

  if (!user || isLoading) {
    return (
      <>
        <Header title="Locations" />
        <PageContainer className="flex items-center justify-center min-h-[60vh]">
          <LogoLoader size="lg" text="Loading locations..." />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Locations" />
      <PageContainer className="space-y-4 pb-32">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-xl font-bold">Manage Locations</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, or remove your business locations.
          </p>
        </div>

        <div className="space-y-4">
          {locations.map((loc, i) => (
            <LocationForm
              key={i}
              location={loc}
              index={i}
              isPrimary={loc.is_primary}
              canRemove={!loc.is_primary && locations.length > 1}
              showLabel={locations.length > 1 || i > 0}
              onChange={(updated) => updateLocation(i, updated)}
              onRemove={() => removeLocation(i)}
              onSetPrimary={() => setPrimary(i)}
            />
          ))}
        </div>

        {locations.length < 10 && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={addLocation}
          >
            <Plus className="h-4 w-4" /> Add another location
          </Button>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom">
          <div className="max-w-lg mx-auto px-4 py-3">
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Locations'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
