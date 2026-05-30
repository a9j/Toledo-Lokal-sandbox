import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTruckStops } from '@/hooks/useTruckStops';
import { statusLabel, TruckStopStatus } from '@/lib/truck-stops';

const STATUSES: TruckStopStatus[] = ['open', 'sold_out', 'private', 'closed'];

// datetime-local <-> ISO helpers. The input gives wall-clock time; we store the
// absolute instant.
const toLocalInput = (iso: string) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
const fromLocalInput = (local: string) => new Date(local).toISOString();

const emptyDraft = () => ({
  location_name: '',
  starts_at: '',
  ends_at: '',
  status: 'open' as TruckStopStatus,
});

export function TruckStopsManager({ businessId }: { businessId: string }) {
  const { data: stops, isLoading, addStop, deleteStop } = useTruckStops(businessId);
  const [draft, setDraft] = useState(emptyDraft());

  const canAdd =
    draft.location_name.trim() && draft.starts_at && draft.ends_at &&
    new Date(draft.ends_at) > new Date(draft.starts_at);

  const handleAdd = () => {
    if (!canAdd) {
      toast.error('Add a location and a start/end time (end must be after start).');
      return;
    }
    addStop.mutate(
      {
        location_name: draft.location_name.trim(),
        starts_at: fromLocalInput(draft.starts_at),
        ends_at: fromLocalInput(draft.ends_at),
        status: draft.status,
      },
      {
        onSuccess: () => {
          toast.success('Stop added.');
          setDraft(emptyDraft());
        },
        onError: () => toast.error('Could not add the stop.'),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Truck schedule</h3>
        <p className="text-xs text-muted-foreground">
          Add where you'll be. Residents see “Now at” and “Next stop” on your profile.
        </p>
      </div>

      {/* Existing stops */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading stops…
        </div>
      ) : stops && stops.length > 0 ? (
        <ul className="space-y-2">
          {stops.map((stop) => (
            <li
              key={stop.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{stop.location_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(stop.starts_at), 'EEE, MMM d · h:mm a')}–
                  {format(new Date(stop.ends_at), 'h:mm a')}
                  {stop.status !== 'open' && ` · ${statusLabel(stop.status)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  deleteStop.mutate(stop.id, { onError: () => toast.error('Could not delete.') })
                }
                aria-label="Delete stop"
                className="flex-shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No stops yet — add your first below.</p>
      )}

      {/* New stop form */}
      <div className="space-y-3 rounded-xl border border-dashed border-border p-3">
        <div className="space-y-1.5">
          <Label htmlFor="stop-location">Location</Label>
          <Input
            id="stop-location"
            value={draft.location_name}
            onChange={(e) => setDraft((d) => ({ ...d, location_name: e.target.value }))}
            placeholder="e.g. Promenade Park, Monroe St"
            maxLength={200}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="stop-start">Starts</Label>
            <Input
              id="stop-start"
              type="datetime-local"
              value={draft.starts_at}
              onChange={(e) => setDraft((d) => ({ ...d, starts_at: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stop-end">Ends</Label>
            <Input
              id="stop-end"
              type="datetime-local"
              value={draft.ends_at}
              onChange={(e) => setDraft((d) => ({ ...d, ends_at: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={draft.status}
            onValueChange={(v) => setDraft((d) => ({ ...d, status: v as TruckStopStatus }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={handleAdd} disabled={addStop.isPending} className="w-full">
          {addStop.isPending ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1.5 h-4 w-4" />
          )}
          Add stop
        </Button>
      </div>
    </div>
  );
}
