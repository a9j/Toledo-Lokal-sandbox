import { useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallPrompt() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // Show iOS instructions modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
        <div className="w-full max-w-md bg-background rounded-2xl p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Install Toledo Hub</h3>
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
            Add Toledo Hub to your home screen for the best experience:
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
              setDismissed(true);
            }}
          >
            Got it
          </Button>
        </div>
      </div>
    );
  }

  // Show install banner for supported browsers or iOS
  if (canInstall || isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto">
        <div className="card-elevated-lg p-4 flex items-center gap-3 shadow-lg border border-border">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Download className="h-6 w-6 text-accent" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">Install Toledo Hub</p>
            <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
          </div>
          
          <Button
            size="sm"
            className="rounded-full flex-shrink-0"
            onClick={() => {
              if (isIOS) {
                setShowIOSInstructions(true);
              } else {
                promptInstall();
              }
            }}
          >
            Install
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}