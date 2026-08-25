import { useEffect, useRef, useState } from 'react';
import { Heart, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { useThemeStore } from '../store/useThemeStore';
import { PlaylistTabs } from '../features/playlist/PlaylistTabs';
import { AlbumCarousel } from '../features/album/AlbumCarousel';
import { TimelineModal } from '../features/timeline/TimelineModal';
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TimeLeft {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
}

function getTimeLeft(startDate: Date): TimeLeft {
  const now = new Date();
  const years = differenceInYears(now, startDate);
  const wy = new Date(startDate);
  wy.setFullYear(wy.getFullYear() + years);
  const months = differenceInMonths(now, wy);
  const wm = new Date(wy);
  wm.setMonth(wm.getMonth() + months);
  const days = differenceInDays(now, wm);
  const wd = new Date(wm);
  wd.setDate(wd.getDate() + days);
  const hours = differenceInHours(now, wd);
  const wh = new Date(wd);
  wh.setHours(wh.getHours() + hours);
  const minutes = differenceInMinutes(now, wh);
  const wmin = new Date(wh);
  wmin.setMinutes(wmin.getMinutes() + minutes);
  const seconds = differenceInSeconds(now, wmin);
  const totalDays = differenceInDays(now, startDate);
  return { years, months, days, hours, minutes, seconds, totalDays };
}

// ─── Data ────────────────────────────────────────────────────────────────────
const LOVE_MESSAGES = [
  'Você é o melhor capítulo da minha vida.',
  'Com você, todo dia é um motivo pra sorrir.',
  'Meu amor por você cresce a cada segundo que passa.',
  'Você me faz querer ser alguém melhor todos os dias.',
  'A distância só me deu mais certeza de que é você que eu quero.',
  'Seu sorriso é o que mais gosto de ver nesse mundo.',
  'Você transformou completamente o meu 2025 — para sempre melhor.',
  'Não importa as constelações nem o idioma, eu vou te amar de qualquer maneira.',
];

const ACROSTIC = [
  {
    letter: 'I',
    color: 'text-[var(--theme-primary)]',
    short: 'ncrível — você é boa em tudo que faz',
    long: 'Sua dedicação, seu esforço e o carinho fazem eu admirar você cada dia mais. Estar ao seu lado me inspira a querer ser alguém melhor todos os dias.',
  },
  {
    letter: 'A',
    color: 'text-[var(--theme-secondary)]',
    short: 'mor — você me mostrou o que é o verdadeiro amor',
    long: 'Com você, amar deixou de ser apenas uma palavra e virou sentimento, cuidado, reciprocidade e paz. Seu amor melhorou a minha vida em todos os sentidos.',
  },
  {
    letter: 'R',
    color: 'text-[var(--theme-accent)]',
    short: 'ara — não é fácil encontrar alguém como você',
    long: 'Quanto mais eu te conheço, mais percebo o quão única e especial você é. Você é como uma joia rara: difícil de encontrar, impossível de substituir.',
  },
  {
    letter: 'A',
    color: 'text-[var(--theme-primary)]',
    short: 'utêntica — a sua essência é única',
    long: 'O seu jeitinho, sua personalidade e a forma sincera com que você vive a vida me deixam completamente apaixonado. Você consegue ser diferente de todo mundo da melhor forma possível.',
  },
];

import type { Variants } from 'framer-motion';

// ─── Animations ──────────────────────────────────────────────────────────────
const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0, 0, 0.2, 1] } },
};

// ─── Meteor Shower ──────────────────────────────────────────────────────────
const METEOR_COLORS = [
  'rgba(157, 78, 221, 0.8)', // Roxo neon
  'rgba(224, 170, 255, 0.8)', // Lilás claro
  'rgba(0, 245, 255, 0.8)',  // Ciano/Azul claro mágico
  'rgba(255, 255, 255, 0.9)', // Branco estrela
  'rgba(72, 12, 168, 0.8)'   // Violeta profundo
];

