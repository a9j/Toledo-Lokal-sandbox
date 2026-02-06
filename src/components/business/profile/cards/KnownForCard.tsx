import { Sparkles, Star, Coffee, Utensils, ShoppingBag, Heart } from 'lucide-react';
import { FlipCard } from '../FlipCard';

interface KnownForCardProps {
  businessName: string;
  category?: string | null;
  isNonprofit?: boolean;
  // In v1, we'll use placeholder highlights based on category
  // Later this can come from a database field
  highlights?: string[];
}

// Generate contextual highlights based on business type
function getDefaultHighlights(category?: string | null, isNonprofit?: boolean): string[] {
  if (isNonprofit) {
    return [
      "Community-driven impact",
      "Local volunteer programs",
      "Transparent giving"
    ];
  }

  const categoryLower = category?.toLowerCase() || '';
  
  if (categoryLower.includes('restaurant') || categoryLower.includes('food')) {
    return [
      "Fresh, locally-sourced ingredients",
      "Signature dishes made daily",
      "Warm, welcoming atmosphere"
    ];
  }
  
  if (categoryLower.includes('coffee') || categoryLower.includes('cafe')) {
    return [
      "Small-batch roasted beans",
      "Cozy neighborhood vibes",
      "Friendly, knowledgeable baristas"
    ];
  }
  
  if (categoryLower.includes('retail') || categoryLower.includes('shop')) {
    return [
      "Curated local products",
      "Unique finds you won't see elsewhere",
      "Personalized service"
    ];
  }

  return [
    "Locally owned & operated",
    "Part of the Toledo community",
    "Authentic local experience"
  ];
}

export function KnownForCard({ businessName, category, isNonprofit, highlights }: KnownForCardProps) {
  const displayHighlights = highlights?.length 
    ? highlights 
    : getDefaultHighlights(category, isNonprofit);

  const icons = [Sparkles, Star, Heart, Coffee, Utensils, ShoppingBag];

  return (
    <FlipCard title="Known For">
      <div className="flex flex-col h-full justify-center">
        <div className="space-y-4">
          {displayHighlights.map((highlight, index) => {
            const Icon = icons[index % icons.length];
            return (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium text-foreground">
                    {highlight}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground text-center mt-8">
          What makes {businessName} special
        </p>
      </div>
    </FlipCard>
  );
}
