import { useState } from 'react';
import { MapPin, Heart } from 'lucide-react';
import { CloudinaryImage } from '../album/CloudinaryImage';
import { cn } from '../../shared/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  location?: string;
  publicId?: string;
  photoUrl?: string;
  secretMessage?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

function TimelineItem({ event, index }: { event: TimelineEvent; index: number }) {
  const isEven = index % 2 === 0;
  const [isActive, setIsActive] = useState(false);
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const tilt = isEven ? -2 : 2;

  const handleCardClick = () => {
    setIsActive(!isActive);
  };

  const handleSecretClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que o clique na mensagem ative o clique do card simultaneamente
    if (isSecretOpen) {
      setIsSecretOpen(false);
      setIsActive(false);
    } else {
      setIsSecretOpen(true);
      setIsActive(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative flex flex-row items-start w-full group py-4 md:py-8"
    >
      {/* Ponto na timeline (Coração Pulsante que Mascara a Linha) */}
      <div className="absolute left-1/2 top-[32px] md:top-[48px] transform -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none">
        <motion.div 
          className="z-10 flex items-center justify-center"
          animate={isActive ? { scale: [1.1, 1.3, 1.1] } : { scale: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart 
            strokeWidth={2.5}
            className={cn(
              "w-5 h-5 md:w-6 md:h-6 transition-all duration-500",
              isActive 
                ? "fill-theme-primary text-theme-primary drop-shadow-[0_0_10px_var(--theme-primary)]" 
                : "fill-theme-bg text-theme-primary/80 drop-shadow-[0_0_5px_var(--theme-primary)] group-hover:text-theme-primary group-hover:scale-110"
            )} 
          />
        </motion.div>
      </div>

      {/* Container do Card */}
      <div
        className={cn(
          'w-1/2 px-1 md:px-4 flex',
          isEven ? 'justify-end pr-4 md:pr-14' : 'ml-auto justify-start pl-4 md:pl-14'
        )}
      >
        {/* Card Cinematográfico com Toggle (Neon e Tilt) */}
        <motion.div 
          onClick={handleCardClick}
          animate={{
            rotate: isActive ? tilt : 0,
            scale: isActive ? 1.02 : 1,
            boxShadow: isActive 
              ? '0 0 30px var(--theme-primary), inset 0 0 10px rgba(255,255,255,0.02)' 
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderColor: isActive ? 'var(--theme-primary)' : 'rgba(255, 255, 255, 0.1)',
            backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.05)'
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-3 backdrop-blur-md p-3 md:p-4 rounded-3xl w-full max-w-[220px] md:max-w-[260px] cursor-pointer relative z-20"
        >
          
          {/* Header do Card (Data e Local) */}
          <div className={cn("flex flex-col gap-0.5", isEven ? "items-end text-right" : "items-start text-left")}>
            <span className="text-[9px] md:text-xs text-theme-primary font-medium tracking-widest uppercase">
              {new Date(`${event.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            {event.location && (
              <span className="text-[8px] md:text-[10px] text-theme-text-secondary/70 flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" />
                {event.location}
              </span>
            )}
          </div>

          {/* Imagem (Aspect ratio 9:16 garantido) */}
          {(event.publicId || event.photoUrl) && (
            <div className="w-full rounded-xl overflow-hidden shadow-inner mt-1.5 aspect-[9/16] relative bg-[#1a1a1a] border border-white/5">
              {/* Efeito de Skeleton (Shimmer) que desaparece ao carregar */}
              <div 
                className={cn(
                  "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-0 transition-opacity duration-500",
                  isImageLoaded ? "opacity-0" : "animate-shimmer opacity-100"
                )} 
              />
              
              <div className="absolute inset-0 bg-theme-primary/10 pointer-events-none z-10 mix-blend-overlay" />
              <CloudinaryImage
                publicId={event.publicId || event.photoUrl || ''}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-700 relative z-20"
                style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
          )}

          {/* Título e Descrição */}
          <div className={cn("w-full", isEven ? "text-right" : "text-left")}>
            <h3 className="text-[13px] md:text-xl font-bold text-theme-text mb-1 font-serif leading-tight">
              {event.title}
            </h3>
            <p className="text-theme-text-secondary leading-relaxed text-[10px] md:text-[13px] font-light">
              {event.description}
            </p>
          </div>

          {/* Mensagem Secreta */}
          {event.secretMessage && (
            <div className={cn("w-full mt-1", isEven ? "flex flex-col items-end" : "flex flex-col items-start")}>
              <div
                onClick={handleSecretClick}
                className={cn(
                  "text-[9px] md:text-xs transition-colors flex items-center gap-1.5 py-1",
                  isSecretOpen ? "text-theme-primary" : "text-theme-text-secondary/50 hover:text-theme-primary/80"
                )}
              >
                <Heart className={cn("w-2.5 h-2.5 md:w-3 md:h-3 transition-transform duration-300", isSecretOpen ? "fill-theme-primary scale-110" : "")} />
                <span className="italic">{isSecretOpen ? 'Ocultar' : 'Revelar'}</span>
              </div>
              <AnimatePresence>
                {isSecretOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -5 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden w-full"
                  >
                    <div className={cn(
                      "mt-2 text-[10px] md:text-xs text-theme-text-secondary/90 italic font-light p-2.5 md:p-3 rounded-xl bg-black/20 border border-white/5",
                      isEven ? "text-right rounded-tr-sm" : "text-left rounded-tl-sm"
                    )}>
                      {event.secretMessage}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 text-theme-text-secondary font-medium italic">
        Nenhum evento registrado ainda.
      </div>
    );
  }

  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="container mx-auto px-2 md:px-4 py-8 md:py-16 max-w-5xl flex flex-col items-center">

      {/* CSS Animations — GPU-accelerated, sem filtros SVG */}
      <style>{`
        @keyframes energyPulse {
          from { top: -30%; }
          to { top: 130%; }
        }
        @keyframes trailSpin {
          to { stroke-dashoffset: 0; }
        }
        .energy-pulse {
          animation: energyPulse 4s linear infinite;
        }
        .trail-comet {
          stroke-dashoffset: 100;
          animation: trailSpin 3s linear infinite;
        }
        
        /* Animação para o Skeleton de carregamento da imagem */
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        /* Acessibilidade: Em dispositivos que pedem redução de movimento,
           desligamos a animação mas preenchemos o símbolo inteiro de luz! */
        @media (prefers-reduced-motion: reduce) {
          .energy-pulse,
          .trail-comet,
          .animate-shimmer {
            animation: none !important;
          }
          .trail-comet {
            stroke-dasharray: none !important;
          }
        }
      `}</style>
      
      {/* Wrapper Relativo da Timeline (Eventos + Linha) */}
      <div className="relative w-full z-10">
        
        {/* Cabo de energia central */}
        <div 
          className="absolute left-1/2 top-0 bottom-[-5px] w-[2px] transform -translate-x-1/2 z-0 rounded-full overflow-hidden"
          style={{ boxShadow: '0 0 12px var(--theme-primary), 0 0 4px var(--theme-secondary)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-theme-primary via-theme-secondary to-theme-primary opacity-80" />
          <div 
            className="energy-pulse w-full h-[30vh] bg-gradient-to-b from-transparent via-white to-transparent opacity-90 mix-blend-overlay"
            style={{ position: 'absolute', left: 0 }}
          />
        </div>

        {/* Lista de Eventos */}
        <div className="space-y-6 md:space-y-12 relative z-10">
          {sortedEvents.map((event, index) => (
            <TimelineItem key={event.id} event={event} index={index} />
          ))}
        </div>
      </div>

      {/* Símbolo do Infinito no Final da Timeline */}
      <div className="flex flex-col items-center justify-center z-20 relative">
        <svg viewBox="0 0 120 80" className="w-28 h-[76px] md:w-40 md:h-28 overflow-visible mt-[-5px]">
          <defs>
            <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--theme-primary)" />
              <stop offset="50%" stopColor="var(--theme-secondary)" />
              <stop offset="100%" stopColor="var(--theme-primary)" />
            </linearGradient>
            {/* Gradiente ultra-suave com 11 stops — transição orgânica contínua */}
            <linearGradient id="trailSmoothGradient" gradientUnits="userSpaceOnUse" x1="15" y1="40" x2="105" y2="40">
              <stop offset="0%"   stopColor="var(--theme-primary)"   stopOpacity="0.45" />
              <stop offset="10%"  stopColor="var(--theme-primary)"   stopOpacity="0.6" />
              <stop offset="22%"  stopColor="var(--theme-secondary)" stopOpacity="0.72" />
              <stop offset="34%"  stopColor="var(--theme-primary)"   stopOpacity="0.84" />
              <stop offset="44%"  stopColor="var(--theme-secondary)" stopOpacity="0.92" />
              <stop offset="50%"  stopColor="#ffffff"                 stopOpacity="0.95" />
              <stop offset="56%"  stopColor="var(--theme-secondary)" stopOpacity="0.92" />
              <stop offset="66%"  stopColor="var(--theme-primary)"   stopOpacity="0.84" />
              <stop offset="78%"  stopColor="var(--theme-secondary)" stopOpacity="0.72" />
              <stop offset="90%"  stopColor="var(--theme-primary)"   stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--theme-primary)"   stopOpacity="0.45" />
            </linearGradient>
          </defs>

          {/* Conexão grossa e brilhante: topo → centro do infinito */}
          <line 
            x1="60" y1="0" x2="60" y2="40" 
            stroke="url(#energyGradient)" 
            strokeWidth="3.5"
            style={{ filter: 'drop-shadow(0 0 6px var(--theme-primary))' }}
          />
          
          {/* Infinito Base (contorno sutil permanente) */}
          <path 
            d="M 60 40 C 80 20, 105 20, 105 40 C 105 60, 80 60, 60 40 C 40 20, 15 20, 15 40 C 15 60, 40 60, 60 40 Z" 
            stroke="url(#energyGradient)" 
            strokeWidth="1.5" 
            fill="none" 
            strokeOpacity="0.15"
          />

          {/* Rastro animado — camada de glow suave (halo externo) */}
          <path 
            className="trail-comet"
            d="M 60 40 C 80 20, 105 20, 105 40 C 105 60, 80 60, 60 40 C 40 20, 15 20, 15 40 C 15 60, 40 60, 60 40 Z" 
            stroke="url(#trailSmoothGradient)" 
            strokeWidth="4" 
            fill="none" 
            pathLength={100}
            strokeDasharray="45 55"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 5px var(--theme-primary))' }}
          />

          {/* Rastro animado — núcleo brilhante (traço principal) */}
          <path 
            className="trail-comet"
            d="M 60 40 C 80 20, 105 20, 105 40 C 105 60, 80 60, 60 40 C 40 20, 15 20, 15 40 C 15 60, 40 60, 60 40 Z" 
            stroke="url(#trailSmoothGradient)" 
            strokeWidth="2.5" 
            fill="none" 
            pathLength={100}
            strokeDasharray="45 55"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-theme-text-secondary italic text-[11px] md:text-sm font-serif mt-3 opacity-80 tracking-wider">
          Nossa história continua...
        </span>
      </div>
      
    </div>
  );
}
