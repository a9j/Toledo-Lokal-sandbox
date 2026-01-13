import { Clock, MapPin, Calendar, Sparkles, Gift, Users } from 'lucide-react';

interface TodayStatusCardProps {
  status: {
    type: 'open' | 'food_truck' | 'event' | 'deal' | 'special' | 'volunteer' | 'appointment';
    message: string;
    subMessage?: string;
  } | null;
}

export function TodayStatusCard({ status }: TodayStatusCardProps) {
  if (!status) return null;

  const getIcon = () => {
    switch (status.type) {
      case 'open':
      case 'appointment':
        return Clock;
      case 'food_truck':
        return MapPin;
      case 'event':
        return Calendar;
      case 'deal':
      case 'special':
        return Gift;
      case 'volunteer':
        return Users;
      default:
        return Clock;
    }
  };

  const Icon = getIcon();

  // Determine background styling based on type
  const getBgStyle = () => {
    switch (status.type) {
      case 'food_truck':
        return 'bg-blue-50 border-blue-100';
      case 'volunteer':
        return 'bg-purple-50 border-purple-100';
      case 'deal':
      case 'special':
        return 'bg-amber-50 border-amber-100';
      default:
        return 'bg-emerald-50 border-emerald-100';
    }
  };

  const getIconStyle = () => {
    switch (status.type) {
      case 'food_truck':
        return 'bg-blue-100 text-blue-600';
      case 'volunteer':
        return 'bg-purple-100 text-purple-600';
      case 'deal':
      case 'special':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-emerald-100 text-emerald-600';
    }
  };

  const getTextStyle = () => {
    switch (status.type) {
      case 'food_truck':
        return 'text-blue-900';
      case 'volunteer':
        return 'text-purple-900';
      case 'deal':
      case 'special':
        return 'text-amber-900';
      default:
        return 'text-emerald-900';
    }
  };

  const getDotStyle = () => {
    switch (status.type) {
      case 'food_truck':
        return 'bg-blue-500';
      case 'volunteer':
        return 'bg-purple-500';
      case 'deal':
      case 'special':
        return 'bg-amber-500';
      default:
        return 'bg-emerald-500';
    }
  };

  return (
    <div className={`rounded-2xl p-4 border ${getBgStyle()}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getIconStyle()}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${getTextStyle()}`}>
            {status.message}
          </p>
          {status.subMessage && (
            <p className={`text-xs mt-0.5 opacity-80 ${getTextStyle()}`}>
              {status.subMessage}
            </p>
          )}
        </div>
        <div className={`w-2 h-2 rounded-full animate-pulse flex-shrink-0 ${getDotStyle()}`} />
      </div>
    </div>
  );
}
