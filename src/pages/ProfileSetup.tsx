import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, MapPin, Heart, User, ArrowRight, Smartphone } from 'lucide-react';
import tlLogo from '@/assets/tl-logo.png';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { InstallAppButton } from '@/components/pwa/InstallAppButton';

export default function ProfileSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isInstalled } = usePWAInstall();
  const [step, setStep] = useState(0); // 0: name, 1: neighborhood, 2: categories, 3: install
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || '');
  const [neighborhoodId, setNeighborhoodId] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: neighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: async () => {
      const { data } = await supabase
        .from('neighborhoods')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, icon')
        .order('name');
      return data || [];
    },
  });

  if (!user) {
    navigate('/auth', { replace: true });
    return null;
  }

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) 
        ? prev.filter(id => id !== catId) 
        : prev.length < 5 ? [...prev, catId] : prev
    );
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: displayName || user.email?.split('@')[0] || 'User',
          neighborhood_id: neighborhoodId || null,
          favorite_categories: selectedCategories.length > 0 ? selectedCategories : [],
          profile_completed: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate profile cache so Today page sees profile_completed = true
      queryClient.invalidateQueries({ queryKey: ['profile-role-check'] });

      toast.success('Profile set up! Welcome to ToledoLokal');
      // Offer "Add to Home Screen" as the final step, unless already installed.
      if (isInstalled) {
        navigate('/', { replace: true });
      } else {
        setStep(3);
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await supabase
      .from('profiles')
      .update({ profile_completed: true })
      .eq('user_id', user.id);
    queryClient.invalidateQueries({ queryKey: ['profile-role-check'] });
    navigate('/', { replace: true });
  };

  const steps = [
    { icon: User, label: 'Name' },
    { icon: MapPin, label: 'Neighborhood' },
    { icon: Heart, label: 'Interests' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        {step < 3 && (
          <div className="text-center space-y-3">
            <img src={tlLogo} alt="ToledoLokal" className="h-14 w-auto mx-auto" />
            <h1 className="text-2xl font-bold tracking-tight">Set Up Your Profile</h1>
            <p className="text-muted-foreground text-sm">
              Quick — takes less than 30 seconds
            </p>
          </div>
        )}

        {/* Step indicator */}
        {step < 3 && (
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                i < step ? 'bg-primary text-primary-foreground' 
                : i === step ? 'bg-primary/15 text-primary border-2 border-primary' 
                : 'bg-secondary text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
        )}

        {/* Step 0: Name */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">What should we call you?</Label>
              <Input
                id="display-name"
                placeholder="Your name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="h-12 rounded-xl"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This shows on reviews and community posts
              </p>
            </div>
            <Button 
              onClick={() => setStep(1)} 
              className="w-full h-12 rounded-xl gap-2"
            >
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Neighborhood */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <Label>Which part of Toledo are you in?</Label>
              <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Pick your neighborhood" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods?.map(n => (
                    <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Helps us show you nearby businesses & events
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12 rounded-xl">
                Back
              </Button>
              <Button onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl gap-2">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Categories */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <Label>What are you into? <span className="text-muted-foreground font-normal">(pick up to 5)</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {categories?.map(cat => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-border hover:border-primary/40 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                        <span className="truncate">{cat.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">
                Back
              </Button>
              <Button 
                onClick={handleFinish} 
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl"
              >
                {isSubmitting ? 'Saving...' : "I'm Done!"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Add to Home Screen */}
        {step === 3 && (
          <div className="space-y-8 text-center animate-in fade-in">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/12 border border-primary/20 flex items-center justify-center mx-auto">
                <Smartphone className="h-8 w-8 text-primary" strokeWidth={1.8} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">You're all set!</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Want quick access? Add Toledo Lokal to your home screen for a
                full-screen, app-like experience.
              </p>
            </div>
            <div className="space-y-2">
              <InstallAppButton label="Add to Home Screen" className="w-full" />
              <button
                onClick={() => navigate('/', { replace: true })}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* Skip */}
        {step < 3 && (
          <div className="text-center">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
