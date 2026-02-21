import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// Generate time options in 1-hour increments from 12 AM to 12 AM
const TIME_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const hours = i % 24;
  const value = `${hours.toString().padStart(2, '0')}:00`;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 || hours === 24 ? 12 : hours > 12 ? hours - 12 : hours;
  const label = `${displayHour}:00 ${period}`;
  // For the last entry (i=24), use "24:00" to represent end-of-day midnight
  if (i === 24) return { value: '24:00', label: '12:00 AM' };
  return { value, label };
});

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
                  <Select
                    value={hours[key].open}
                    onValueChange={(val) => updateDay(key, 'open', val)}
                  >
                    <SelectTrigger className="h-8 w-[110px] text-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50 max-h-60">
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground text-sm">–</span>
                  <Select
                    value={hours[key].close}
                    onValueChange={(val) => updateDay(key, 'close', val)}
                  >
                    <SelectTrigger className="h-8 w-[110px] text-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50 max-h-60">
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
