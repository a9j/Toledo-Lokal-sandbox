import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, User, Sparkles, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import tlLogo from '@/assets/tl-logo.png';

export default function RoleSelect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'resident' | 'business' | 'food_truck' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const handleContinue = async () => {
    if (!selected) return;
    setIsSubmitting(true);

    try {
      const updateData: Record<string, boolean> = { role_selected: true };
      if (selected === 'business' || selected === 'food_truck') {
        updateData.profile_completed = true;
      }
      const { error } = await supabase
        .from('profiles')
        .update(updateData as any)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving role selection:', error);
        toast.error('Something went wrong. Please try again.');
        return;
      }

      if (selected === 'business' || selected === 'food_truck') {
        navigate('/create-business', { replace: true });
      } else {
        navigate('/profile-setup', { replace: true });
      }
    } catch (error) {
      console.error('Error saving role selection:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ role_selected: true } as any)
      .eq('user_id', user.id);
    if (error) {
      console.error('Error skipping role selection:', error);
      toast.error('Something went wrong. Please try again.');
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo & heading */}
        <div className="text-center space-y-3">
          <img src={tlLogo} alt="ToledoLokal" className="h-16 w-auto mx-auto" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-lokal-amber/60 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome! What brings you here?</h1>
          <p className="text-muted-foreground text-sm">
            Pick one to get started — you can always change later
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {([
            { id: 'resident' as const, icon: User, title: 'Toledo Explorer', desc: 'Find local spots, events, deals & earn rewards' },
            { id: 'business' as const, icon: Building2, title: 'Business', desc: 'Get your business on ToledoLokal — takes 2 minutes' },
            { id: 'food_truck' as const, icon: Truck, title: 'Food Truck', desc: 'Share your location, menu & schedule with Toledo' },
          ]).map((opt) => {
            const Icon = opt.icon;
            const isSelected = selected === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-primary/15' : 'bg-secondary'
                  }`}>
                    <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <span className="font-semibold text-base">{opt.title}</span>
                    <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue */}
        <Button
          onClick={handleContinue}
          disabled={!selected || isSubmitting}
          className="w-full h-12 rounded-xl text-base font-medium"
        >
          {isSubmitting ? 'Setting up...' : 'Continue'}
        </Button>

        {/* Skip */}
        <div className="text-center">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
