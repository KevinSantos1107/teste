import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../shared/utils/cn';

interface SplashScreenProps {
  onComplete: () => void;
  title?: string;
}

export function SplashScreen({ onComplete, title = 'Carregando o nosso amor...' }: SplashScreenProps) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Minimum display time for the splash screen
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      // Wait for fade out animation to finish before calling onComplete
      setTimeout(onComplete, 800);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-theme-bg transition-opacity duration-800 ease-in-out',
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
    >
      <div className="relative flex items-center justify-center">
        <Heart 
          className="w-24 h-24 text-theme-primary animate-ping absolute opacity-75" 
          strokeWidth={1.5}
        />
        <Heart 
          className="w-20 h-20 text-theme-primary relative z-10 fill-theme-primary animate-pulse" 
        />
      </div>
      <p className="mt-12 text-theme-text font-serif text-xl animate-pulse tracking-wide">
        {title}
      </p>
    </div>
  );
}
