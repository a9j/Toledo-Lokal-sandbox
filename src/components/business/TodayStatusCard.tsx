import { Clock, MapPin, Calendar, Sparkles } from 'lucide-react';

interface TodayStatusCardProps {
  status: {
    type: 'open' | 'food_truck' | 'event' | 'deal' | 'special';
    message: string;
    subMessage?: string;
  } | null;
}

export function TodayStatusCard({ status }: TodayStatusCardProps) {
  if (!status) return null;

  const getIcon = () => {
    switch (status.type) {
      case 'open':
        return Clock;
      case 'food_truck':
        return MapPin;
      case 'event':
        return Calendar;
      case 'deal':
      case 'special':
        return Sparkles;
      default:
        return Clock;
    }
  };

  const Icon = getIcon();

  return (
    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-900">
            {status.message}
          </p>
          {status.subMessage && (
            <p className="text-xs text-emerald-700/80 mt-0.5">
              {status.subMessage}
            </p>
          )}
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}
