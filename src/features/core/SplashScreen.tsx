import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
  title?: string;
}

// Estrelas estáticas (sem Math.random no render)
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  size: ((i * 7 + 3) % 25) / 10 + 1,
  top: ((i * 37 + 11) % 100),
  left: ((i * 53 + 7) % 100),
  opacity: ((i * 19 + 3) % 50) / 100 + 0.08,
  delay: ((i * 41) % 30) / 10,
  duration: ((i * 23 + 5) % 20) / 10 + 2,
}));

export function SplashScreen({
  onComplete,
  title = 'Kevin & Iara',
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  // Extrai os dois nomes do título (formato "Nome1 & Nome2")
  const parts = title.split('&').map(s => s.trim());
  const name1 = parts[0] || 'Kevin';
  const name2 = parts[1] || 'Iara';

  useEffect(() => {
    // Barra de progresso: sobe de 0 a 100 em ~2.2s com easing
    const duration = 2200;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const raw = Math.min(elapsed / duration, 1);
      // Easing: sobe rápido, desacelera no final
      const eased = 1 - Math.pow(1 - raw, 3);
      setProgress(Math.round(eased * 100));

      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        // Progresso chegou a 100 → inicia fade out após 400ms
        setTimeout(() => {
          setPhase('out');
          setTimeout(onComplete, 700);
        }, 400);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase === 'in' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, #3b0764 0%, #0f0318 50%, #020004 100%)' }}
        >
          {/* Estrelas de fundo */}
          <div className="absolute inset-0 pointer-events-none">
            {STARS.map((s) => (
              <motion.div
                key={s.id}
                className="absolute rounded-full bg-white"
                style={{
                  width: s.size,
                  height: s.size,
                  top: `${s.top}%`,
                  left: `${s.left}%`,
                  opacity: s.opacity,
                }}
                animate={{ opacity: [s.opacity, s.opacity * 3, s.opacity] }}
                transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>

          {/* Glow decorativo */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(219,39,119,0.18) 0%, transparent 65%)' }}
          />

          {/* Conteúdo central */}
          <div className="relative z-10 flex flex-col items-center gap-8 px-8 w-full max-w-sm">

            {/* Nomes do casal */}
            <div className="flex flex-col items-center gap-1 w-full">
              {/* Nome 1 */}
              <motion.p
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-white/90 font-black uppercase tracking-[0.15em] w-full text-center"
                style={{ fontSize: 'clamp(1.6rem, 9vw, 2.8rem)', letterSpacing: '0.12em' }}
              >
                {name1}
              </motion.p>

              {/* Coração central com glow */}
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.55, type: 'spring', stiffness: 200, damping: 12 }}
                className="relative flex items-center justify-center my-1"
              >
                {/* Glow pulsante atrás */}
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 64, height: 64, background: 'radial-gradient(circle, rgba(236,72,153,0.5) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0.15, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Coração SVG customizado */}
                <motion.svg
                  width="40" height="40" viewBox="0 0 24 24" fill="none"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <defs>
                    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
                    fill="url(#heartGrad)"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(236,72,153,0.8))' }}
                  />
                </motion.svg>
              </motion.div>

              {/* Nome 2 */}
              <motion.p
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
                className="font-black uppercase w-full text-center"
                style={{
                  fontSize: 'clamp(1.6rem, 9vw, 2.8rem)',
                  letterSpacing: '0.12em',
                  background: 'linear-gradient(to right, #f9a8d4, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {name2}
              </motion.p>
            </div>

            {/* Separador decorativo */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="w-12 h-px bg-white/20"
            />

            {/* Barra de progresso */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.3 }}
              className="w-full flex flex-col items-center gap-2"
            >
              {/* Track */}
              <div className="w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(to right, #ec4899, #a855f7)',
                    boxShadow: '0 0 8px rgba(236,72,153,0.6)',
                    transition: 'width 0.05s linear',
                  }}
                />
              </div>

              {/* Texto de carregamento */}
              <p className="text-white/30 text-[10px] tracking-[0.3em] uppercase font-medium">
                {progress < 100 ? 'carregando' : 'pronto ✦'}
              </p>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