const METEORS = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 50}%`,
  left: `${Math.random() * 100}%`,
  fallDuration: `${Math.random() * 4 + 3}s`, // 3s a 7s
  delay: `${Math.random() * 12}s`, // 0s a 12s
  color: METEOR_COLORS[Math.floor(Math.random() * METEOR_COLORS.length)],
}));

function MeteorShower() {
  return (
    <div className="meteor-shower">
      {METEORS.map((m) => (
        <div
          key={m.id}
          className="meteor"
          style={{
            top: m.top,
            left: m.left,
            animationDuration: m.fallDuration,
            animationDelay: m.delay,
            '--meteor-color': m.color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Falling Hearts ──────────────────────────────────────────────────────────
const HEARTS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 25 + 20, 
  fallDuration: `${Math.random() * 12 + 12}s`, 
  delay: `${Math.random() * 15}s`, 
  opacity: Math.random() * 0.2 + 0.1, 
}));

function FallingHearts() {
  return (
    <div className="falling-hearts">
      {HEARTS.map((h) => (
        <div
          key={h.id}
          className="falling-heart"
          style={{
            left: h.left,
            fontSize: `${h.size}px`,
            animationDuration: h.fallDuration,
            animationDelay: h.delay,
            color: 'var(--theme-primary)',
            opacity: h.opacity,
            filter: `drop-shadow(0 0 ${h.size / 2}px var(--theme-primary))`,
          }}
        >
          ♥
        </div>
      ))}
    </div>
  );
}

// ─── Aurora Borealis ──────────────────────────────────────────────────────────

// Paleta de cores completas para as cortinas (rgba fechado)
const AURORA_PALETTE = [
  { r: 0,   g: 255, b: 180 }, // Verde-teal brilhante
  { r: 0,   g: 220, b: 255 }, // Ciano ártico
  { r: 168, g: 85,  b: 247 }, // Violeta profundo
  { r: 0,   g: 255, b: 150 }, // Verde esmeralda
  { r: 100, g: 200, b: 255 }, // Azul-gelo
  { r: 220, g: 80,  b: 255 }, // Rosa polar
  { r: 0,   g: 255, b: 200 }, // Teal puro (aurora central)
  { r: 50,  g: 180, b: 255 }, // Azul celeste
];

const AURORA_CURTAINS = Array.from({ length: 5 }, (_, i) => { // Reduzido de 8 para 5
  const { r, g, b } = AURORA_PALETTE[i % AURORA_PALETTE.length];
  const op = [0.55, 0.45, 0.4, 0.5, 0.35][i];
  const bl = [25, 20, 30, 15, 35][i]; // Blur substancialmente reduzido (era 40-70)
  return {
    id: i,
    left: `${5 + i * 18 + (Math.random() * 8 - 4)}%`, // Espalhamento ajustado para menos elementos
    width: `${25 + Math.random() * 20}%`, // Levemente mais largas para compensar menos elementos
    height: `${38 + Math.random() * 32}%`,
    // Gradiente: bottom = cor viva, topo = transparente
    background: `linear-gradient(to top, rgba(${r},${g},${b},${op}) 0%, rgba(${r},${g},${b},${(op * 0.5).toFixed(2)}) 45%, transparent 100%)`,
    filter: `blur(${bl}px)`,
    duration: `${7 + Math.random() * 8}s`,
    delay: `${Math.random() * 10}s`,
    opacity: op,
  };
});

const AURORA_RAY_PALETTE = [
  { r: 0,   g: 255, b: 180 },
  { r: 0,   g: 220, b: 255 },
  { r: 168, g: 85,  b: 247 },
  { r: 0,   g: 255, b: 150 },
  { r: 100, g: 200, b: 255 },
  { r: 220, g: 80,  b: 255 },
];

const AURORA_RAYS = Array.from({ length: 6 }, (_, i) => { // Reduzido de 12 para 6
  const { r, g, b } = AURORA_RAY_PALETTE[i % AURORA_RAY_PALETTE.length];
  const op = parseFloat((0.55 + Math.random() * 0.3).toFixed(2));
  const bl = parseFloat((4 + Math.random() * 5).toFixed(1)); // Blur reduzido
  return {
    id: i,
    left: `${8 + i * 15 + Math.random() * 5}%`, // Ajustado
    width: `${0.8 + Math.random() * 1.5}%`,
    height: `${25 + Math.random() * 45}%`,
    background: `linear-gradient(to top, rgba(${r},${g},${b},${op}) 0%, rgba(${r},${g},${b},${(op * 0.35).toFixed(2)}) 55%, transparent 100%)`,
    filter: `blur(${bl}px)`,
    duration: `${5 + Math.random() * 7}s`,
    delay: `${Math.random() * 12}s`,
    opacity: op,
  };
});

function AuroraBorealis() {
  return (
    <div className="aurora-bg">
      {/* Base horizon glow */}
      <div className="aurora-glow-base" />

      {/* Cortinas largas — efeito principal */}
      {AURORA_CURTAINS.map((c) => (
        <div
          key={c.id}
          className="aurora-curtain"
          style={{
            left: c.left,
            width: c.width,
            height: c.height,
            background: c.background,
            filter: c.filter,
            animationDuration: c.duration,
            animationDelay: c.delay,
            '--aurora-opacity': c.opacity,
          } as React.CSSProperties}
        />
      ))}

      {/* Raios finos — filamentos de luz */}
      {AURORA_RAYS.map((r) => (
        <div
          key={r.id}
          className="aurora-ray"
          style={{
            left: r.left,
            width: r.width,
            height: r.height,
            background: r.background,
            filter: r.filter,
            animationDuration: r.duration,
            animationDelay: r.delay,
            '--ray-opacity': r.opacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Magic Winter ─────────────────────────────────────────────────────────────
function FrostVignette() {
  return <div className="frost-vignette" />;
}

// ─── Particles ───────────────────────────────────────────────────────────────
function ParticleCanvas({ theme }: { theme: 'meteors' | 'hearts' | 'aurora' | 'snow' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;

    // Guarda tamanho anterior da janela (iniciado negativo para forçar o primeiro resize)
    let lastWidth = -1;
    let lastHeight = -1;

    if (theme === 'snow') {
      // ── Neve Mágica com Sprites Pre-renderizados e Física (Mouse Repulsion) ──
      const snowFlakes: {
        x: number; y: number; r: number;
        speedY: number; speedX: number;
        sway: number; phase: number;
        type: 'orb' | 'flake' | 'dot';
      }[] = [];

      let mouseX = -1000;
      let mouseY = -1000;
      const onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
      const onTouchMove = (e: TouchEvent) => { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove, { passive: true });

      // Otimização Extrema: Pré-renderizar os designs em mini-canvas (Sprites)
      // Evita recalcular arcos e gradientes milhares de vezes por segundo na GPU.
      const createSprite = (type: 'orb' | 'flake' | 'dot') => {
        const c = document.createElement('canvas');
        const cCtx = c.getContext('2d')!;
        if (type === 'orb') {
          // Esfera grande e desfocada (Bokeh para primeiro plano)
          c.width = 40; c.height = 40;
          const grad = cCtx.createRadialGradient(20, 20, 0, 20, 20, 20);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          cCtx.fillStyle = grad;
          cCtx.fillRect(0, 0, 40, 40);
        } else if (type === 'flake') {
          // Cristal de Neve clássico com 6 pontas (Meio plano)
          c.width = 24; c.height = 24;
          cCtx.translate(12, 12);
          cCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          cCtx.lineWidth = 1.5;
          cCtx.lineCap = 'round';
          for (let i = 0; i < 6; i++) {
            cCtx.beginPath();
            cCtx.moveTo(0, 0);
            cCtx.lineTo(0, -9);
            cCtx.moveTo(0, -4);
            cCtx.lineTo(-3, -7);
            cCtx.moveTo(0, -4);
            cCtx.lineTo(3, -7);
            cCtx.stroke();
            cCtx.rotate(Math.PI / 3);
          }
        } else {
          // Ponto simples (Plano de fundo distante)
          c.width = 4; c.height = 4;
          cCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          cCtx.beginPath(); cCtx.arc(2, 2, 2, 0, Math.PI * 2); cCtx.fill();
        }
        return c;
      };

      const sprites = {
        orb: createSprite('orb'),
        flake: createSprite('flake'),
        dot: createSprite('dot'),
      };

      const init = () => {
        snowFlakes.length = 0;
        // 110 flocos variados e super leves (quantidade reduzida para max FPS)
        for (let i = 0; i < 110; i++) {
          const type = i < 12 ? 'orb' : i < 40 ? 'flake' : 'dot';
          const r = type === 'orb' ? Math.random() * 6 + 10 : type === 'flake' ? Math.random() * 4 + 4 : Math.random() * 1.5 + 0.5;
          snowFlakes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r,
            speedY: type === 'orb' ? Math.random() * 1.2 + 1.2 : type === 'flake' ? Math.random() * 0.8 + 0.6 : Math.random() * 0.4 + 0.2,
            speedX: 0,
            sway: Math.random() * 0.5 + 0.2,
            phase: Math.random() * Math.PI * 2,
            type,
          });
        }
      };

      const resize = () => {
        if (canvas.width !== 0 && window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 150) return;
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
      };

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        snowFlakes.forEach((f) => {
          f.phase += 0.01;
          
          let targetSpeedX = Math.sin(f.phase) * f.sway;

          // Física de Repulsão (Super Otimizada sem Math.sqrt em todos os frames)
          const dx = f.x - mouseX;
          const dy = f.y - mouseY;
          const distSq = dx * dx + dy * dy;
          const pushRadiusSq = 14400; // Equivalente a 120px * 120px
          
          if (distSq < pushRadiusSq) {
            const dist = Math.sqrt(distSq) || 1;
            const force = (120 - dist) / 120;
            targetSpeedX += (dx / dist) * force * 4; 
            f.y += (dy / dist) * force * 1.5; 
          }

          f.speedX += (targetSpeedX - f.speedX) * 0.05;
          f.x += f.speedX;
          f.y += f.speedY;

          // Reposiciona se sair da tela
          if (f.y > canvas.height + f.r) { f.y = -f.r; f.x = Math.random() * canvas.width; }
          if (f.x > canvas.width + f.r) f.x = -f.r;
          if (f.x < -f.r) f.x = canvas.width + f.r;

          // Desenho ultra rápido com drawImage (Sprites)
          const sprite = sprites[f.type];
          ctx.drawImage(sprite, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
        });
        animId = requestAnimationFrame(draw);
      };
      
      window.addEventListener('resize', resize);
      resize();
      draw();
      
      return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('touchmove', onTouchMove);
        cancelAnimationFrame(animId);
      };
    }

    if (theme === 'aurora') {
      // ── Estrelas cintilantes para o tema aurora (Otimizado) ──
      const stars: {
        x: number;
        y: number;
        r: number;
        baseAlpha: number;
        speed: number;
        phase: number;
        color: string;
      }[] = [];
      const starColors = [
        'rgba(255, 255, 255,',
        'rgba(200, 240, 255,',
        'rgba(180, 255, 220,',
        'rgba(220, 220, 255,',
      ];
      let time = 0;

      const init = () => {
        stars.length = 0; // Limpa ao redimensionar
        for (let i = 0; i < 80; i++) {
          stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.75,
            r: Math.random() * 1.5 + 0.3,
            baseAlpha: Math.random() * 0.5 + 0.2,
            speed: Math.random() * 0.6 + 0.2,
            phase: Math.random() * Math.PI * 2,
            color: starColors[Math.floor(Math.random() * starColors.length)],
          });
        }
      };

      const resize = () => {
        // Ignora saltos verticais pequenos típicos da barra de endereço no mobile
        if (canvas.width !== 0 && window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 150) {
          return;
        }
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init(); // Repopula cobrindo o novo tamanho
      };

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        time += 0.016;
        stars.forEach((s) => {
          const alpha = s.baseAlpha * (0.4 + 0.6 * Math.abs(Math.sin(time * s.speed + s.phase)));
          ctx.fillStyle = `${s.color}${alpha})`;
          ctx.fillRect(s.x, s.y, s.r * 2, s.r * 2);
        });
        animId = requestAnimationFrame(draw);
      };
      window.addEventListener('resize', resize);
      resize();
      draw();
      return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animId);
      };
    }

    // ── Partículas flutuantes para meteoros e corações ──
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      color: string;
    }[] = [];

    const colors = theme === 'meteors'
      ? ['rgba(255, 255, 255,', 'rgba(224, 170, 255,', 'rgba(199, 125, 255,', 'rgba(157, 78, 221,']
      : ['rgba(255, 0, 85,', 'rgba(255, 42, 122,', 'rgba(255, 77, 148,'];

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.5 - 0.1,
          r: Math.random() * 2.5 + 0.5,
          alpha: Math.random() * 0.4 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const resize = () => {
      // Ignora saltos verticais pequenos (barra de endereço)
      if (canvas.width !== 0 && window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 150) {
        return;
      }
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
      
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });
      animId = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', resize);
    resize();
    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, [theme]);
  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-screen h-[100lvh] pointer-events-none z-0 opacity-60" />;
}

// ─── Counter Box ──────────────────────────────────────────────────────────────
function CounterBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="relative w-16 md:w-20 px-2 py-4 rounded-xl border border-[var(--theme-primary)]/50 backdrop-blur-xl text-center overflow-hidden transition-all duration-300 shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.4),inset_0_0_15px_rgba(var(--theme-primary-rgb),0.15)] hover:shadow-[0_0_40px_rgba(var(--theme-primary-rgb),0.7),inset_0_0_25px_rgba(var(--theme-primary-rgb),0.3)] bg-white/[0.03]">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--theme-primary)]/20 to-transparent pointer-events-none" />
        <span
          className="block font-bold font-mono text-white leading-none"
          style={{
            fontSize: 'clamp(1.4rem, 4vw, 2.5rem)',
            textShadow: '0 0 10px var(--theme-primary), 0 0 20px var(--theme-primary)',
          }}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span
        className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold"
        style={{ color: 'var(--theme-accent)', textShadow: '0 0 8px rgba(255,77,148,0.5)' }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Section Divider ─────────────────────────────────────────────────────────
function SectionLabel({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex justify-center">
      <span className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-[var(--theme-primary)]/10 text-white border border-[var(--theme-primary)]/50 flex items-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(var(--theme-primary-rgb),0.4)]">
        <span style={{ textShadow: '0 0 10px var(--theme-primary)' }}>{emoji}</span> {text}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { config } = useSiteConfigStore();
  const { activeTheme } = useThemeStore();
  const [time, setTime] = useState<TimeLeft | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [openAcrostic, setOpenAcrostic] = useState<number | null>(null);

  // Force the correct CSS variables whenever activeTheme changes (or on first mount),
  // overriding anything that the store/Firestore may have applied.
  useEffect(() => {
    const THEMES = {
      meteors: {
        primary: '#9d4edd',
        primaryRgb: '157, 78, 221',
        secondary: '#e0aaff',
        accent: '#c77dff',
      },
      hearts: {
        primary: '#ff0055',
        primaryRgb: '255, 0, 85',
        secondary: '#ff4d94',
        accent: '#ff2a7a',
      },
      aurora: {
        primary: '#00ffc8',
        primaryRgb: '0, 255, 200',
        secondary: '#a855f7',
        accent: '#22d3ee',
      },
      snow: {
        primary: '#00f0ff',
        primaryRgb: '0, 240, 255',
        secondary: '#ffffff',
        accent: '#4a90e2',
      },
    };

    const t = THEMES[activeTheme];
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', t.primary);
    root.style.setProperty('--theme-primary-rgb', t.primaryRgb);
    root.style.setProperty('--theme-secondary', t.secondary);
    root.style.setProperty('--theme-accent', t.accent);
  }, [activeTheme]);

  useEffect(() => {
    if (!config?.relationship.startDate) return;
    const start = new Date(config.relationship.startDate + 'T00:00:00');
    const tick = () => setTime(getTimeLeft(start));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [config?.relationship.startDate]);

  if (!config) return null;

  const { partner1, partner2 } = config.couple;

  return (
    <div
      className="relative -mt-0 min-h-[100lvh] text-slate-200 selection:bg-[var(--theme-primary)]/40 selection:text-white overflow-x-hidden"
      style={{
        background:
          activeTheme === 'meteors'
            ? 'linear-gradient(135deg, #090314 0%, #1a0636 50%, #05010a 100%)'
            : activeTheme === 'hearts'
            ? '#05050A'
            : activeTheme === 'aurora'
            ? 'linear-gradient(180deg, #000a0f 0%, #00110d 35%, #001a14 65%, #000508 100%)'
            : 'linear-gradient(180deg, #020412 0%, #0a1526 50%, #07192f 100%)', // snow background
      }}
    >
      {/* ══════════════════════════ BACKGROUND NEON LIGHTS ══════════════════════════ */}
      <div className="fixed top-0 left-0 w-screen h-[100lvh] z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[var(--theme-primary)]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--theme-accent)]/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[var(--theme-primary)]/10 blur-[150px] rounded-full" />
      </div>

      {/* ══════════════════════════ PARTICLES (SITE-WIDE) ══════════════════════════ */}
      <ParticleCanvas theme={activeTheme} />

      {/* ══════════════════════════ DYNAMIC EFFECTS ══════════════════════════ */}
      {activeTheme === 'meteors' ? (
        <MeteorShower />
      ) : activeTheme === 'hearts' ? (
        <FallingHearts />
      ) : activeTheme === 'aurora' ? (
        <AuroraBorealis />
      ) : (
        <FrostVignette />
      )}

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 text-center space-y-12 py-16 max-w-2xl mx-auto"
        >
          <div className="flex justify-center">
            <div className="relative">
              <Heart
                className="w-24 h-24 text-[var(--theme-secondary)] fill-[var(--theme-secondary)]"
                style={{ filter: 'drop-shadow(0 0 30px var(--theme-primary))' }}
              />
              <Heart className="w-24 h-24 text-[var(--theme-secondary)] fill-[var(--theme-secondary)] absolute inset-0 animate-ping opacity-50" />
            </div>
          </div>

          <div className="space-y-4">
            <h1
              className="font-serif font-bold leading-none tracking-tight"
              style={{
                fontSize: 'clamp(4rem, 15vw, 7.5rem)',
                color: '#fff',
                textShadow: '0 0 15px var(--theme-primary), 0 0 30px var(--theme-primary), 0 0 60px rgba(157, 78, 221, 0.8)',
              }}
            >
              {partner1.name}
            </h1>
            <p
              className="text-5xl text-white"
              style={{
                fontFamily: "'Dancing Script', cursive",
                textShadow: '0 0 15px var(--theme-primary), 0 0 30px var(--theme-primary)',
              }}
            >
              &amp;
            </p>
            <h1
              className="font-serif font-bold leading-none tracking-tight"
              style={{
                fontSize: 'clamp(4rem, 15vw, 7.5rem)',
                color: '#fff',
                textShadow: '0 0 15px var(--theme-primary), 0 0 30px var(--theme-primary), 0 0 60px rgba(157, 78, 221, 0.8)',
              }}
            >
              {partner2.name}
            </h1>
          </div>

          <p
            className="text-xl md:text-2xl text-white italic leading-relaxed px-4 font-light"
            style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
          >
            "Você é o melhor capítulo da minha vida"
          </p>

          {time && time.totalDays > 0 && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-flex flex-col items-center gap-1 px-10 py-5 rounded-3xl border-2 border-[var(--theme-primary)]/60 bg-white/[0.02] backdrop-blur-xl shadow-[0_0_40px_rgba(var(--theme-primary-rgb),0.4),inset_0_0_20px_rgba(var(--theme-primary-rgb),0.2)]"
            >
              <span
                className="font-bold text-white font-mono"
                style={{
                  fontSize: 'clamp(3rem, 10vw, 5rem)',
                  lineHeight: 1,
                  textShadow: '0 0 15px var(--theme-primary), 0 0 30px var(--theme-primary)',
                }}
              >
                {time.totalDays.toLocaleString('pt-BR')}
              </span>
              <span
                className="text-sm uppercase tracking-[0.3em] text-[var(--theme-secondary)] font-bold"
                style={{ textShadow: '0 0 10px var(--theme-secondary)' }}
              >
                dias juntos
              </span>
            </motion.div>
          )}

          <div className="flex flex-col items-center gap-3 pt-12 opacity-80">
            <span
              className="text-sm uppercase tracking-[0.2em] font-bold text-[var(--theme-secondary)]"
              style={{ textShadow: '0 0 10px var(--theme-secondary)' }}
            >
              Explore
            </span>
            <ChevronDown
              className="w-8 h-8 text-[var(--theme-primary)] animate-bounce"
              style={{ filter: 'drop-shadow(0 0 15px var(--theme-primary))' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════ CARTA DE AMOR ══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="relative py-24 px-4 z-10"
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <SectionLabel emoji="💌" text="Uma Carta Para Você" />
          </div>

          <div className="relative rounded-[2.5rem] overflow-hidden border border-[var(--theme-primary)]/30 bg-white/[0.03] backdrop-blur-2xl shadow-[0_0_50px_rgba(var(--theme-primary-rgb),0.2),inset_0_0_25px_rgba(var(--theme-primary-rgb),0.08)] transition-all duration-500 hover:border-[var(--theme-primary)]/50 hover:shadow-[0_0_70px_rgba(var(--theme-primary-rgb),0.35),inset_0_0_35px_rgba(var(--theme-primary-rgb),0.15)] group">

            {/* ── Imagem de Capa ── */}
            <div className="relative w-full aspect-[16/10] overflow-hidden">
              <img
                src="/capa_principal.jpg"
                alt="Kevin & Iara"
                className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110"
              />
              {/* Gradient overlay from bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/40 to-transparent" />
              {/* Neon glow overlay at edges */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-primary)]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {/* Side vignette */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,#05050A_100%)] opacity-60" />

              {/* Neon frame line at bottom of image */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent shadow-[0_0_15px_var(--theme-primary)]" />
            </div>

            {/* ── Conteúdo da Carta ── */}
            <div className="relative px-6 pb-8 pt-6 md:p-14 md:-mt-6">
              <p
                className="text-2xl md:text-3xl font-bold text-white mb-8 relative z-10"
                style={{
                  fontFamily: "'Dancing Script', cursive",
                  textShadow: '0 0 15px rgba(var(--theme-primary-rgb),0.6)',
                }}
              >
                {partner2.name},
              </p>

              <div className="space-y-6 text-base md:text-lg leading-relaxed text-slate-200/90 font-light">
                <p>
                  Posso dizer com toda certeza que encontrar alguém como você não é algo fácil. Uma garota linda por dentro e por fora, que chegou na minha vida e transformou completamente o meu 2025.
                </p>
                <p>
                  Você é quem me inspira todos os dias, quem me traz força, paz e alegria mesmo nos momentos difíceis. Com você, a vida ficou mais leve, mais bonita e mais verdadeira. A distância só me deu mais certeza de que é você quem eu quero ao meu lado.
                </p>
              </div>

              <div className="mt-10 pt-8 border-t border-[var(--theme-primary)]/20 text-right">
                <p className="text-sm text-slate-400 uppercase tracking-widest mb-2">Com todo meu amor,</p>
                <p
                  className="text-3xl font-bold text-white"
                  style={{
                    fontFamily: "'Dancing Script', cursive",
                    textShadow: '0 0 15px var(--theme-primary), 0 0 30px var(--theme-primary)',
                  }}
                >
                  {partner1.name} 💕
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════ CONTADOR ══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="relative py-24 px-4 overflow-hidden z-10"
      >
        <div className="max-w-3xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <SectionLabel emoji="⏱" text="Tempo Juntos" />
            <h2
              className="text-4xl md:text-5xl font-serif font-bold text-white mt-4"
              style={{ textShadow: '0 0 20px var(--theme-primary)' }}
            >
              Contando Cada Segundo
            </h2>
          </div>

          {time && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-x-4 md:gap-x-12 gap-y-8 p-6 md:p-8 rounded-[2rem] border border-[var(--theme-primary)]/30 bg-white/[0.02] backdrop-blur-2xl shadow-[0_0_50px_rgba(var(--theme-primary-rgb),0.15)] justify-items-center">
              <CounterBox value={time.years} label="Anos" />
              <CounterBox value={time.months} label="Meses" />
              <CounterBox value={time.days} label="Dias" />
              
              <CounterBox value={time.hours} label="Horas" />
              <CounterBox value={time.minutes} label="Min" />
              <CounterBox value={time.seconds} label="Seg" />
            </div>
          )}
        </div>
      </motion.section>

      {/* ══════════════════════════ TRILHA SONORA ══════════════════════════ */}
      {config.features.enableMusic && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUpVariant}
          className="py-24 overflow-hidden relative z-10"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 px-4 mb-12">
            <SectionLabel emoji="🎵" text="Nossa Trilha Sonora" />
            <h2
              className="text-4xl md:text-5xl font-serif font-bold text-white mt-4"
              style={{ textShadow: '0 0 20px var(--theme-primary)' }}
            >
              Escolha a Playlist
            </h2>
          </div>
          <div className="relative z-10 px-4 max-w-4xl mx-auto">
            <PlaylistTabs />
          </div>
        </motion.section>
      )}

      {/* ══════════════════════════ ÁLBUNS ══════════════════════════ */}
      {config.features.enableAlbum && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUpVariant}
          className="py-24 overflow-hidden z-10 relative"
        >
          <div className="max-w-3xl mx-auto text-center space-y-4 px-4 mb-12">
            <SectionLabel emoji="📸" text="Nossas Memórias" />
            <h2
              className="text-4xl md:text-5xl font-serif font-bold text-white mt-4"
              style={{ textShadow: '0 0 20px var(--theme-primary)' }}
            >
              Nosso Álbum
            </h2>
          </div>
          <div className="drop-shadow-[0_0_40px_rgba(var(--theme-primary-rgb),0.3)]">
            <AlbumCarousel />
          </div>
        </motion.section>
      )}

      {/* ══════════════════════════ ACRÓSTICO ══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="py-24 px-4 z-10 relative"
      >
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <SectionLabel emoji="✨" text="Acróstico" />
            <h2
              className="text-4xl md:text-5xl font-serif font-bold text-white mt-4"
              style={{ textShadow: '0 0 20px var(--theme-primary)' }}
            >
              I A R A
            </h2>
          </div>

          <div className="space-y-6">
            {ACROSTIC.map((line, index) => (
              <button
                key={index}
                onClick={() => setOpenAcrostic(openAcrostic === index ? null : index)}
                className="w-full text-left rounded-3xl border border-[var(--theme-primary)]/30 bg-white/[0.02] backdrop-blur-xl hover:bg-[var(--theme-primary)]/10 hover:border-[var(--theme-primary)]/60 hover:shadow-[0_0_40px_rgba(var(--theme-primary-rgb),0.3)] transition-all duration-500 overflow-hidden group"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="flex items-center gap-6 p-6 md:p-8">
                  <span
                    className={`text-5xl md:text-6xl font-bold font-serif shrink-0 ${line.color} transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_currentColor]`}
                    style={{ textShadow: '0 0 20px currentColor', opacity: 1 }}
                  >
                    {line.letter}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-white font-medium text-xl md:text-2xl"
                      style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}
                    >
                      <span className={`font-bold ${line.color}`}>{line.letter}</span>
                      {line.short}
                    </p>
                    {openAcrostic === index && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-slate-300 text-base md:text-lg mt-4 leading-relaxed font-light"
                      >
                        {line.long}
                      </motion.p>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-8 h-8 text-[var(--theme-primary)]/50 shrink-0 transition-all duration-500 group-hover:text-[var(--theme-primary)] ${openAcrostic === index ? 'rotate-180 text-[var(--theme-primary)]' : ''}`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════ MENSAGEM ROMÂNTICA ══════════════════════════ */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="py-24 px-4 z-10 relative"
      >
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-[2.5rem] overflow-hidden border border-[var(--theme-primary)]/40 bg-white/[0.02] backdrop-blur-2xl shadow-[0_0_60px_rgba(var(--theme-primary-rgb),0.25),inset_0_0_30px_rgba(var(--theme-primary-rgb),0.1)] p-10 md:p-16 text-center space-y-8 transition-all duration-500 hover:border-[var(--theme-primary)]/60 hover:shadow-[0_0_80px_rgba(var(--theme-primary-rgb),0.4),inset_0_0_40px_rgba(var(--theme-primary-rgb),0.2)] group">
            <Sparkles
              className="w-12 h-12 text-[var(--theme-primary)] mx-auto"
              style={{ filter: 'drop-shadow(0 0 15px var(--theme-primary))' }}
            />
            <h2
              className="text-3xl md:text-4xl font-serif font-bold text-white"
              style={{ textShadow: '0 0 20px var(--theme-primary)' }}
            >
              Para Minha Princesa
            </h2>

            <p
              className="text-white leading-relaxed text-xl md:text-2xl italic font-light"
              style={{ textShadow: '0 0 10px rgba(255,255,255,0.4)' }}
            >
              "{LOVE_MESSAGES[msgIndex]}"
            </p>

            <div className="flex flex-col gap-2 pt-6">
              <p className="text-slate-300 text-base font-medium uppercase tracking-widest">
                Com todo meu amor,
              </p>
              <p
                className="text-white font-serif text-3xl font-bold"
                style={{ textShadow: '0 0 20px var(--theme-primary), 0 0 40px var(--theme-primary)' }}
              >
                {partner1.name} 💕
              </p>
            </div>

            <button
              onClick={() => setMsgIndex((i) => (i + 1) % LOVE_MESSAGES.length)}
              className="mt-8 inline-flex items-center justify-center gap-3 text-sm text-white font-bold uppercase tracking-wider px-8 py-4 rounded-full bg-[var(--theme-primary)]/20 hover:bg-[var(--theme-primary)]/40 border border-[var(--theme-primary)]/50 hover:border-[var(--theme-primary)] hover:shadow-[0_0_30px_rgba(var(--theme-primary-rgb),0.6)] transition-all duration-300"
              style={{ touchAction: 'manipulation' }}
            >
              <RefreshCw className="w-5 h-5" /> Nova mensagem
            </button>
          </div>
        </div>
      </motion.section>

      {/* ══════════════════════════ NOSSA HISTÓRIA (TIMELINE) ══════════════════════════ */}
      {config.features.enableTimeline && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeUpVariant}
          className="py-24 px-4 text-center space-y-8 z-10 relative"
        >
          <div className="max-w-3xl mx-auto space-y-4">
            <SectionLabel emoji="📖" text="Nossa História" />
            <h2
              className="text-4xl md:text-5xl font-serif font-bold text-white mt-4"
              style={{ textShadow: '0 0 20px var(--theme-primary)' }}
            >
              Cada Momento Importa
            </h2>
          </div>
          <div className="flex justify-center mt-12 drop-shadow-[0_0_40px_rgba(var(--theme-primary-rgb),0.5)] hover:drop-shadow-[0_0_60px_rgba(var(--theme-primary-rgb),0.8)] transition-all duration-500 scale-110">
            <TimelineModal />
          </div>
        </motion.section>
      )}

      {/* Bottom glow */}
      <div className="py-16" />
      <div className="h-2 w-full bg-[var(--theme-primary)] shadow-[0_0_50px_var(--theme-primary),0_0_100px_var(--theme-primary)]" />
    </div>
  );
}
