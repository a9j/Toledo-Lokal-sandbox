import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Calendar, CalendarDays, Clock, MapPin, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

function useBusinessForDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard-business-id', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('businesses')
        .select('id, name')
        .eq('owner_user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });
}

function useBusinessEvents(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-events', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('business_id', businessId)
        .order('start_date_time', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId,
  });
}

interface EventFormState {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  locationText: string;
}

const EMPTY_FORM: EventFormState = {
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  locationText: '',
};

export default function DashboardEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: business } = useBusinessForDashboard();
  const { data: events, isLoading } = useBusinessEvents(business?.id);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);

  const update = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error('No business');
      const startDateTime = form.startTime
        ? `${form.date}T${form.startTime}`
        : `${form.date}T00:00:00`;
      const endDateTime = form.endTime ? `${form.date}T${form.endTime}` : null;

      const { error } = await supabase.from('events').insert({
        business_id: business.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date_time: startDateTime,
        end_date_time: endDateTime,
        location_text: form.locationText.trim() || null,
        status: 'approved',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-events'] });
      toast({ title: 'Event created' });
      setOpen(false);
      setForm(EMPTY_FORM);
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Could not create event' });
    },
  });

  const canSubmit = form.title.trim().length > 0 && !!form.date;

  const upcoming = events?.filter(
    (e) => new Date(e.start_date_time) >= new Date()
  ) ?? [];
  const past = events?.filter(
    (e) => new Date(e.start_date_time) < new Date()
  ) ?? [];

  return (
    <>
      <Header title="My Events" />
      <PageContainer className="pb-32 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 rounded-full">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-background border-border">
              <DialogHeader>
                <DialogTitle>Add Event</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canSubmit) createEvent.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label>Event title</Label>
                  <Input
                    placeholder="Trivia Night"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="What's the event about?"
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => update('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      Start time
                    </Label>
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => update('startTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>End time</Label>
                    <Input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => update('endTime', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                    Location
                  </Label>
                  <Input
                    placeholder="e.g. 123 Main St, Toledo"
                    value={form.locationText}
                    onChange={(e) => update('locationText', e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!canSubmit || createEvent.isPending}
                  className="w-full"
                >
                  {createEvent.isPending ? 'Creating…' : 'Create Event'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : events?.length === 0 ? (
          <div className="card-elevated p-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium">No events yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first event to show it on your business profile.
            </p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Upcoming
                </h3>
                <div className="space-y-2">
                  {upcoming.map((evt) => (
                    <EventCard key={evt.id} event={evt} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Past
                </h3>
                <div className="space-y-2 opacity-60">
                  {past.map((evt) => (
                    <EventCard key={evt.id} event={evt} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </PageContainer>
    </>
  );
}

function EventCard({ event }: { event: any }) {
  const dt = new Date(event.start_date_time);
  return (
    <div className="card-elevated p-4 flex items-start gap-3">
      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
        <span className="text-[10px] font-semibold text-primary uppercase">
          {dt.toLocaleDateString(undefined, { month: 'short' })}
        </span>
        <span className="text-lg font-bold text-primary leading-none">
          {dt.getDate()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-foreground">{event.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </span>
          {event.location_text && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {event.location_text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
