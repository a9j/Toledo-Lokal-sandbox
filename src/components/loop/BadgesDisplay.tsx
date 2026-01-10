import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useLoop } from '@/contexts/LoopContext';

export function BadgesDisplay() {
  const { badges, isLoading } = useLoop();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5" />
            My Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-20 rounded-full flex-shrink-0" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="h-5 w-5" />
          My Badges ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full pb-4">
          <div className="flex gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.id} 
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                  style={{ 
                    backgroundColor: badge.badge_color || '#5C8A6E',
                    boxShadow: `0 4px 14px ${badge.badge_color || '#5C8A6E'}40`
                  }}
                >
                  <Award className="h-8 w-8 text-white" />
                </div>
                <span className="text-xs text-center font-medium max-w-[80px] line-clamp-2">
                  {badge.badge_name}
                </span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
