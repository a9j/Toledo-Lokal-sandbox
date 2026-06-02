import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Building2, User, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import tlLogo from '@/assets/tl-logo.png';

export default function RoleSelect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<'resident' | 'business' | 'nonprofit' | null>(null);
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
      if (selected === 'business' || selected === 'nonprofit') {
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

      if (selected === 'business') {
        navigate('/create-business', { replace: true });
      } else if (selected === 'nonprofit') {
        navigate('/create-business?type=nonprofit', { replace: true });
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
          <button
            onClick={() => setSelected('resident')}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
              selected === 'resident'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selected === 'resident' ? 'bg-primary/15' : 'bg-secondary'
              }`}>
                <User className={`h-6 w-6 ${selected === 'resident' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <span className="font-semibold text-base">Explore Toledo</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Find local spots, events, deals & earn rewards
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelected('business')}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
              selected === 'business'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selected === 'business' ? 'bg-primary/15' : 'bg-secondary'
              }`}>
                <Building2 className={`h-6 w-6 ${selected === 'business' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <span className="font-semibold text-base">List My Business</span>
                <p className="text-sm text-muted-foreground mt-1">
                  Get your business on ToledoLokal — it only takes 2 minutes
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelected('nonprofit')}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
              selected === 'nonprofit'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border hover:border-primary/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selected === 'nonprofit' ? 'bg-primary/15' : 'bg-secondary'
              }`}>
                <Heart className={`h-6 w-6 ${selected === 'nonprofit' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <span className="font-semibold text-base">Register a Nonprofit</span>
                <p className="text-sm text-muted-foreground mt-1">
                  List your nonprofit organization & connect with the community
                </p>
              </div>
            </div>
          </button>
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
