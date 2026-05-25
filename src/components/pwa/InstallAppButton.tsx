import { useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { InstallAppGuide } from '@/components/pwa/InstallAppGuide';
import { cn } from '@/lib/utils';

interface InstallAppButtonProps {
  label?: string;
  className?: string;
}

// Shared "install / add to home screen" trigger. On browsers that fire
// beforeinstallprompt (Android Chrome, desktop Chrome/Edge) it triggers the
// native prompt directly; otherwise (iOS Safari, unsupported) it opens the
// manual instructions guide. Renders nothing once the app is installed.
export function InstallAppButton({ label = 'Add to Home Screen', className }: InstallAppButtonProps) {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (canInstall) {
      await promptInstall();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <Button onClick={handleClick} className={cn('h-12 rounded-full gap-2 font-semibold', className)}>
        <Smartphone className="h-4 w-4" />
        {label}
      </Button>
      <InstallAppGuide open={showGuide} onOpenChange={setShowGuide} />
    </>
  );
}
