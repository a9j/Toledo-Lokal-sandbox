import { Link } from 'react-router-dom';
import { useSavedItems } from '@/hooks/useSavedItems';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2, Bookmark, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SavedPlacesListProps {
  compact?: boolean;
  maxItems?: number;
}

export function SavedPlacesList({ compact = false, maxItems }: SavedPlacesListProps) {
  const { savedItemsWithDetails, isLoading, unsaveItem } = useSavedItems();

  const handleShare = async () => {
    const businesses = savedItemsWithDetails.filter(item => item.business);
    
    if (businesses.length === 0) {
      toast.error('No saved places to share');
      return;
    }

    const shareText = `My favorite Toledo spots:\n${businesses
      .map(item => `• ${item.business?.name}`)
      .join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Toledo Favorites',
          text: shareText,
        });
      } catch (e) {
        // User cancelled or share failed
        if ((e as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareText);
          toast.success('Copied to clipboard!');
        }
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success('Copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const displayItems = maxItems 
    ? savedItemsWithDetails.slice(0, maxItems) 
    : savedItemsWithDetails;

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No saved places yet</p>
        <p className="text-sm">Tap the bookmark icon on any business to save it</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && savedItemsWithDetails.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share List
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {displayItems.map(item => (
          <Card key={item.id} className="p-3">
            {item.business && (
              <Link to={`/business/${item.business.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.business.logo_url ? (
                      <img 
                        src={item.business.logo_url} 
                        alt={item.business.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.business.name}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.business.category?.name || 'Business'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            )}

            {item.event && (
              <Link to={`/events/${item.event.id}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.event.image_url ? (
                      <img 
                        src={item.event.image_url} 
                        alt={item.event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(item.event.start_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            )}

            {!compact && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-muted-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  unsaveItem.mutate(item.item_id);
                }}
              >
                Remove
              </Button>
            )}
          </Card>
        ))}
      </div>

      {compact && savedItemsWithDetails.length > (maxItems || 0) && (
        <Link to="/saved">
          <Button variant="outline" className="w-full">
            View All Saved ({savedItemsWithDetails.length})
          </Button>
        </Link>
      )}
    </div>
  );
}
