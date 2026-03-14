import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HoursEditor, DEFAULT_BUSINESS_HOURS, parseBusinessHours } from '@/components/business/HoursEditor';
import { BusinessLocation, NEIGHBORHOOD_OPTIONS } from '@/hooks/useBusinessLocations';
import { X, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface LocationFormProps {
  location: BusinessLocation;
  index: number;
  isPrimary: boolean;
  canRemove: boolean;
  showLabel: boolean;
  onChange: (updated: BusinessLocation) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
}

export function LocationForm({
  location,
  index,
  isPrimary,
  canRemove,
  showLabel,
  onChange,
  onRemove,
  onSetPrimary,
}: LocationFormProps) {
  const [showHours, setShowHours] = useState(false);

  const update = (field: keyof BusinessLocation, value: any) => {
    onChange({ ...location, [field]: value });
  };

  return (
    <div className="rounded-xl border border-border p-4 space-y-4 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Location {index + 1}
          </span>
          {isPrimary && (
            <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] gap-1">
              <Star className="h-3 w-3" /> Primary
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isPrimary && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7"
              onClick={onSetPrimary}
            >
              Set as primary
            </Button>
          )}
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Label / Nickname */}
      {showLabel && (
        <div className="space-y-1">
          <Label className="text-sm">Location nickname</Label>
          <Input
            value={location.label}
            onChange={(e) => update('label', e.target.value)}
            placeholder="e.g. Downtown, Perrysburg, West Side"
            className="h-9"
          />
        </div>
      )}

      {/* Address fields */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-sm">Street Address *</Label>
          <Input
            value={location.street_address}
            onChange={(e) => update('street_address', e.target.value)}
            placeholder="123 Main St"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-sm">City</Label>
            <Input
              value={location.city}
              onChange={(e) => update('city', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">State</Label>
            <Input
              value={location.state}
              onChange={(e) => update('state', e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">ZIP *</Label>
            <Input
              value={location.zip_code}
              onChange={(e) => update('zip_code', e.target.value)}
              placeholder="43604"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Neighborhood</Label>
          <Select
            value={location.neighborhood}
            onValueChange={(v) => update('neighborhood', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select neighborhood" />
            </SelectTrigger>
            <SelectContent>
              {NEIGHBORHOOD_OPTIONS.map((n) => (
                <SelectItem key={n} value={n}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-sm">Phone (this location)</Label>
          <Input
            value={location.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="(419) 555-0123"
          />
        </div>
      </div>

      {/* Hours (collapsible) */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground gap-1 -ml-2"
          onClick={() => setShowHours(!showHours)}
        >
          {showHours ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showHours ? 'Hide hours' : 'Set hours for this location'}
        </Button>
        {showHours && (
          <div className="mt-2">
            <HoursEditor
              hours={location.hours ? parseBusinessHours(location.hours) : DEFAULT_BUSINESS_HOURS}
              onChange={(h) => update('hours', h)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
