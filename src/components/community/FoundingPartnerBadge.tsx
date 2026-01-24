import { Award } from 'lucide-react';

interface FoundingPartnerBadgeProps {
  variant?: 'card' | 'profile';
}

export function FoundingPartnerBadge({ variant = 'card' }: FoundingPartnerBadgeProps) {
  if (variant === 'profile') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500 p-[1px]">
        <div className="relative bg-card rounded-2xl p-4">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/20 to-transparent animate-shimmer" />
          
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Founding Community Partner</h3>
              <p className="text-sm text-muted-foreground">
                One of the first nonprofits helping shape ToledoLokal
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-semibold shadow-lg">
      <Award className="h-3.5 w-3.5" />
      <span>Founding Community Partner</span>
    </div>
  );
}
