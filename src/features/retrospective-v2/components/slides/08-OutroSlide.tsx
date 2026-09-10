import { useRetroV2Store } from '../../store/useRetroV2Store';

export function OutroSlide({ onReplay }: { onReplay: () => void }) {
  const { config } = useRetroV2Store();
  
  const title = config.outroTitle || 'Feliz 1 ano pra nós, meu amor!';
  const message = config.outroMessage || 'Obrigado por cada momento incrível. Essa é só uma parte da nossa história.';

  // Confetti particles - pre-calculated to avoid random on every render
  const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
    width: (i * 13 % 6) + 4,
    height: (i * 7 % 12) + 6,
    color: ['#f43f5e', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6'][i % 5],
    left: (i * 7919 % 100),
    duration: (i * 17 % 3) + 2,
    delay: (i * 31 % 5),
  }));

  return (
    <div className="flex-1 bg-[#09090b] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="retro-v2-particle absolute"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              backgroundColor: p.color,
              left: `${p.left}%`,
              animation: `retro-v2-fall ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="z-10 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full">
        <h2
          className="text-white font-black mb-4 leading-tight"
          style={{
            fontFamily: "'Dancing Script', cursive",
            fontSize: 'clamp(1.8rem, 8vw, 2.8rem)',
          }}
        >
          {title}
        </h2>

        <p className="text-white/70 font-medium mb-8 text-sm leading-relaxed">
          {message}
        </p>

        <button
          onClick={onReplay}
          className="w-full py-4 bg-white text-black font-bold rounded-full uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
        >
          Assistir Novamente
        </button>
      </div>
    </div>
  );
}
