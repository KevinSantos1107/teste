import { useEffect, useState, useRef, useCallback } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { useRetroV2Store } from '../store/useRetroV2Store';
import { IntroSlide } from './slides/01-IntroSlide';
import { TimeSlide } from './slides/02-TimeSlide';
import { ErasSlide } from './slides/04-ErasSlide';
import { RouletteSlide } from './slides/05-RouletteSlide';
import { WordGameSlide } from './slides/06-WordGameSlide';
import { SummarySlide } from './slides/07-SummarySlide';
import { OutroSlide } from './slides/08-OutroSlide';
import '../styles/retro-v2.css';



export function RetroShell() {
  const { isOpen, closeRetro, isReady, config } = useRetroV2Store();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Gesture tracking — mesmo padrão do AlbumViewerModal
  const gesture = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    moved: boolean;
    pointerId: number | null;
  }>({ startX: 0, startY: 0, startTime: 0, moved: false, pointerId: null });

  // ── Música ─────────────────────────────────────────────────────────────────
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

  const hasRoulette = config.rouletteOptions && config.rouletteOptions.length > 0;
  const TOTAL_SLIDES = hasRoulette ? 7 : 6;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, TOTAL_SLIDES - 1));
  }, [TOTAL_SLIDES]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleStart = () => {
    startMusic();
    nextSlide();
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // ── Navegação por Pointer Events (igual ao álbum) ─────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== null) return;

    // Se o clique foi em um elemento interativo (botão, input, link…),
    // NÃO captamos o pointer — deixamos o evento chegar normalmente ao elemento.
    const target = e.target as HTMLElement;
    const isInteractiveElement = !!target.closest(
      'button, input, select, textarea, a, [role="button"], [data-interactive]'
    );
    if (isInteractiveElement) return;

    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      moved: false,
      pointerId: e.pointerId,
    };
    // Captura o pointer SÓ quando não é um elemento interativo
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== e.pointerId) return;
    const dx = Math.abs(e.clientX - gesture.current.startX);
    const dy = Math.abs(e.clientY - gesture.current.startY);
    if (dx > 8 || dy > 8) gesture.current.moved = true;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== e.pointerId) return;

    const { startX, moved } = gesture.current;
    gesture.current.pointerId = null;

    // Slide 0 (Intro) não navega por clique — só pelo botão "Começar"
    if (currentSlide === 0) return;

    // Tap simples (sem arrastar): navegar por metade da tela
    if (!moved) {
      const isRightSide = e.clientX > window.innerWidth / 2;
      if (isRightSide) nextSlide();
      else prevSlide();
      return;
    }

    // Swipe horizontal
    const dx = e.clientX - startX;
    const dy = e.clientY - gesture.current.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  }, [currentSlide, nextSlide, prevSlide]);

  const onPointerCancel = useCallback(() => {
    gesture.current.pointerId = null;
  }, []);

  if (!isOpen) return null;


  return (
    <div
      className="retro-v2-modal"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ touchAction: 'none' }}
    >
      {/* Barra de progresso — estilo Instagram Stories */}
      {currentSlide > 0 && (
        <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 px-2 pt-2 pointer-events-none">
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

      {/* Controles do topo — X e mudo */}
      <div className="absolute top-5 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); closeRetro(); }}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform border border-white/10"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {currentSlide > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform border border-white/10"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Indicador visual de zona de clique — aparece brevemente no primeiro slide não-intro */}
      {currentSlide === 1 && (
        <div className="absolute inset-y-16 left-0 right-0 z-30 flex pointer-events-none select-none">
          <div className="w-1/2 h-full flex items-center justify-start pl-3 opacity-0 hover:opacity-20 transition-opacity">
            <span className="text-white text-2xl">‹</span>
          </div>
          <div className="w-1/2 h-full flex items-center justify-end pr-3 opacity-0 hover:opacity-20 transition-opacity">
            <span className="text-white text-2xl">›</span>
          </div>
        </div>
      )}

      {/* Slides */}
      <div
        className="retro-v2-slider"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {/* Slide 0 — Intro (tem seu próprio botão, não navega por clique) */}
        <div className="retro-v2-slide">
          <IntroSlide onStart={handleStart} isReady={isReady} />
        </div>

        {/* Slide 1 — Horas Juntos */}
        <div className="retro-v2-slide">
          <TimeSlide />
        </div>

        {/* Slide 2 — Eras / Álbuns */}
        <div className="retro-v2-slide">
          <ErasSlide />
        </div>

        {/* Slide 3 — Roleta (interativo: clique em elementos internos não navega) */}
        {config.rouletteOptions && config.rouletteOptions.length > 0 && (
          <div className="retro-v2-slide">
            <RouletteSlide />
          </div>
        )}

        {/* Slide 4 — Jogo de Palavras (interativo) */}
        <div className="retro-v2-slide">
          <WordGameSlide onNext={nextSlide} />
        </div>

        {/* Slide 5 — Resumo */}
        <div className="retro-v2-slide">
          <SummarySlide />
        </div>

        {/* Slide 6 — Outro */}
        <div className="retro-v2-slide">
          <OutroSlide
            onReplay={() => {
              setCurrentSlide(0);
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
            }}
          />
        </div>
      </div>

    
    </div>
  );
}
