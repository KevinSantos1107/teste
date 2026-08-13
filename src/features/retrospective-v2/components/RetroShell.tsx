import { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useRetroV2Store } from '../store/useRetroV2Store';
import { IntroSlide } from './slides/01-IntroSlide';
import { TimeSlide } from './slides/02-TimeSlide';
import { MapSlide } from './slides/03-MapSlide';
import { ErasSlide } from './slides/04-ErasSlide';
import { RouletteSlide } from './slides/05-RouletteSlide';
import { WordGameSlide } from './slides/06-WordGameSlide';
import { SummarySlide } from './slides/07-SummarySlide';
import { OutroSlide } from './slides/08-OutroSlide';
import '../styles/retro-v2.css';

// Slides that have internal interactive elements — swipe nav only, no tap zones
const INTERACTIVE_SLIDES = new Set([3, 4, 5]); // MapSlide=2(idx), RouletteSlide=4, WordGame=5

export function RetroShell() {
  const { isOpen, closeRetro, isReady, config } = useRetroV2Store();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Swipe tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  // Music
  const startMusic = useCallback(async () => {
    if (!config.musicUrl) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(config.musicUrl);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioRef.current.crossOrigin = 'anonymous';
      }
      await audioRef.current.play();

    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  }, [config.musicUrl]);

  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentSlide(0);

  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentSlide(0);
    } else {
      document.body.style.overflow = '';
      stopMusic();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, stopMusic]);

  const nextSlide = useCallback((max: number) => {
    setCurrentSlide(prev => Math.min(prev + 1, max - 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  }, []);

  const handleStart = () => {
    startMusic();
    nextSlide(100); // 100 is just a safe max since Intro is slide 0
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Swipe gesture handling on the outer wrapper
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Mark as horizontal swipe if horizontal motion dominates
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current || currentSlide === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) nextSlide(100);
    else if (dx > 50) prevSlide();
    isSwiping.current = false;
  };

  if (!isOpen) return null;

  const hasRoulette = config.rouletteOptions && config.rouletteOptions.length > 0;
  const TOTAL_SLIDES = hasRoulette ? 8 : 7;
  const isInteractive = INTERACTIVE_SLIDES.has(currentSlide);
  
  // Safe wrapper for nextSlide with the actual total
  const goNext = () => nextSlide(TOTAL_SLIDES);

  return (
    <div
      className="retro-v2-modal"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Bars */}
      {currentSlide > 0 && (
        <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 px-2 pt-2">
          {Array.from({ length: TOTAL_SLIDES - 1 }).map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: i + 1 <= currentSlide ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-5 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
        <button
          onClick={closeRetro}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform border border-white/10"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {currentSlide > 0 && (
          <button
            onClick={toggleMute}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform border border-white/10"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        )}
      </div>

      {/* Slides */}
      <div
        className="retro-v2-slider"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        <div className="retro-v2-slide"><IntroSlide onStart={handleStart} isReady={isReady} /></div>
        <div className="retro-v2-slide"><TimeSlide /></div>
        <div className="retro-v2-slide"><MapSlide /></div>
        <div className="retro-v2-slide"><ErasSlide /></div>
        {config.rouletteOptions && config.rouletteOptions.length > 0 && (
          <div className="retro-v2-slide"><RouletteSlide /></div>
        )}
        <div className="retro-v2-slide"><WordGameSlide onNext={goNext} /></div>
        <div className="retro-v2-slide"><SummarySlide /></div>
        <div className="retro-v2-slide">
          <OutroSlide onReplay={() => {
            setCurrentSlide(0);
            if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
          }} />
        </div>
      </div>

      {/* Navigation — only show for non-interactive, non-intro slides */}
      {currentSlide > 0 && !isInteractive && (
        <>
          {/* Left zone: prev (1/4 of screen) */}
          <div
            onClick={prevSlide}
            className="absolute left-0 inset-y-16 w-1/4 z-40 cursor-pointer flex items-center justify-start pl-2 group"
          >
            <div className="opacity-0 group-hover:opacity-30 transition-opacity">
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Right zone: next (3/4 of screen) */}
          <div
            onClick={goNext}
            className="absolute right-0 inset-y-16 w-3/4 z-40 cursor-pointer flex items-center justify-end pr-2 group"
          >
            <div className="opacity-0 group-hover:opacity-30 transition-opacity">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </>
      )}

      {/* For interactive slides, show explicit nav buttons at bottom */}
      {currentSlide > 0 && isInteractive && (
        <div className="absolute bottom-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
          <button
            onClick={e => { e.stopPropagation(); prevSlide(); }}
            className="pointer-events-auto flex items-center gap-1 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-xs border border-white/10 active:scale-95 transition-transform"
          >
            <ChevronLeft className="w-3 h-3" /> Voltar
          </button>
          <button
            onClick={e => { e.stopPropagation(); goNext(); }}
            className="pointer-events-auto flex items-center gap-1 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs border border-white/10 active:scale-95 transition-transform"
          >
            Pular <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Dot indicators */}
      {currentSlide > 0 && !isInteractive && currentSlide < TOTAL_SLIDES - 1 && (
        <div className="absolute bottom-5 left-0 right-0 z-50 flex justify-center gap-1.5 pointer-events-none">
          {Array.from({ length: TOTAL_SLIDES - 1 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i + 1 === currentSlide ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
