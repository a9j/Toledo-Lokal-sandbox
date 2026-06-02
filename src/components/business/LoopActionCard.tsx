import { Link } from 'react-router-dom';
import { Infinity as InfinityIcon, QrCode, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoopActionCardProps {
  businessId: string;
  businessName: string;
  isInLoop: boolean;
  pointsAvailable?: number;
  rewardPreview?: string | null;
  actionType?: 'scan' | 'checkin';
}

export function LoopActionCard({ 
  businessId, 
  businessName, 
  isInLoop, 
  pointsAvailable = 0,
  rewardPreview,
  actionType = 'scan'
}: LoopActionCardProps) {
  if (!isInLoop) return null;

  const actionLabel = actionType === 'checkin' ? 'Check in to volunteer' : 'Scan in store';

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      {/* Points Available - prominent display matching examples */}
      {pointsAvailable > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <InfinityIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Earn</p>
            <p className="text-lg font-semibold text-foreground">
              {pointsAvailable} Loop points
            </p>
          </div>
        </div>
      )}

      {/* Scan/Check-in CTA */}
      <Link to="/scan">
        <Button className="w-full gap-2 mb-3" size="lg">
          <QrCode className="h-4 w-4" />
          {actionLabel}
        </Button>
      </Link>

      {/* Reward Preview - subtle, at bottom */}
      {rewardPreview && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
          <Gift className="h-4 w-4 flex-shrink-0" />
          <span>Reward preview: {rewardPreview}</span>
        </div>
      )}
    </div>
  );
}
