import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InstallAppGuide } from '@/components/pwa/InstallAppGuide';

// Slim, dismissible bottom banner shown to non-users who land on a business page
// from a scanned QR code (?via=qr). It nudges them to install the app without
// covering the Save Contact button up near the top of the page. "Get the app"
// opens the existing install flow.
export function QrConversionBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-16 z-40 px-3 pb-2 safe-area-bottom">
        <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur-xl lg:max-w-3xl">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Toledo Lokal</p>
            <p className="truncate text-xs text-muted-foreground">
              Save your favorite local spots. Free to join.
            </p>
          </div>
          <Button
            onClick={() => setShowInstall(true)}
            size="sm"
            className="h-9 flex-shrink-0 rounded-full px-4 text-sm font-semibold"
          >
            Get the app
          </Button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="flex-shrink-0 rounded-full p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <InstallAppGuide open={showInstall} onOpenChange={setShowInstall} />
    </>
  );
}
