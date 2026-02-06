import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUserPulseSettings } from '@/hooks/useUserPulseSettings';
import { Radio, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UserPulseToggle() {
  const { settings, updateSettings } = useUserPulseSettings();
  const { toast } = useToast();

  const handleToggle = async (enabled: boolean) => {
    try {
      await updateSettings.mutateAsync({ user_pulse_enabled: enabled });
      toast({
        title: enabled ? 'Activity sharing enabled' : 'Activity sharing disabled',
        description: enabled 
          ? 'Your activity will appear on The Pulse' 
          : 'Your activity will no longer be shared',
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error updating settings' });
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Activity on The Pulse</CardTitle>
            <CardDescription className="text-xs">
              Share when you visit, save, or support local spots
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Label htmlFor="pulse-toggle" className="text-sm text-muted-foreground">
            Share my activity
          </Label>
          <Switch
            id="pulse-toggle"
            checked={settings?.user_pulse_enabled ?? true}
            onCheckedChange={handleToggle}
            disabled={updateSettings.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
