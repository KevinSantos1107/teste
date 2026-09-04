import { useSiteConfigStore } from '../../../../store/siteConfigStore';
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView } from 'framer-motion';

export function TimeSlide() {
  const { config: siteConfig } = useSiteConfigStore();
  const [hours, setHours] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Detecta quando o slide entra em tela para disparar a animação
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  // Faixas coloridas — pares e ímpares deslizam em direções opostas
  const echoColors = [
    { bg: '#C1175A', text: '#111' }, // Deep Pink
    { bg: '#E65100', text: '#111' }, // Deep Orange
    { bg: '#4A0080', text: '#E5D813' }, // Deep Purple / yellow
    { bg: '#E65100', text: '#111' }, // Deep Orange
    { bg: '#C1175A', text: '#111' }, // Deep Pink
  ];

  useEffect(() => {
    if (!isInView || hasAnimated) return;

    // Calcula as horas com fix de fuso horário
    const startStr = siteConfig?.relationship?.startDate;
    const startMs = startStr
      ? new Date(`${startStr}T12:00:00`).getTime()
      : new Date('2025-10-27T12:00:00').getTime();
    const diffHours = Math.floor((Date.now() - startMs) / (1000 * 60 * 60));
    const targetHours = isNaN(diffHours) || diffHours < 0 ? 0 : diffHours;

    if (targetHours === 0) {
      setHours(0);
      return;
    }

    setHasAnimated(true);

    // Animação estilo Spotify: dispara rápido, freia dramaticamente no final
    const controls = animate(0, targetHours, {
      duration: 3.5,
      ease: [0.16, 1, 0.3, 1], // expoOut — muito rápido no início, suave no fim
      onUpdate: (value) => setHours(Math.round(value)),
    });

    return () => controls.stop();
  }, [isInView, hasAnimated, siteConfig?.relationship?.startDate]);

  const formattedNumber = new Intl.NumberFormat('pt-BR').format(hours);

  return (
    <div
      ref={ref}
      className="flex-1 bg-[#0a0a0a] flex flex-col items-stretch justify-center relative overflow-hidden"
    >
      {/* Faixas coloridas com deslizamento horizontal alternado */}
      <div className="absolute inset-0 flex flex-col">
        {echoColors.map((color, i) => {
          const direction = i % 2 === 0 ? '-120%' : '120%';
          return (
            <motion.div
              key={i}
              className="flex-1 flex items-center overflow-hidden"
              style={{ backgroundColor: color.bg }}
              initial={{ x: direction, opacity: 0 }}
              animate={isInView ? { x: '0%', opacity: 1 } : {}}
              transition={{
                duration: 0.7,
                delay: i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Número desliza junto com a faixa, na direção oposta para profundidade */}
              <motion.span
                className="font-black whitespace-nowrap opacity-85 select-none w-full text-center"
                style={{
                  fontSize: 'clamp(3.5rem, 22vw, 11rem)',
                  lineHeight: 1,
                  color: color.text,
                  letterSpacing: '-0.05em',
                  transform: 'scaleY(1.15)',
                }}
                initial={{ x: i % 2 === 0 ? '15%' : '-15%' }}
                animate={isInView ? { x: '0%' } : {}}
                transition={{ duration: 1.2, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                {formattedNumber}
              </motion.span>
            </motion.div>
          );
        })}
      </div>

      {/* Overlay escuro central com conteúdo */}
      <motion.div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.55) 100%)' }}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        {/* Label "Horas Juntos" */}
        <motion.span
          className="text-white/70 text-xs md:text-sm font-bold mb-3 tracking-[0.25em] uppercase"
          initial={{ opacity: 0, y: -12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Horas Juntos
        </motion.span>

        {/* Número principal grande */}
        <span
          className="text-white font-black tabular-nums"
          style={{
            fontSize: 'clamp(4rem, 18vw, 10rem)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            textShadow: '0 0 60px rgba(255,255,255,0.25)',
          }}
        >
          {formattedNumber}
        </span>

        {/* Frase de impacto — aparece só quando o número parou */}
        <motion.span
          className="text-white/50 text-xs md:text-sm mt-8 flex items-center gap-2 tracking-wide"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 3.0 }}
        >
          Mais que 14% dos casais no mundo <span>✨</span>
        </motion.span>
      </motion.div>
    </div>
  );
}
