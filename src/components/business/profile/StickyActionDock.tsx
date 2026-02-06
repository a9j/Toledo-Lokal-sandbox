import { Bookmark, Navigation, Heart, Share2, ExternalLink, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedItems } from '@/hooks/useSavedItems';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface StickyActionDockProps {
  businessId: string;
  businessName: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  isNonprofit?: boolean;
  className?: string;
}

export function StickyActionDock({ 
  businessId, 
  businessName,
  address,
  phone,
  website,
  isNonprofit,
  className
}: StickyActionDockProps) {
  const { user } = useAuth();
  const { savedItems, toggleSave } = useSavedItems();
  
  const isSaved = savedItems?.some(item => item.item_id === businessId);

  const handleSave = () => {
    if (!user) {
      toast.error('Sign in to save businesses');
      return;
    }
    toggleSave(businessId, 'business');
  };

  const handleVisit = () => {
    if (address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(mapsUrl, '_blank');
    } else if (website) {
      window.open(website.startsWith('http') ? website : `https://${website}`, '_blank');
    } else {
      toast.info('No address available');
    }
  };

  const handleSupport = () => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else if (website) {
      window.open(website.startsWith('http') ? website : `https://${website}`, '_blank');
    } else {
      toast.info('Contact info not available');
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out ${businessName} on ToledoLokal`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: businessName,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    }
  };

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50 safe-area-bottom", className)}>
      {/* Gradient fade */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Action bar */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 px-4 py-3 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {/* Save */}
          <Button
            variant={isSaved ? "default" : "outline"}
            size="sm"
            onClick={handleSave}
            className="flex-1 gap-2 rounded-full"
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>

          {/* Visit */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleVisit}
            className="flex-1 gap-2 rounded-full"
          >
            <Navigation className="h-4 w-4" />
            Visit
          </Button>

          {/* Support/Contact */}
          <Button
            variant="default"
            size="sm"
            onClick={handleSupport}
            className="flex-1 gap-2 rounded-full"
          >
            {isNonprofit ? (
              <>
                <Heart className="h-4 w-4" />
                Support
              </>
            ) : phone ? (
              <>
                <Phone className="h-4 w-4" />
                Call
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Visit Site
              </>
            )}
          </Button>

          {/* Share */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="flex-shrink-0 rounded-full"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
