import { useEffect, useRef, useState } from 'react';
import { Heart, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  'Cada dia ao seu lado é uma página nova em nosso livro de amor, escrita com sorrisos, carinho e cumplicidade.',
  'Se eu pudesse escolher novamente entre todas as pessoas do mundo, escolheria você, sempre você.',
  'Nos seus olhos encontro meu lugar favorito no mundo, onde posso ser apenas eu e saber que sou amado.',
  'O amor que sinto por você não cabe em palavras, mas transborda em cada gesto, cada olhar, cada momento juntos.',
  'Mesmo de longe, você conseguiu fazer eu me sentir mais amado do que nunca.',
  'Você transformou a distância em mais uma prova de que fomos feitos um para o outro.',
  'Amar você é a coisa mais natural e bonita que já aconteceu na minha vida.',
  'Você chegou na minha vida e, sem perceber, se tornou meu lugar favorito.',
  'Não importa a distância, meu coração sempre encontra o caminho até você.',
  'Com você, até os dias comuns se tornam especiais.',
  'Você é a melhor coincidência que a vida colocou no meu caminho.',
  'Entre tantas pessoas no mundo, foi você quem fez meu coração se sentir em casa.',
  'Seu amor mudou completamente a forma como eu vejo a vida.',
  'Toda vez que penso no futuro, é você que eu imagino ao meu lado.',
  'Você conseguiu ser minha paz mesmo estando quilômetros de distância.',
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
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

// ─── Meteor Shower ──────────────────────────────────────────────────────────

/** 4 tipos de meteoro inspirados na referência visual */
const METEOR_TYPES = [
  { color: 'rgba(255, 90,  30, 0.9)',   tail: 'rgba(255, 50,  0,  0.15)', glow: 'rgba(255, 100, 20, 0.6)'  }, // 🔴 Fogo
  { color: 'rgba(255, 165,  0, 0.85)',  tail: 'rgba(255, 120,  0, 0.12)', glow: 'rgba(255, 180, 30, 0.5)'  }, // 🟠 Brasa
  { color: 'rgba(0,   230, 255, 0.9)',  tail: 'rgba(0,   180, 255, 0.15)', glow: 'rgba(50, 200, 255, 0.6)' }, // 🩵 Gelo
  { color: 'rgba(255, 255, 255, 0.95)', tail: 'rgba(200, 220, 255, 0.12)', glow: 'rgba(200, 220, 255, 0.5)' }, // ⭐ Estelar
];

type MeteorLayer = 'large' | 'mid' | 'small';

const LAYER_CONFIG: Record<MeteorLayer, {
  count: number; len: string; thick: string; head: number;
  speedMin: number; speedMax: number;
}> = {
  large: { count: 8,  len: '220px', thick: '3px', head: 11, speedMin: 4,  speedMax: 8  },
  mid:   { count: 16, len: '140px', thick: '2px', head: 6,  speedMin: 7,  speedMax: 13 },
  small: { count: 12, len: '70px',  thick: '1px', head: 3,  speedMin: 11, speedMax: 19 },
};

function makeMeteor(layer: MeteorLayer, id: number) {
  const cfg   = LAYER_CONFIG[layer];
  const type  = METEOR_TYPES[Math.floor(Math.random() * METEOR_TYPES.length)];
  const speed = cfg.speedMin + Math.random() * (cfg.speedMax - cfg.speedMin);
  const delay = -(Math.random() * speed);
  const angle = 45;
  const top   = `${-20 + Math.random() * 120}%`;
  const left  = `${-20 + Math.random() * 120}%`;

  return {
    id, layer, top, left,
    style: {
      '--len':          cfg.len,
      '--thick':        cfg.thick,
      '--head':         `${cfg.head}px`,
      '--meteor-color': type.color,
      '--tail-color':   type.tail,
      '--glow-color':   type.glow,
      '--angle':        `${angle}deg`,
      '--speed':        `${speed}s`,
      '--delay':        `${delay}s`,
    } as React.CSSProperties,
  };
}

const METEORS = (Object.keys(LAYER_CONFIG) as MeteorLayer[]).flatMap((layer) =>
  Array.from({ length: LAYER_CONFIG[layer].count }, (_, i) => makeMeteor(layer, i))
);

function MeteorShower() {
  return (
    <div className="meteor-shower">
      {METEORS.map((m, idx) => (
        <div
          key={`${m.layer}-${m.id}-${idx}`}
          className={`meteor meteor-${m.layer}`}
          style={{ top: m.top, left: m.left, ...m.style }}
        />
      ))}
    </div>
  );
}


// ─── Falling Hearts ──────────────────────────────────────────────────────────
const HEART_COLORS = ['#ff0055', '#ff4d94', '#ffb3c6', '#ff2a7a', '#ffffff', 'var(--theme-primary)'];
const HEART_VARIANTS = ['solid', 'solid', 'outline', 'glass'] as const;

interface HeartDef {
  id: number;
  layer: 'front' | 'mid' | 'back';
  style: React.CSSProperties;
  variant: typeof HEART_VARIANTS[number];
  color: string;
}

function generateHeart(id: number, layer: 'front' | 'mid' | 'back'): HeartDef {
  const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
  const variant = HEART_VARIANTS[Math.floor(Math.random() * HEART_VARIANTS.length)];
  const scaleMap  = { front: Math.random() * 0.5 + 1.0,  mid: Math.random() * 0.4 + 0.5,  back: Math.random() * 0.3 + 0.25 };
  const speedMap  = { front: Math.random() * 8  + 18,    mid: Math.random() * 12 + 24,     back: Math.random() * 15 + 34   };
  const swayMap   = { front: (Math.random() - 0.5) * 180, mid: (Math.random() - 0.5) * 130, back: (Math.random() - 0.5) * 80 };

  return {
    id,
    layer,
    variant,
    color,
    style: {
      left: `${Math.random() * 100}%`,
      animationDuration: `${speedMap[layer]}s`,
      animationDelay: `-${Math.random() * speedMap[layer]}s`,
      '--sway-x': `${swayMap[layer]}px`,
      '--start-rot': `${(Math.random() - 0.5) * 90}deg`,
      '--base-scale': scaleMap[layer],
    } as React.CSSProperties,
  };
}

const HEARTS = [
  ...Array.from({ length: 5 }, (_, i) => generateHeart(i, 'front')),
  ...Array.from({ length: 14 }, (_, i) => generateHeart(i + 5, 'mid')),
  ...Array.from({ length: 9 }, (_, i) => generateHeart(i + 19, 'back')),
];

function FallingHearts() {
  return (
    <div className="falling-hearts pointer-events-none">
      {HEARTS.map((h) => {
        const isPulsing = h.layer === 'mid' && Math.random() > 0.4;
        const layerClass = `heart-layer-${h.layer}`;
        return (
          <div key={h.id} className={`heart-container ${layerClass}`} style={h.style}>
            <div className={`heart-wrapper ${isPulsing ? 'heart-pulse' : ''}`}>
              {h.variant === 'glass' ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="url(#glass-grad)"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1.5"
                  className={h.layer === 'front' ? 'w-10 h-10' : h.layer === 'mid' ? 'w-7 h-7' : 'w-4 h-4'}
                >
                  <defs>
                    <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                    </linearGradient>
                  </defs>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              ) : (
                <Heart
                  className={h.layer === 'front' ? 'w-10 h-10' : h.layer === 'mid' ? 'w-7 h-7' : 'w-4 h-4'}
                  fill={h.variant === 'solid' ? h.color : 'none'}
                  color={h.color}
                  strokeWidth={h.variant === 'solid' ? 0 : 2}
                  style={h.variant === 'solid' ? { filter: `drop-shadow(0 0 8px ${h.color}80)` } : undefined}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Aurora Borealis ──────────────────────────────────────────────────────────
const AURORA_CURTAINS = Array.from({ length: 6 }, (_, i) => { 
  const isAlt = i % 2 === 0;
  return {
    id: i,
    left: `${(i - 1) * 20}%`, 
    width: `${30 + Math.random() * 20}%`, 
    height: `${50 + Math.random() * 40}%`,
    background: isAlt
      ? `linear-gradient(to bottom, rgba(0,255,200,${0.25 + Math.random() * 0.15}) 0%, rgba(34,211,238,${0.1 + Math.random() * 0.1}) 40%, transparent 100%)`
      : `linear-gradient(to bottom, rgba(168,85,247,${0.2 + Math.random() * 0.15}) 0%, rgba(220,80,255,${0.1 + Math.random() * 0.1}) 40%, transparent 100%)`,
    filter: `blur(${15 + Math.random() * 15}px)`, 
    duration: `${25 + Math.random() * 15}s`, 
    delay: `-${Math.random() * 20}s`,
    opacity: 0.6 + Math.random() * 0.4,
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

const AURORA_RAYS = Array.from({ length: 6 }, (_, i) => {
  const { r, g, b } = AURORA_RAY_PALETTE[i % AURORA_RAY_PALETTE.length];
  const op = parseFloat((0.55 + Math.random() * 0.3).toFixed(2));
  const bl = parseFloat((4 + Math.random() * 5).toFixed(1));
  return {
    id: i,
    left: `${8 + i * 15 + Math.random() * 5}%`,
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
      <div className="aurora-glow-base" />

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
            '--aurora-opacity': r.opacity,
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

    let lastWidth = -1;
    let lastHeight = -1;

    if (theme === 'snow') {
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

      const createSprite = (type: 'orb' | 'flake' | 'dot') => {
        const c = document.createElement('canvas');
        const cCtx = c.getContext('2d')!;
        if (type === 'orb') {
          c.width = 40; c.height = 40;
          const grad = cCtx.createRadialGradient(20, 20, 0, 20, 20, 20);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          cCtx.fillStyle = grad;
          cCtx.fillRect(0, 0, 40, 40);
        } else if (type === 'flake') {
          c.width = 24; c.height = 24;
          cCtx.translate(12, 12);
          cCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          cCtx.lineWidth = 1.5;
          cCtx.lineCap = 'round';
          for (let i = 0; i < 6; i++) {
            cCtx.beginPath();
            cCtx.moveTo(0, 0);
            cCtx.lineTo(0, -10);
            cCtx.moveTo(0, -4);
            cCtx.lineTo(3, -7);
            cCtx.moveTo(0, -4);
            cCtx.lineTo(-3, -7);
            cCtx.stroke();
            cCtx.rotate(Math.PI / 3);
          }
        } else {
          c.width = 4; c.height = 4;
          cCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          cCtx.beginPath();
          cCtx.arc(2, 2, 1.5, 0, Math.PI * 2);
          cCtx.fill();
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
        for (let i = 0; i < 110; i++) {
          let type: 'orb' | 'flake' | 'dot';
          let r, speedY;
          if (i < 12) { type = 'orb'; r = Math.random() * 4 + 8; speedY = Math.random() * 0.8 + 0.8; }
          else if (i < 40) { type = 'flake'; r = Math.random() * 2 + 3; speedY = Math.random() * 0.5 + 0.5; }
          else { type = 'dot'; r = Math.random() * 1 + 1; speedY = Math.random() * 0.3 + 0.2; }

          snowFlakes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r, speedY, speedX: 0,
            sway: (Math.random() - 0.5) * 0.5,
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
          
          const dx = mouseX - f.x;
          const dy = mouseY - f.y;
          const distSq = dx * dx + dy * dy;
          const repelRadius = 150;
          
          if (distSq < repelRadius * repelRadius) {
            const dist = Math.sqrt(distSq);
            const force = (repelRadius - dist) / repelRadius;
            targetSpeedX += (dx / dist) * force * 4; 
            f.y += (dy / dist) * force * 1.5; 
          }

          f.speedX += (targetSpeedX - f.speedX) * 0.05;
          f.x += f.speedX;
          f.y += f.speedY;

          if (f.y > canvas.height + f.r) { f.y = -f.r; f.x = Math.random() * canvas.width; }
          if (f.x > canvas.width + f.r) f.x = -f.r;
          if (f.x < -f.r) f.x = canvas.width + f.r;

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
        stars.length = 0;
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

    if (theme === 'meteors') {
      const stars: {
        x: number; y: number; r: number;
        baseAlpha: number; speed: number; phase: number;
        isBlinker: boolean;
      }[] = [];
      let time = 0;

      const init = () => {
        stars.length = 0;
        const count = window.innerWidth < 640 ? 60 : 120;
        for (let i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.2 + 0.3,
            baseAlpha: Math.random() * 0.5 + 0.3,
            speed: Math.random() * 0.5 + 0.2,
            phase: Math.random() * Math.PI * 2,
            isBlinker: Math.random() > 0.6,
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
        time += 0.016;
        
        ctx.fillStyle = '#ffffff'; 
        
        stars.forEach((s) => {
          let alpha = s.baseAlpha;
          if (s.isBlinker) {
            alpha *= (0.3 + 0.7 * Math.abs(Math.sin(time * s.speed + s.phase)));
          }
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
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

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      alpha: number;
      color: string;
    }[] = [];

    const colors = ['rgba(255, 0, 85,', 'rgba(255, 42, 122,', 'rgba(255, 77, 148,'];

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
      style={
        activeTheme === 'meteors'
          ? {
              backgroundImage: 'linear-gradient(rgba(3, 0, 13, 0.35), rgba(11, 1, 32, 0.5))',
              backgroundColor: '#03000d',
            }
          : activeTheme === 'hearts'
          ? { background: '#05050A' }
          : activeTheme === 'aurora'
          ? { background: 'linear-gradient(180deg, #000a0f 0%, #00110d 35%, #001a14 65%, #000508 100%)' }
          : { background: 'linear-gradient(180deg, #020412 0%, #0a1526 50%, #07192f 100%)' }
      }
    >
      {/* ══════════════════════════ NEBULA BACKGROUND (METEORS) ══════════════════════════ */}
      {activeTheme === 'meteors' && (
        <>
          {/* Imagem de fundo — fixada com viewport máximo para evitar resize jumps no mobile */}
          <div
            className="nebula-bg-mobile fixed top-0 left-0 w-full h-[100lvh] z-0 pointer-events-none"
            style={{
              backgroundRepeat: 'no-repeat',
              opacity: 0.9,
            }}
          />
          {/* Overlay escuro fixo nas extremidades do viewport para legibilidade contínua */}
          <div
            className="fixed top-0 left-0 w-full h-[100lvh] z-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(3,0,13,0.4) 0%, transparent 20%, transparent 80%, rgba(3,0,13,0.5) 100%)',
            }}
          />
        </>
      )}


      {/* ══════════════════════════ BACKGROUND NEON LIGHTS ══════════════════════════ */}
      <div className="fixed top-0 left-0 w-screen h-[100lvh] z-0 pointer-events-none">
        {activeTheme === 'meteors' ? (
          <>
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/20 blur-[200px] rounded-full" />
            <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-teal-700/15 blur-[180px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-indigo-900/20 blur-[220px] rounded-full" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[var(--theme-primary)]/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--theme-accent)]/5 blur-[150px] rounded-full" />
            <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-[var(--theme-primary)]/10 blur-[150px] rounded-full" />
          </>
        )}
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
              className="text-4xl md:text-5xl font-serif font-bold text-white mt-4 tracking-wide"
              style={{ textShadow: '0 0 20px var(--theme-primary)' }}
            >
              I A R A
            </h2>
          </div>

          <div className="space-y-5">
            {ACROSTIC.map((line, index) => {
              const isOpen = openAcrostic === index;
              return (
                <motion.button
                  key={index}
                  onClick={() => setOpenAcrostic(isOpen ? null : index)}
                  layout
                  transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 } }}
                  className={`
                    w-full text-left rounded-2xl overflow-hidden
                    backdrop-blur-xl transition-all duration-500 group
                    border
                    ${isOpen
                      ? 'bg-white/[0.06] border-[var(--theme-primary)]/50 shadow-[0_0_50px_rgba(var(--theme-primary-rgb),0.25),inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06] hover:border-[var(--theme-primary)]/40 hover:shadow-[0_0_35px_rgba(var(--theme-primary-rgb),0.15)]'
                    }
                  `}
                  style={{ touchAction: 'manipulation' }}
                >
                  {/* Active glow line at top */}
                  <div
                    className={`h-[2px] w-full transition-all duration-500 ${
                      isOpen
                        ? 'bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-100'
                        : 'bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-0 group-hover:opacity-40'
                    }`}
                  />

                  <div className="flex items-center gap-5 p-5 md:p-7">
                    {/* Letter badge */}
                    <div className={`
                      relative w-14 h-14 md:w-16 md:h-16 rounded-xl shrink-0
                      flex items-center justify-center
                      transition-all duration-500
                      ${isOpen
                        ? 'bg-[var(--theme-primary)]/15 shadow-[0_0_25px_rgba(var(--theme-primary-rgb),0.3)]'
                        : 'bg-white/[0.04] group-hover:bg-[var(--theme-primary)]/10'
                      }
                    `}>
                      <span
                        className={`text-3xl md:text-4xl font-bold font-serif ${line.color} transition-all duration-500`}
                        style={{
                          textShadow: isOpen ? '0 0 25px currentColor' : '0 0 12px currentColor',
                          filter: isOpen ? 'brightness(1.2)' : undefined,
                        }}
                      >
                        {line.letter}
                      </span>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-white/90 font-medium text-lg md:text-xl leading-snug"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                      >
                        <span className={`font-bold ${line.color}`}>{line.letter}</span>
                        {line.short}
                      </p>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key={`acrostic-content-${index}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                              height: { type: 'spring', stiffness: 250, damping: 28 },
                              opacity: { duration: 0.25, ease: 'easeInOut' },
                            }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 pb-1">
                              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                              <p className="text-slate-300/90 text-base md:text-lg leading-relaxed font-light">
                                {line.long}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Chevron */}
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        className={`w-6 h-6 transition-colors duration-300 ${
                          isOpen ? 'text-[var(--theme-primary)]' : 'text-white/30 group-hover:text-white/60'
                        }`}
                        style={isOpen ? { filter: 'drop-shadow(0 0 8px var(--theme-primary))' } : undefined}
                      />
                    </motion.div>
                  </div>
                </motion.button>
              );
            })}
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
          <div className="relative rounded-[2.5rem] overflow-hidden border border-[var(--theme-primary)]/30 bg-white/[0.03] backdrop-blur-2xl shadow-[0_0_50px_rgba(var(--theme-primary-rgb),0.2),inset_0_1px_0_rgba(255,255,255,0.1)] p-8 md:p-14 text-center space-y-10 transition-all duration-500 hover:border-[var(--theme-primary)]/50 hover:shadow-[0_0_70px_rgba(var(--theme-primary-rgb),0.35),inset_0_1px_0_rgba(255,255,255,0.15)] group">
            
            {/* Top gradient glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--theme-primary)] to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="space-y-4">
              <motion.div 
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              >
                <Sparkles
                  className="w-12 h-12 text-[var(--theme-primary)] mx-auto opacity-90"
                  style={{ filter: 'drop-shadow(0 0 15px var(--theme-primary))' }}
                />
              </motion.div>
              
              <h2
                className="text-3xl md:text-4xl font-serif font-bold text-white tracking-wide"
                style={{ textShadow: '0 0 20px var(--theme-primary)' }}
              >
                Para Minha Princesa
              </h2>
            </div>

            <div className="min-h-[160px] md:min-h-[140px] flex items-center justify-center px-2">
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="text-white/95 leading-relaxed md:leading-loose text-xl md:text-2xl italic font-light tracking-wide"
                  style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
                >
                  "{LOVE_MESSAGES[msgIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2 pt-8 border-t border-[var(--theme-primary)]/20 relative">
              <p className="text-slate-300/80 text-xs md:text-sm font-medium uppercase tracking-[0.3em]">
                Com todo meu amor,
              </p>
              <p
                className="text-white text-3xl md:text-4xl mt-2"
                style={{ 
                  fontFamily: "'Dancing Script', cursive",
                  textShadow: '0 0 15px var(--theme-primary), 0 0 30px var(--theme-primary)' 
                }}
              >
                {partner1.name} 💕
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMsgIndex((i) => (i + 1) % LOVE_MESSAGES.length)}
              className="mt-2 inline-flex items-center justify-center gap-3 text-sm text-white font-bold uppercase tracking-wider px-8 py-4 rounded-full bg-[var(--theme-primary)]/10 hover:bg-[var(--theme-primary)]/25 border border-[var(--theme-primary)]/40 hover:border-[var(--theme-primary)]/80 hover:shadow-[0_0_35px_rgba(var(--theme-primary-rgb),0.5)] transition-colors duration-300"
              style={{ touchAction: 'manipulation' }}
            >
              <motion.div
                initial={false}
                animate={{ rotate: msgIndex * 180 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
              Nova mensagem
            </motion.button>
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
