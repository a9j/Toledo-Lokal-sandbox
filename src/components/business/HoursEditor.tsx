import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Clock } from 'lucide-react';

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
] as const;

const DEFAULT_HOURS: DayHours = { open: '09:00', close: '17:00', closed: false };

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { ...DEFAULT_HOURS },
  tuesday: { ...DEFAULT_HOURS },
  wednesday: { ...DEFAULT_HOURS },
  thursday: { ...DEFAULT_HOURS },
  friday: { ...DEFAULT_HOURS },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: '10:00', close: '16:00', closed: true },
};

interface HoursEditorProps {
  hours: BusinessHours;
  onChange: (hours: BusinessHours) => void;
}

export function HoursEditor({ hours, onChange }: HoursEditorProps) {
  const updateDay = (day: keyof BusinessHours, field: keyof DayHours, value: string | boolean) => {
    onChange({
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Label className="text-base font-semibold">Hours of Operation</Label>
      </div>
      
      <div className="space-y-2">
        {DAYS.map(({ key, label }) => (
          <div 
            key={key} 
            className={`flex items-center gap-2 p-2 rounded-lg ${hours[key].closed ? 'bg-muted/50' : 'bg-card'}`}
          >
            <span className="w-10 text-sm font-medium">{label}</span>
            
            <div className="flex items-center gap-1 flex-1">
              {hours[key].closed ? (
                <span className="text-sm text-muted-foreground italic">Closed</span>
              ) : (
                <>
                  <Input
                    type="time"
                    value={hours[key].open}
                    onChange={(e) => updateDay(key, 'open', e.target.value)}
                    className="h-8 w-[100px] text-sm"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input
                    type="time"
                    value={hours[key].close}
                    onChange={(e) => updateDay(key, 'close', e.target.value)}
                    className="h-8 w-[100px] text-sm"
                  />
                </>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Open</span>
              <Switch
                checked={!hours[key].closed}
                onCheckedChange={(checked) => updateDay(key, 'closed', !checked)}
                className="scale-75"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper to parse hours from DB JSON
export function parseBusinessHours(json: unknown): BusinessHours {
  if (!json || typeof json !== 'object') {
    return { ...DEFAULT_BUSINESS_HOURS };
  }
  
  const result = { ...DEFAULT_BUSINESS_HOURS };
  const data = json as Record<string, unknown>;
  
  for (const day of DAYS) {
    const dayData = data[day.key];
    if (dayData && typeof dayData === 'object') {
      const d = dayData as Record<string, unknown>;
      result[day.key] = {
        open: typeof d.open === 'string' ? d.open : DEFAULT_HOURS.open,
        close: typeof d.close === 'string' ? d.close : DEFAULT_HOURS.close,
        closed: typeof d.closed === 'boolean' ? d.closed : false,
      };
    }
  }
  
  return result;
}
