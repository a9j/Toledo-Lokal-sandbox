import { useEffect, useState } from 'react';
import { Apple, Smartphone, Download, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePWAInstall } from '@/hooks/usePWAInstall';

type Platform = 'ios' | 'android';

const iosSteps: React.ReactNode[] = [
  <>Open this page in <strong>Safari</strong>, then tap the <strong>Share</strong> button.</>,
  <>Scroll down and tap <strong>Add to Home Screen</strong>.</>,
  <>Tap <strong>Add</strong> to finish.</>,
];

const androidSteps: React.ReactNode[] = [
  <>Open this page in <strong>Chrome</strong>, then tap the menu (three dots, top right).</>,
  <>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</>,
  <>Tap <strong>Install</strong> to confirm.</>,
];

interface InstallAppGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallAppGuide({ open, onOpenChange }: InstallAppGuideProps) {
  const { canInstall, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [platform, setPlatform] = useState<Platform>(isIOS ? 'ios' : 'android');

  // Re-sync the selected tab when detection resolves
  useEffect(() => {
    setPlatform(isIOS ? 'ios' : 'android');
  }, [isIOS, isAndroid]);

  const steps = platform === 'ios' ? iosSteps : androidSteps;

  const handleNativeInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Turn this into an app</DialogTitle>
          <DialogDescription>
            {isInstalled
              ? "You've already added ToledoLokal to your home screen."
              : 'Add ToledoLokal to your home screen for full-screen, app-like access.'}
          </DialogDescription>
        </DialogHeader>

        {isInstalled ? (
          <div className="flex items-center gap-3 rounded-xl bg-primary/10 p-4 text-sm">
            <Check className="h-5 w-5 text-primary" />
            <span>App installed. Look for the ToledoLokal icon on your home screen.</span>
          </div>
        ) : (
          <>
            {/* One-tap native install when the browser supports it (Android Chrome, desktop) */}
            {canInstall && (
              <Button onClick={handleNativeInstall} className="w-full rounded-full">
                <Download className="mr-1.5 h-4 w-4" />
                Install app
              </Button>
            )}

            {/* Platform toggle */}
            <div className="flex gap-1 rounded-xl bg-muted p-1">
              <PlatformTab
                active={platform === 'ios'}
                onClick={() => setPlatform('ios')}
                icon={<Apple className="h-4 w-4" />}
                label="iPhone / iPad"
              />
              <PlatformTab
                active={platform === 'android'}
                onClick={() => setPlatform('android')}
                icon={<Smartphone className="h-4 w-4" />}
                label="Android"
              />
            </div>

            {canInstall && (
              <p className="text-center text-xs text-muted-foreground">
                Or follow the steps manually:
              </p>
            )}

            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}

        <Button variant="ghost" className="w-full rounded-full" onClick={() => onOpenChange(false)}>
          {isInstalled ? 'Close' : 'Done'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface PlatformTabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function PlatformTab({ active, onClick, icon, label }: PlatformTabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
