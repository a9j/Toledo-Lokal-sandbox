import { Link } from 'react-router-dom';
import { Infinity, QrCode, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoopActionCardProps {
  businessId: string;
  businessName: string;
  isInLoop: boolean;
  pointsAvailable?: number;
  rewardPreview?: string | null;
}

export function LoopActionCard({ 
  businessId, 
  businessName, 
  isInLoop, 
  pointsAvailable = 0,
  rewardPreview 
}: LoopActionCardProps) {
  if (!isInLoop) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Infinity className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">Loop Points</h3>
          <p className="text-sm text-muted-foreground">
            Earn points when you visit {businessName}
          </p>
        </div>
      </div>

      {/* Points Available */}
      {pointsAvailable > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/5">
          <span className="text-2xl font-bold text-primary">{pointsAvailable}</span>
          <span className="text-sm text-muted-foreground">points available</span>
        </div>
      )}

      {/* Reward Preview */}
      {rewardPreview && (
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Gift className="h-4 w-4" />
          <span>{rewardPreview}</span>
        </div>
      )}

      {/* Scan CTA */}
      <Link to="/scan">
        <Button className="w-full gap-2" size="lg">
          <QrCode className="h-4 w-4" />
          Scan in store
        </Button>
      </Link>
    </div>
  );
}
