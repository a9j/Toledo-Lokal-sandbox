import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  useBusinessFoodLocations,
  useMyLiveLocation,
  useCreateFoodLocation,
  useUpdateFoodLocation,
  useDeleteFoodLocation,
  useSetLiveLocation,
  useStopLiveTracking,
  useFoodTruckSchedules,
  useUpsertScheduleEntry,
  useDeleteScheduleEntry,
} from '@/hooks/useFoodTruckLocations';
import { useBusinessFeatures, useUpdateBusinessFeatures } from '@/hooks/useBusinessFeatures';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
import { format, addHours, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Plus,
  Truck,
  Trash2,
  Edit,
  MapPin,
  Clock,
  Copy,
  Navigation,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Days of week ──────────────────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Location form ─────────────────────────────────────────────────────────────

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

// ── "I'm Here" sheet ──────────────────────────────────────────────────────────

function GoLiveSheet({
  open,
  onClose,
  businessId,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
}) {
  const [locationName, setLocationName] = useState('');
  const [hereUntilPreset, setHereUntilPreset] = useState<number | 'custom'>(2);
  const [customTime, setCustomTime] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const setLive = useSetLiveLocation();

  const getHereUntil = (): string => {
    if (hereUntilPreset === 'custom') {
      if (!customTime) return addHours(new Date(), 2).toISOString();
      const [h, m] = customTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    }
    return addHours(new Date(), hereUntilPreset).toISOString();
  };

  const handleOpen = () => {
    setGeoError(null);
    setCoords(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError('Could not get your location. Please enable location access.')
    );
  };

  // Trigger geolocation when sheet opens
  const [hasTriggeredGeo, setHasTriggeredGeo] = useState(false);
  if (open && !hasTriggeredGeo) {
    setHasTriggeredGeo(true);
    handleOpen();
  }
  if (!open && hasTriggeredGeo) setHasTriggeredGeo(false);

  const handleGoLive = async () => {
    if (!locationName.trim()) { toast.error('Please enter a location name.'); return; }
    if (!coords) { toast.error('Waiting for GPS location...'); return; }
    await setLive.mutateAsync({
      businessId,
      locationName: locationName.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
      hereUntil: getHereUntil(),
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Go Live Now</SheetTitle>
          <SheetDescription>Drop your pin on the live map for customers to find you</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pb-6">
          {/* GPS status */}
          {geoError ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{geoError}</p>
            </div>
          ) : coords ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-lokal-forest/10">
              <CheckCircle2 className="h-4 w-4 text-lokal-forest flex-shrink-0" />
              <p className="text-sm text-lokal-forest font-medium">GPS location acquired</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted">
              <Navigation className="h-4 w-4 text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground">Getting your location...</p>
            </div>
          )}

          {/* Location name */}
          <div className="space-y-2">
            <Label>Where are you? *</Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Toledo Zoo Parking Lot, 5th & Adams"
              autoFocus
            />
          </div>

          {/* Here until */}
          <div className="space-y-2">
            <Label>Here until</Label>
            <div className="grid grid-cols-4 gap-2">
              {([1, 2, 3] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => setHereUntilPreset(h)}
                  className={cn(
                    'py-2 rounded-xl text-sm font-medium border-2 transition-all',
                    hereUntilPreset === h
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-transparent bg-muted text-muted-foreground'
                  )}
                >
                  {h} hr
                </button>
              ))}
              <button
                onClick={() => setHereUntilPreset('custom')}
                className={cn(
                  'py-2 rounded-xl text-sm font-medium border-2 transition-all',
                  hereUntilPreset === 'custom'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-transparent bg-muted text-muted-foreground'
                )}
              >
                Custom
              </button>
            </div>
            {hereUntilPreset === 'custom' && (
              <Input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="mt-2"
              />
            )}
            {hereUntilPreset !== 'custom' && (
              <p className="text-xs text-muted-foreground">
                Until {format(addHours(new Date(), hereUntilPreset as number), 'h:mm a')}
              </p>
            )}
          </div>

          <Button
            className="w-full h-14 rounded-xl text-base font-semibold bg-lokal-amber hover:bg-lokal-amber/90 text-white"
            onClick={handleGoLive}
            disabled={setLive.isPending || !coords}
          >
            {setLive.isPending ? 'Going live...' : "🚚 I'm Live!"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Schedule entry form ───────────────────────────────────────────────────────

function ScheduleEntryDialog({
  businessId,
  open,
  onClose,
}: {
  businessId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [locationName, setLocationName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('14:00');

  const upsert = useUpsertScheduleEntry();

  const handleSave = async () => {
    if (!locationName.trim()) { toast.error('Location name is required.'); return; }
    await upsert.mutateAsync({
      business_id: businessId,
      day_of_week: parseInt(dayOfWeek),
      location_name: locationName.trim(),
      start_time: startTime,
      end_time: endTime,
      is_active: true,
    });
    onClose();
    setLocationName('');
    setDayOfWeek('1');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Recurring Spot</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, i) => (
                  <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location Name *</Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Toledo Farmers Market"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 rounded-xl" onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardFoodTruck() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const { data: business } = useQuery({
    queryKey: ['user-business', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: features, isLoading: featuresLoading } = useBusinessFeatures(business?.id);
  const { data: locations, isLoading: locationsLoading } = useBusinessFoodLocations(business?.id);
  const { data: liveLocation } = useMyLiveLocation(business?.id);
  const { data: schedules, isLoading: schedulesLoading } = useFoodTruckSchedules(business?.id);

  const updateFeatures = useUpdateBusinessFeatures();
  const createLocation = useCreateFoodLocation();
  const updateLocation = useUpdateFoodLocation();
  const deleteLocation = useDeleteFoodLocation();
  const stopTracking = useStopLiveTracking();
  const deleteSchedule = useDeleteScheduleEntry();

  if (!user) { navigate('/auth'); return null; }

  const handleToggleFoodTruck = () => {
    if (!business) return;
    updateFeatures.mutate({ businessId: business.id, food_truck_enabled: !features?.food_truck_enabled });
  };

  const handleOpenCreate = () => { setFormData(defaultFormData); setEditingLocation(null); setDialogOpen(true); };

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
    const locationData = { ...formData, business_id: business.id, latitude: null, longitude: null, here_until: null, tracking_enabled: false };
    if (editingLocation) {
      updateLocation.mutate({ id: editingLocation, ...locationData });
    } else {
      createLocation.mutate(locationData);
    }
    setDialogOpen(false);
  };

  const isLoading = featuresLoading || locationsLoading;

  return (
    <>
      <Header title="Food Truck" />

      <PageContainer className="space-y-6">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>

        {/* Enable Food Truck Toggle */}
        <div className="card-elevated p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-lokal-amber/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-lokal-amber" />
              </div>
              <div>
                <h3 className="font-medium">Food Truck Mode</h3>
                <p className="text-xs text-muted-foreground">Post daily locations for customers</p>
              </div>
            </div>
            <Switch
              checked={features?.food_truck_enabled || false}
              onCheckedChange={handleToggleFoodTruck}
              disabled={updateFeatures.isPending}
            />
          </div>
        </div>

        {features?.food_truck_enabled && business && (
          <>
            {/* ── I'm Here Now card ───────────────────────────────────────── */}
            {liveLocation ? (
              /* Active state */
              <div className="card-elevated p-5 border border-lokal-forest/30 bg-lokal-forest/5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-lokal-forest/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-lokal-forest" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">You're Live! 🚚</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {liveLocation.location_name}
                    </p>
                    {liveLocation.here_until && (
                      <p className="text-xs text-lokal-amber font-medium mt-0.5">
                        ⏱ Here until {format(new Date(liveLocation.here_until), 'h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setGoLiveOpen(true)}
                  >
                    Update Location
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => stopTracking.mutate(business.id)}
                    disabled={stopTracking.isPending}
                  >
                    Stop Sharing
                  </Button>
                </div>
              </div>
            ) : (
              /* Idle state */
              <div className="card-elevated p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-lokal-amber/10 flex items-center justify-center flex-shrink-0">
                    <Navigation className="h-5 w-5 text-lokal-amber" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">I'm Here Now</h3>
                    <p className="text-xs text-muted-foreground">Drop your pin on the live map</p>
                  </div>
                </div>
                <Button
                  className="w-full h-14 rounded-xl text-base font-semibold bg-lokal-amber hover:bg-lokal-amber/90 text-white"
                  onClick={() => setGoLiveOpen(true)}
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Go Live Now
                </Button>
              </div>
            )}

            {/* ── Post Scheduled Location ─────────────────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Scheduled Location
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingLocation ? 'Edit Location' : 'Post Scheduled Location'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location_date">Date *</Label>
                    <Input
                      id="location_date"
                      type="date"
                      value={formData.location_date}
                      onChange={(e) => setFormData((p) => ({ ...p, location_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location_name">Location Name *</Label>
                    <Input
                      id="location_name"
                      value={formData.location_name}
                      onChange={(e) => setFormData((p) => ({ ...p, location_name: e.target.value }))}
                      placeholder="e.g. Toledo Zoo Parking Lot"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                      placeholder="2700 Broadway, Toledo, OH"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData((p) => ({ ...p, start_time: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData((p) => ({ ...p, end_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (menu, specials, etc.)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Today's specials, sold out items, etc."
                      rows={2}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full rounded-xl"
                    disabled={createLocation.isPending || updateLocation.isPending}
                  >
                    {editingLocation ? 'Update Location' : 'Post Location'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {/* ── Upcoming scheduled locations ────────────────────────────── */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
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
                locations.map((location) => (
                  <div key={location.id} className="card-elevated p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">
                            {format(parseISO(location.location_date), 'EEE, MMM d')}
                          </h4>
                          {location.status === 'cancelled' && (
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive text-xs">
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
                          <span>{location.start_time.slice(0, 5)} – {location.end_time.slice(0, 5)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicate(location)} title="Duplicate for today">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(location)}>
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
                              <AlertDialogDescription>This will remove this location post.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteLocation.mutate(location.id)}>
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

            {/* ── Weekly Schedule Editor ──────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    Weekly Schedule
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Recurring spots so regulars always know where to find you
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setScheduleDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Spot
                </Button>
              </div>

              {schedulesLoading ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : schedules && schedules.length > 0 ? (
                <div className="space-y-2">
                  {schedules.map((entry) => (
                    <div key={entry.id} className="card-elevated flex items-center gap-3 p-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {DAYS[entry.day_of_week]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.location_name} · {entry.start_time.slice(0, 5)} – {entry.end_time.slice(0, 5)}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove from schedule?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This recurring spot will be removed from your public schedule.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSchedule.mutate({ id: entry.id, businessId: business.id })}
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-6 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setScheduleDialogOpen(true)}
                >
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No recurring schedule yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tap to add your first spot</p>
                </div>
              )}
            </div>
          </>
        )}
      </PageContainer>

      {/* Go Live sheet */}
      {business && (
        <GoLiveSheet
          open={goLiveOpen}
          onClose={() => setGoLiveOpen(false)}
          businessId={business.id}
        />
      )}

      {/* Schedule entry dialog */}
      {business && (
        <ScheduleEntryDialog
          businessId={business.id}
          open={scheduleDialogOpen}
          onClose={() => setScheduleDialogOpen(false)}
        />
      )}
    </>
  );
}
