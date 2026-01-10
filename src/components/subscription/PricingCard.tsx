import { Check, Star, Crown, Building2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TierConfig, SubscriptionTier } from '@/lib/subscription-tiers';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  tierConfig: TierConfig;
  currentTier: SubscriptionTier;
  onSelect: (priceId: string) => void;
  isLoading: boolean;
}

const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
  free: <Building2 className="h-6 w-6" />,
  local_supporter: <Star className="h-6 w-6" />,
  featured_local: <Star className="h-6 w-6 fill-current" />,
  anchor_partner: <Crown className="h-6 w-6" />,
};

export function PricingCard({ tierConfig, currentTier, onSelect, isLoading }: PricingCardProps) {
  const isCurrentPlan = currentTier === tierConfig.id;
  const isPopular = tierConfig.id === 'featured_local';
  const isFree = tierConfig.id === 'free';
  const hasLoopFeatures = tierConfig.loopFeatures && tierConfig.loopFeatures.length > 0;

  return (
    <Card className={cn(
      "relative flex flex-col overflow-hidden",
      isCurrentPlan && "border-primary ring-2 ring-primary/20",
      isPopular && !isCurrentPlan && "border-primary/50"
    )}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary whitespace-nowrap z-10">
          Most Popular
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 whitespace-nowrap z-10">
          Current Plan
        </Badge>
      )}
      
      <CardHeader className="text-center pb-2 px-4">
        <div className="mx-auto mb-2 p-2 rounded-full bg-muted w-fit">
          {tierIcons[tierConfig.id]}
        </div>
        <CardTitle className="text-lg whitespace-nowrap">{tierConfig.name}</CardTitle>
        <CardDescription>
          <span className="text-2xl font-bold text-foreground">
            ${tierConfig.price}
          </span>
          {tierConfig.price > 0 && <span className="text-muted-foreground">/mo</span>}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4 px-4">
        {/* Business Features */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Business Features
          </p>
          <ul className="space-y-1.5">
            {tierConfig.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Loop Lokal Features */}
        {hasLoopFeatures && (
          <div className="pt-3 border-t">
            <div className="flex items-center gap-1 mb-2">
              <Coins className="h-3.5 w-3.5 text-primary flex-shrink-0" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                Loop Lokal
              </p>
            </div>
            <ul className="space-y-1.5">
              {tierConfig.loopFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4">
        {isFree ? (
          <Button 
            className="w-full" 
            variant="outline" 
            disabled
          >
            {isCurrentPlan ? 'Current Plan' : 'Free Forever'}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isCurrentPlan ? "outline" : "default"}
            disabled={isCurrentPlan || isLoading}
            onClick={() => tierConfig.priceId && onSelect(tierConfig.priceId)}
          >
            {isLoading ? 'Loading...' : isCurrentPlan ? 'Current Plan' : 'Upgrade'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
