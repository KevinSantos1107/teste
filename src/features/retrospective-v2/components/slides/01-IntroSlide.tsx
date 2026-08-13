import { useSiteConfigStore } from '../../../../store/siteConfigStore';
import { useEffect, useState } from 'react';

export function IntroSlide({ onStart, isReady }: { onStart: () => void; isReady: boolean }) {
  const { config } = useSiteConfigStore();
  const [days, setDays] = useState(0);

  useEffect(() => {
    const startStr = config?.relationship?.startDate;
    const startMs = startStr
      ? new Date(startStr).getTime()
      : new Date('2025-10-27T00:00:00').getTime();
    const d = Math.floor((Date.now() - startMs) / 86400000);
    setDays(isNaN(d) || d < 0 ? 0 : d);
  }, [config?.relationship?.startDate]);

  const startDate = config?.relationship?.startDate
    ? new Date(config.relationship.startDate).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '27 de outubro de 2025';

  const partner1 = config?.couple?.partner1?.name || 'Você';
  const partner2 = config?.couple?.partner2?.name || '';

  return (
    <div className="flex-1 relative flex flex-col items-center justify-center text-center overflow-hidden p-6">
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          background:
            'radial-gradient(ellipse at top, #4f1787 0%, #1a0533 40%, #09090b 100%)',
        }}
      />
      <div
        className="absolute inset-0 -z-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 80% 80%, #be185d 0%, transparent 60%)',
        }}
      />

      {/* Stars scatter */}
      <div className="absolute inset-0 pointer-events-none -z-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="z-10 flex flex-col items-center gap-6">
        {/* Name tag */}
        {partner2 && (
          <p className="text-white/50 text-xs tracking-[0.3em] uppercase">
            {partner1} & {partner2}
          </p>
        )}

        {/* Main title */}
        <h1
          className="font-black uppercase leading-none"
          style={{
            fontSize: 'clamp(3.5rem, 18vw, 7rem)',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #fff 0%, #d8b4fe 40%, #f9a8d4 80%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(192,132,252,0.5))',
          }}
        >
          Nossa
          <br />
          História
        </h1>

        {/* Days counter */}
        <div className="flex flex-col items-center">
          <span
            className="font-black leading-none"
            style={{
              fontSize: 'clamp(4.5rem, 22vw, 9rem)',
              background: 'linear-gradient(180deg, #fff 0%, #c084fc 50%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 40px rgba(240,60,160,0.8))',
            }}
          >
            {days.toLocaleString('pt-BR')}
          </span>
          <span className="text-white/40 text-xs tracking-[0.3em] uppercase mt-1">Dias Juntos</span>
          <span className="text-white/20 text-[10px] mt-2">Desde {startDate}</span>
        </div>

        {/* Play button */}
        <button
          onClick={onStart}
          disabled={!isReady}
          className="mt-4 retro-v2-btn-play px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest text-white transition-transform active:scale-95 disabled:opacity-50 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #db2777)',
            boxShadow: '0 0 40px rgba(219,39,119,0.5)',
          }}
        >
          {isReady ? '▶  Começar' : 'Carregando...'}
        </button>
      </div>
    </div>
  );
}
