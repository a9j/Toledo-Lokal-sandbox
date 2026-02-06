import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FlipProfileContainerProps {
  children: React.ReactNode[];
  className?: string;
}

export function FlipProfileContainer({ children, className }: FlipProfileContainerProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  
  const totalCards = children.length;

  const goToCard = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= totalCards) return;
    setIsAnimating(true);
    setCurrentCard(index);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, totalCards]);

  const nextCard = useCallback(() => {
    if (currentCard < totalCards - 1) {
      goToCard(currentCard + 1);
    }
  }, [currentCard, totalCards, goToCard]);

  const prevCard = useCallback(() => {
    if (currentCard > 0) {
      goToCard(currentCard - 1);
    }
  }, [currentCard, goToCard]);

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diff = touchStartY.current - touchEndY.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        nextCard(); // Swipe up = next
      } else {
        prevCard(); // Swipe down = previous
      }
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextCard();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        prevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextCard, prevCard]);

  // Handle wheel events for desktop
  const wheelTimeout = useRef<NodeJS.Timeout>();
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (wheelTimeout.current) return;
    
    wheelTimeout.current = setTimeout(() => {
      wheelTimeout.current = undefined;
    }, 500);

    if (e.deltaY > 30) {
      nextCard();
    } else if (e.deltaY < -30) {
      prevCard();
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative h-[calc(100vh-8rem)] overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Card Stack */}
      <div className="relative h-full">
        {children.map((child, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-all duration-400 ease-out",
              index === currentCard && "translate-y-0 opacity-100 z-10",
              index < currentCard && "-translate-y-full opacity-0 z-0",
              index > currentCard && "translate-y-full opacity-0 z-0"
            )}
            style={{
              transitionDuration: '400ms',
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Progress Indicator - Dots */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
        {Array.from({ length: totalCards }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToCard(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentCard 
                ? "bg-primary h-4" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            aria-label={`Go to card ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows - Desktop */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20 hidden md:flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevCard}
          disabled={currentCard === 0 || isAnimating}
          className="h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm border border-border/50"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground font-medium px-2">
          {currentCard + 1} / {totalCards}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextCard}
          disabled={currentCard === totalCards - 1 || isAnimating}
          className="h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm border border-border/50"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Swipe Hint - Mobile */}
      {currentCard === 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 md:hidden animate-bounce">
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <ChevronUp className="h-5 w-5 rotate-180" />
            <span className="text-xs">Swipe up</span>
          </div>
        </div>
      )}
    </div>
  );
}
