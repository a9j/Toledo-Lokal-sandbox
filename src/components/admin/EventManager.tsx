import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { SecureImage } from '@/components/ui/secure-image';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CalendarDays,
  Clock,
  MapPin,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventManagerProps {
  businessId: string;
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  start_date_time: string;
  end_date_time: string | null;
  location_text: string | null;
  image_url: string | null;
  ticket_url: string | null;
  status: string;
  featured: boolean | null;
  created_at: string;
}

interface EventFormState {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  locationText: string;
  ticketUrl: string;
  imageUrl: string | null;
}

const EMPTY_FORM: EventFormState = {
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  locationText: '',
  ticketUrl: '',
  imageUrl: null,
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  approved: { label: 'Active', className: 'bg-emerald-100 text-emerald-800' },
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800' },
};

function useBusinessEvents(businessId: string) {
  return useQuery({
    queryKey: ['admin-business-events', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('business_id', businessId)
        .order('start_date_time', { ascending: false });
      if (error) throw error;
      return (data || []) as EventRow[];
    },
    enabled: !!businessId,
  });
}

export function EventManager({ businessId }: EventManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useBusinessEvents(businessId);

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);

  const update = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const openComposer = () => {
    resetForm();
    setComposerOpen(true);
  };

  const openEditor = (event: EventRow) => {
    const start = new Date(event.start_date_time);
    const end = event.end_date_time ? new Date(event.end_date_time) : null;
    setForm({
      title: event.title,
      description: event.description || '',
      date: start.toISOString().split('T')[0] ?? '',
      startTime: start.toTimeString().slice(0, 5),
      endTime: end ? end.toTimeString().slice(0, 5) : '',
      locationText: event.location_text || '',
      ticketUrl: event.ticket_url || '',
      imageUrl: event.image_url,
    });
    setEditingId(event.id);
    setComposerOpen(true);
  };

  const buildDateTime = (date: string, time: string) =>
    time ? `${date}T${time}:00` : `${date}T00:00:00`;

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('events').insert({
        business_id: businessId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date_time: buildDateTime(form.date, form.startTime),
        end_date_time: form.endTime ? buildDateTime(form.date, form.endTime) : null,
        location_text: form.locationText.trim() || null,
        ticket_url: form.ticketUrl.trim() || null,
        image_url: form.imageUrl,
        status: 'approved',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-events', businessId] });
      toast({ title: 'Event created' });
      setComposerOpen(false);
      resetForm();
    },
    onError: (e: Error) => {
      toast({ variant: 'destructive', title: 'Could not create event', description: e.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('events')
        .update(data)
        .eq('id', id)
        .eq('business_id', businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business-events', businessId] });
    },
  });

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return;
    if (editingId) {
      updateMutation.mutate(
        {
          id: editingId,
          data: {
            title: form.title.trim(),
            description: form.description.trim() || null,
            start_date_time: buildDateTime(form.date, form.startTime),
            end_date_time: form.endTime ? buildDateTime(form.date, form.endTime) : null,
            location_text: form.locationText.trim() || null,
            ticket_url: form.ticketUrl.trim() || null,
            image_url: form.imageUrl,
          },
        },
        {
          onSuccess: () => {
            toast({ title: 'Event updated' });
            setComposerOpen(false);
            resetForm();
          },
          onError: (e: Error) => {
            toast({ variant: 'destructive', title: 'Could not update', description: e.message });
          },
        }
      );
    } else {
      createMutation.mutate();
    }
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'approved' ? 'draft' : 'approved';
    updateMutation.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: () => toast({ title: newStatus === 'approved' ? 'Event published' : 'Event hidden' }),
        onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
      }
    );
  };

  const cancelEvent = (id: string) => {
    updateMutation.mutate(
      { id, data: { status: 'cancelled' } },
      {
        onSuccess: () => toast({ title: 'Event cancelled' }),
        onError: (e: Error) => toast({ variant: 'destructive', title: 'Failed', description: e.message }),
      }
    );
  };

  const canSubmit = form.title.trim().length > 0 && !!form.date;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const now = new Date();
  const filtered = events?.filter((e) => {
    if (filter === 'all') return e.status !== 'cancelled';
    if (filter === 'upcoming') return e.status === 'approved' && new Date(e.start_date_time) >= now;
    if (filter === 'past') return new Date(e.start_date_time) < now && e.status !== 'cancelled';
    if (filter === 'cancelled') return e.status === 'cancelled';
    return e.status === filter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Events</h2>
          <p className="text-sm text-muted-foreground">
            Manage events, classes, workshops, and community gatherings.
          </p>
        </div>
        <Button onClick={openComposer} className="gap-1.5">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      <div className="flex gap-2">
        {['all', 'upcoming', 'past', 'cancelled'].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            className="rounded-full text-xs capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {!filtered?.length ? (
        <div className="card-elevated p-8 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {filter === 'all'
              ? 'No events yet. Create your first event to get started.'
              : `No ${filter} events.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((event) => {
            const dt = new Date(event.start_date_time);
            const isPast = dt < now;
            const statusInfo = STATUS_LABELS[event.status] || STATUS_LABELS.approved || { label: event.status, className: '' };

            return (
              <div
                key={event.id}
                className={cn(
                  'card-elevated p-4 space-y-3',
                  isPast && event.status !== 'cancelled' && 'opacity-70'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
                    <span className="text-[10px] font-semibold text-primary uppercase">
                      {dt.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-primary leading-none">
                      {dt.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        {event.end_date_time && (
                          <> &ndash; {new Date(event.end_date_time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</>
                        )}
                      </span>
                      {event.location_text && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {event.location_text}
                        </span>
                      )}
                      {event.ticket_url && (
                        <span className="inline-flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> Ticket link
                        </span>
                      )}
                    </div>
                  </div>
                  {event.image_url && (
                    <SecureImage
                      src={event.image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-[10px]', statusInfo.className)}>
                    {statusInfo.label}
                  </Badge>
                  {isPast && event.status === 'approved' && (
                    <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-600">Past</Badge>
                  )}
                </div>

                <div className="flex gap-1.5 pt-1 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => openEditor(event)}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => toggleStatus(event.id, event.status)}
                  >
                    {event.status === 'approved' ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Publish</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive ml-auto"
                    onClick={() => cancelEvent(event.id)}
                  >
                    <Trash2 className="h-3 w-3" /> Cancel
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={composerOpen} onOpenChange={(open) => { if (!open) { setComposerOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Trivia Night, Workshop, Live Music..."
                maxLength={120}
              />
            </div>
            <div>
              <Label htmlFor="event-desc">Description</Label>
              <Textarea
                id="event-desc"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="What's the event about?"
                rows={3}
                maxLength={1000}
                className="resize-none"
              />
            </div>
            <div>
              <Label>
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                Date
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => update('date', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
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
              <div>
                <Label>End time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                Location
              </Label>
              <Input
                value={form.locationText}
                onChange={(e) => update('locationText', e.target.value)}
                placeholder="e.g. 123 Main St, Toledo"
              />
            </div>
            <div>
              <Label>
                <ExternalLink className="mr-1 inline h-3.5 w-3.5" />
                Ticket / RSVP link (optional)
              </Label>
              <Input
                value={form.ticketUrl}
                onChange={(e) => update('ticketUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label>Image (optional)</Label>
              {form.imageUrl ? (
                <div className="relative inline-block">
                  <SecureImage src={form.imageUrl} alt="" className="w-32 h-20 rounded-lg object-cover border" />
                  <button
                    onClick={() => update('imageUrl', null)}
                    className="absolute -top-1 -right-1 rounded-full bg-destructive text-white w-5 h-5 text-xs flex items-center justify-center"
                  >
                    x
                  </button>
                </div>
              ) : (
                <ImageUpload folder="events" onUpload={(url) => update('imageUrl', url)} />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setComposerOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleSave} disabled={!canSubmit || isPending}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving...</>
                ) : editingId ? 'Update' : 'Create Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
