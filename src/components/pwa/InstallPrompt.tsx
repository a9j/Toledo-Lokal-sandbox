import { useState, useEffect } from 'react';
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Check localStorage for dismissal and show banner after brief delay
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
    } else {
      // Show after a short delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed || !showBanner) return null;

  // Show iOS instructions modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
        <div className="w-full max-w-md bg-background rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Install Toledo Connect</h3>
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
            Add Toledo Connect to your home screen for the best experience:
          </p>
          
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">1</div>
              <span>Tap the <Share className="inline h-4 w-4 mx-1" /> Share button in Safari</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">2</div>
              <span>Scroll down and tap <Plus className="inline h-4 w-4 mx-1" /> "Add to Home Screen"</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">3</div>
              <span>Tap "Add" to confirm</span>
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

  // Show prominent install banner
  if (canInstall || isIOS) {
    return (
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 animate-in slide-in-from-bottom duration-500">
        <div className="max-w-md mx-auto bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-7 w-7" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base">Get the App!</p>
              <p className="text-sm opacity-90 mt-0.5">
                Install Toledo Connect for instant access, notifications & offline mode
              </p>
              
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full font-semibold"
                  onClick={() => {
                    if (isIOS) {
                      setShowIOSInstructions(true);
                    } else {
                      promptInstall();
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Install Free
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                  onClick={handleDismiss}
                >
                  Maybe Later
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0 text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10 -mt-1 -mr-1"
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