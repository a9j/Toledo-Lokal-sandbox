import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useCategories } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { MapPin, Heart, Sparkles, ChevronRight, X, UtensilsCrossed, Palette, Trees, Wine, ShoppingBag, Users, Dumbbell, Music, HandMetal, Home, PartyPopper } from 'lucide-react';

const interestOptions = [
  { id: 'food', label: 'Food & Dining', icon: UtensilsCrossed },
  { id: 'arts', label: 'Arts & Culture', icon: Palette },
  { id: 'outdoors', label: 'Outdoors', icon: Trees },
  { id: 'nightlife', label: 'Nightlife', icon: Wine },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  { id: 'music', label: 'Music', icon: Music },
];

interface WelcomeGuideProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function WelcomeGuide({ onComplete, onSkip }: WelcomeGuideProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: neighborhoods } = useNeighborhoods();
  const [step, setStep] = useState(1);
  const [isNewcomer, setIsNewcomer] = useState<boolean | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleNeighborhood = (id: string) => {
    setSelectedNeighborhoods(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (user) {
      try {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          is_newcomer: isNewcomer || false,
          interests: selectedInterests,
          preferred_neighborhoods: selectedNeighborhoods,
          onboarding_completed: true,
        });
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
        <button onClick={onSkip} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col h-[calc(100vh-60px)] p-6">
        {step === 1 && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-toledo-lavender flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to Toledo Connect!</h1>
              <p className="text-muted-foreground mb-8">
                Let's personalize your experience. Are you new to Toledo?
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => { setIsNewcomer(true); setStep(2); }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    isNewcomer === true ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium inline-flex items-center gap-1.5"><HandMetal className="h-4 w-4" /> I'm new here!</span>
                  <p className="text-sm text-muted-foreground mt-1">Show me the essentials</p>
                </button>
                <button
                  onClick={() => { setIsNewcomer(false); setStep(2); }}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    isNewcomer === false ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium inline-flex items-center gap-1.5"><Home className="h-4 w-4" /> I'm a local</span>
                  <p className="text-sm text-muted-foreground mt-1">Help me discover new spots</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-toledo-rose to-toledo-lavender flex items-center justify-center mb-6">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">What are you into?</h1>
              <p className="text-muted-foreground mb-6">
                Select your interests to get personalized recommendations
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {interestOptions.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      selectedInterests.includes(interest.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <interest.icon className="h-5 w-5" />
                    <p className="text-sm font-medium mt-1">{interest.label}</p>
                  </button>
                ))}
              </div>
            </div>
            
            <Button
              onClick={() => setStep(3)}
              className="w-full rounded-xl h-12 mt-6"
              disabled={selectedInterests.length === 0}
            >
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-toledo-sage flex items-center justify-center mb-6">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Your neighborhoods</h1>
              <p className="text-muted-foreground mb-6">
                Which areas do you want to explore?
              </p>
              
              <div className="flex flex-wrap gap-2">
                {neighborhoods?.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => toggleNeighborhood(n.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedNeighborhoods.includes(n.id)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            </div>
            
            <Button
              onClick={handleComplete}
              className="w-full rounded-xl h-12 mt-6"
            >
              Start Exploring <PartyPopper className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
