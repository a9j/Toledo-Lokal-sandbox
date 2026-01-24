import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import useEmblaCarousel from 'embla-carousel-react';
import { 
  MapPin, 
  Calendar, 
  Tag, 
  Users, 
  Bell, 
  Smartphone, 
  ChevronRight, 
  ChevronLeft,
  X,
  Share,
  Plus,
  Sparkles
} from 'lucide-react';

interface FirstVisitOnboardingProps {
  onComplete: () => void;
}

const features = [
  {
    icon: MapPin,
    title: 'Discover Local Gems',
    description: 'Find the best restaurants, shops, and hidden spots across Toledo neighborhoods.',
    gradient: 'from-primary to-primary/70',
  },
  {
    icon: Calendar,
    title: 'Never Miss Events',
    description: 'Stay updated on concerts, festivals, markets, and community happenings.',
    gradient: 'from-toledo-rose to-toledo-lavender',
  },
  {
    icon: Users,
    title: 'Community & Causes',
    description: 'Explore local nonprofits and find causes you care about in Toledo.',
    gradient: 'from-rose-500 to-rose-400',
  },
  {
    icon: Tag,
    title: 'Exclusive Deals',
    description: 'Get special offers and discounts from local businesses near you.',
    gradient: 'from-toledo-sage to-toledo-teal',
  },
];

export function FirstVisitOnboarding({ onComplete }: FirstVisitOnboardingProps) {
  const [step, setStep] = useState(0);
  const { canInstall, isIOS, isInstalled, promptInstall } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  
  const totalSteps = features.length + 1; // Features + install step
  const isLastStep = step === totalSteps - 1;
  const showInstallStep = canInstall || isIOS;

  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false,
    dragFree: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setStep(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else if (emblaApi) {
      emblaApi.scrollNext();
    }
  };

  const handleBack = () => {
    if (emblaApi && step > 0) {
      emblaApi.scrollPrev();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding-completed', 'true');
    onComplete();
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      await promptInstall();
      handleComplete();
    }
  };

  // iOS instructions modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Install Toledo Connect</h3>
          <Button variant="ghost" size="icon" onClick={() => setShowIOSInstructions(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
            <Smartphone className="h-10 w-10 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-center mb-2">Add to Home Screen</h2>
          <p className="text-muted-foreground text-center mb-8">
            Install Toledo Connect for the best experience
          </p>
          
          <ol className="space-y-4 w-full max-w-sm">
            <li className="flex items-center gap-4 p-4 rounded-xl bg-secondary">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <span>Tap <Share className="inline h-5 w-5 mx-1" /> Share in Safari</span>
            </li>
            <li className="flex items-center gap-4 p-4 rounded-xl bg-secondary">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <span>Tap <Plus className="inline h-5 w-5 mx-1" /> Add to Home Screen</span>
            </li>
            <li className="flex items-center gap-4 p-4 rounded-xl bg-secondary">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <span>Tap "Add" to confirm</span>
            </li>
          </ol>
        </div>
        
        <div className="p-4 border-t border-border">
          <Button className="w-full rounded-xl h-12" onClick={handleComplete}>
            Got it, continue to app
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Progress bar */}
      <div className="flex items-center justify-between p-4">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? 'w-8 bg-primary' : 'w-4 bg-border'
              }`}
            />
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground"
          onClick={handleComplete}
        >
          {isLastStep ? 'Done' : 'Skip'}
        </Button>
      </div>

      {/* Swipeable Content */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {/* Feature slides */}
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center p-6"
            >
              <div className="w-full max-w-sm text-center">
                <div className={`w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-8 shadow-lg`}>
                  <feature.icon className="h-12 w-12 text-white" />
                </div>
                
                <h1 className="text-2xl font-bold mb-3">{feature.title}</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
          
          {/* Install/Final step */}
          <div className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center p-6">
            {showInstallStep ? (
              <div className="w-full max-w-sm text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary via-accent to-toledo-teal flex items-center justify-center mb-8 shadow-lg relative">
                  <Smartphone className="h-12 w-12 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-toledo-rose rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold mb-3">Get the Full Experience</h1>
                <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                  Install Toledo Connect for instant access, push notifications, and offline browsing.
                </p>
                
                <div className="space-y-3 text-left bg-secondary/50 rounded-2xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <span className="text-sm">Get notified about events & deals</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <span className="text-sm">Launch instantly from home screen</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-sm">Works offline for saved places</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-8 shadow-lg">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
                
                <h1 className="text-2xl font-bold mb-3">You're All Set!</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Start exploring everything Toledo has to offer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-3">
          {step > 0 && (
            <Button 
              variant="outline" 
              size="lg"
              className="rounded-xl"
              onClick={handleBack}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          
          {step === features.length && showInstallStep ? (
            <div className="flex-1 flex gap-3">
              <Button 
                variant="outline"
                size="lg"
                className="flex-1 rounded-xl"
                onClick={handleComplete}
              >
                Maybe Later
              </Button>
              <Button 
                size="lg"
                className="flex-1 rounded-xl gap-2"
                onClick={handleInstall}
              >
                <Smartphone className="h-5 w-5" />
                Install App
              </Button>
            </div>
          ) : (
            <Button 
              size="lg"
              className="flex-1 rounded-xl"
              onClick={handleNext}
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight className="h-5 w-5 ml-1" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
