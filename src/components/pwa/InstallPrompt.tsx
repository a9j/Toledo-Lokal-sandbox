import { useState, useEffect } from 'react';
import { Download, X, Share, Plus, Smartphone, Home, MoreVertical, EllipsisVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const FAVORITES_THRESHOLD = 2; // Show after 2-3 favorites
const STORAGE_KEY = 'pwa-prompt-dismissed';
const FAVORITES_COUNT_KEY = 'pwa-favorites-trigger-count';

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [hasMetThreshold, setHasMetThreshold] = useState(false);

  // Check localStorage for dismissal and threshold on mount
  useEffect(() => {
    const wasDismissed = localStorage.getItem(STORAGE_KEY);
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check if threshold was already met
    const savedCount = parseInt(localStorage.getItem(FAVORITES_COUNT_KEY) || '0', 10);
    if (savedCount >= FAVORITES_THRESHOLD) {
      setHasMetThreshold(true);
      // Show after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for favorite events to track count
  useEffect(() => {
    const handleFavorite = () => {
      if (dismissed || isInstalled) return;
      
      const currentCount = parseInt(localStorage.getItem(FAVORITES_COUNT_KEY) || '0', 10);
      const newCount = currentCount + 1;
      localStorage.setItem(FAVORITES_COUNT_KEY, newCount.toString());
      
      if (newCount >= FAVORITES_THRESHOLD && !hasMetThreshold) {
        setHasMetThreshold(true);
        // Show after a short delay
        setTimeout(() => setShowBanner(true), 1000);
      }
    };

    window.addEventListener('pwa-favorite-added', handleFavorite);
    return () => window.removeEventListener('pwa-favorite-added', handleFavorite);
  }, [dismissed, isInstalled, hasMetThreshold]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Don't show if already installed, dismissed, or banner not ready
  if (isInstalled || dismissed || !showBanner) return null;

  // Show iOS instructions modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
        <div className="w-full max-w-md bg-background rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Add to Home Screen</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowIOSInstructions(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Get quick access to your favorite spots:
          </p>
          
          <ol className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">1</div>
              <span>
                Tap the <EllipsisVertical className="inline h-4 w-4 mx-0.5" /> <strong>three dots</strong> menu (bottom or top of your browser)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">2</div>
              <span>
                Look for <Share className="inline h-4 w-4 mx-0.5" /> <strong>Share</strong> or <strong>"Add to Home Screen"</strong> and tap it
              </span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">3</div>
              <span>If you tapped Share, scroll down and tap <Plus className="inline h-4 w-4 mx-0.5" /> <strong>"Add to Home Screen"</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold flex-shrink-0">4</div>
              <span>Tap <strong>"Add"</strong> to confirm</span>
            </li>
          </ol>
          
          <Button
            className="w-full mt-6 rounded-full"
            onClick={() => {
              setShowIOSInstructions(false);
              handleDismiss();
            }}
          >
            Got it
          </Button>
        </div>
      </div>
    );
  }

  // Show install banner (triggered after favorites threshold)
  if (canInstall || isIOS) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 animate-in slide-in-from-bottom duration-500">
        <div className="max-w-md mx-auto bg-card border border-border rounded-2xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Home className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Make Toledo Lokal an app</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Add Toledo Lokal to your home screen for quick access to your favorite spots.
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="rounded-full font-medium"
                  onClick={() => {
                    if (isIOS) {
                      setShowIOSInstructions(true);
                    } else {
                      promptInstall();
                      handleDismiss();
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Add to Home Screen
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-muted-foreground"
                  onClick={handleDismiss}
                >
                  Not now
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground -mt-1 -mr-1"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Helper function to trigger the PWA prompt from anywhere in the app
export function triggerPWAFavoriteEvent() {
  window.dispatchEvent(new CustomEvent('pwa-favorite-added'));
}
