import { useEffect, useRef, useState } from 'react';
import { Heart, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { PlaylistTabs } from '../features/playlist/PlaylistTabs';
import { AlbumCarousel } from '../features/album/AlbumCarousel';
import { TimelineModal } from '../features/timeline/TimelineModal';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

// ─── Types ───────────────────────────────────────────────────────────────────
interface TimeLeft {
  years: number; months: number; days: number;
  hours: number; minutes: number; seconds: number;
  totalDays: number;
}

function getTimeLeft(startDate: Date): TimeLeft {
  const now = new Date();
  const years = differenceInYears(now, startDate);
  const wy = new Date(startDate); wy.setFullYear(wy.getFullYear() + years);
  const months = differenceInMonths(now, wy);
  const wm = new Date(wy); wm.setMonth(wm.getMonth() + months);
  const days = differenceInDays(now, wm);
  const wd = new Date(wm); wd.setDate(wd.getDate() + days);
  const hours = differenceInHours(now, wd);
  const wh = new Date(wd); wh.setHours(wh.getHours() + hours);
  const minutes = differenceInMinutes(now, wh);
  const wmin = new Date(wh); wmin.setMinutes(wmin.getMinutes() + minutes);
  const seconds = differenceInSeconds(now, wmin);
  const totalDays = differenceInDays(now, startDate);
  return { years, months, days, hours, minutes, seconds, totalDays };
}

// ─── Data ────────────────────────────────────────────────────────────────────
const LOVE_MESSAGES = [
  "Você é o melhor capítulo da minha vida.",
  "Com você, todo dia é um motivo pra sorrir.",
  "Meu amor por você cresce a cada segundo que passa.",
  "Você me faz querer ser alguém melhor todos os dias.",
  "A distância só me deu mais certeza de que é você que eu quero.",
  "Seu sorriso é o que mais gosto de ver nesse mundo.",
  "Você transformou completamente o meu 2025 — para sempre melhor.",
  "Não importa as constelações nem o idioma, eu vou te amar de qualquer maneira.",
];

const ACROSTIC = [
  {
    letter: 'I', color: 'text-rose-400',
    short: 'ncrível — você é boa em tudo que faz',
    long: 'Sua dedicação, seu esforço e o carinho fazem eu admirar você cada dia mais. Estar ao seu lado me inspira a querer ser alguém melhor todos os dias.',
  },
  {
    letter: 'A', color: 'text-pink-400',
    short: 'mor — você me mostrou o que é o verdadeiro amor',
    long: 'Com você, amar deixou de ser apenas uma palavra e virou sentimento, cuidado, reciprocidade e paz. Seu amor melhorou a minha vida em todos os sentidos.',
  },
  {
    letter: 'R', color: 'text-rose-300',
    short: 'ara — não é fácil encontrar alguém como você',
    long: 'Quanto mais eu te conheço, mais percebo o quão única e especial você é. Você é como uma joia rara: difícil de encontrar, impossível de substituir.',
  },
  {
    letter: 'A', color: 'text-pink-300',
    short: 'utêntica — a sua essência é única',
    long: 'O seu jeitinho, sua personalidade e a forma sincera com que você vive a vida me deixam completamente apaixonado. Você consegue ser diferente de todo mundo da melhor forma possível.',
  },
];

// ─── Particles ───────────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string }[] = [];
    const colors = ['rgba(225,29,72,', 'rgba(244,114,182,', 'rgba(251,191,36,'];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const init = () => {
      for (let i = 0; i < 80; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.3, vy: -Math.random() * 0.5 - 0.1, r: Math.random() * 2.5 + 0.5, alpha: Math.random() * 0.4 + 0.1, color: colors[Math.floor(Math.random() * colors.length)] });
      }
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
      });
      animId = requestAnimationFrame(draw);
    };
    window.addEventListener('resize', resize); resize(); init(); draw();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-60" />;
}

// ─── Counter Box ──────────────────────────────────────────────────────────────
function CounterBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative min-w-[58px] md:min-w-[72px] px-2 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-center shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 to-transparent pointer-events-none" />
        <span className="block font-bold font-mono text-white leading-none" style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)' }}>
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-rose-300/60">{label}</span>
    </div>
  );
}

// ─── Section Divider ─────────────────────────────────────────────────────────
function SectionLabel({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex justify-center">
      <span className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-2">
        <span>{emoji}</span> {text}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { config } = useSiteConfigStore();
  const [time, setTime] = useState<TimeLeft | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const [openAcrostic, setOpenAcrostic] = useState<number | null>(null);

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
    <div className="relative -mt-0">

      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        <ParticleCanvas />
        <div className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 45%, rgba(225,29,72,0.15) 0%, transparent 70%)' }} />

        <div className="relative z-10 text-center space-y-8 py-16 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="flex justify-center">
            <div className="relative">
              <Heart className="w-20 h-20 text-rose-500 fill-rose-500" style={{ filter: 'drop-shadow(0 0 24px rgba(225,29,72,0.8))' }} />
              <Heart className="w-20 h-20 text-rose-500 fill-rose-500 absolute inset-0 animate-ping opacity-20" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="font-serif font-bold leading-none"
              style={{ fontSize: 'clamp(3.5rem, 13vw, 6.5rem)', color: 'var(--color-theme-primary)', textShadow: '0 0 50px rgba(225,29,72,0.4)' }}>
              {partner1.name}
            </h1>
            <p className="text-4xl text-rose-300/70" style={{ fontFamily: "'Dancing Script', cursive" }}>&amp;</p>
            <h1 className="font-serif font-bold leading-none"
              style={{ fontSize: 'clamp(3.5rem, 13vw, 6.5rem)', color: 'var(--color-theme-primary)', textShadow: '0 0 50px rgba(225,29,72,0.4)' }}>
              {partner2.name}
            </h1>
          </div>

          <p className="text-lg md:text-xl text-slate-300/80 italic leading-relaxed px-4">
            "Você é o melhor capítulo da minha vida"
          </p>

          {time && time.totalDays > 0 && (
            <div className="inline-flex flex-col items-center gap-0.5 px-8 py-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur shadow-lg">
              <span className="font-bold text-rose-400 font-mono" style={{ fontSize: 'clamp(2.5rem, 8vw, 4rem)', lineHeight: 1 }}>
                {time.totalDays.toLocaleString('pt-BR')}
              </span>
              <span className="text-sm uppercase tracking-widest text-rose-300/70">dias juntos</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-2 pt-4 opacity-40">
            <span className="text-xs uppercase tracking-widest text-slate-400">Role para baixo</span>
            <ChevronDown className="w-5 h-5 text-slate-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════ CONTADOR ══════════════════════════ */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-950/10 to-transparent pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center space-y-10">
          <div className="space-y-2">
            <SectionLabel emoji="⏱" text="Tempo Juntos" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-4">Contando Cada Segundo</h2>
            <p className="text-slate-400">Desde que nossas histórias se entrelaçaram</p>
          </div>

          {time && (
            <div className="flex flex-wrap justify-center items-end gap-1.5 md:gap-3">
              <CounterBox value={time.years} label="Anos" />
              <span className="text-rose-400/40 text-xl font-thin pb-6">:</span>
              <CounterBox value={time.months} label="Meses" />
              <span className="text-rose-400/40 text-xl font-thin pb-6">:</span>
              <CounterBox value={time.days} label="Dias" />
              <span className="text-rose-400/40 text-xl font-thin pb-6">:</span>
              <CounterBox value={time.hours} label="Horas" />
              <span className="text-rose-400/40 text-xl font-thin pb-6">:</span>
              <CounterBox value={time.minutes} label="Min" />
              <span className="text-rose-400/40 text-xl font-thin pb-6">:</span>
              <CounterBox value={time.seconds} label="Seg" />
            </div>
          )}
          <p className="text-slate-500 text-sm">📅 Desde {config.relationship.startDate.split('-').reverse().join('/')}</p>
        </div>
      </section>

      {/* ══════════════════════════ TRILHA SONORA ══════════════════════════ */}
      {config.features.enableMusic && (
        <section className="py-20 overflow-hidden">
          <div className="max-w-2xl mx-auto text-center space-y-2 px-4 mb-10">
            <SectionLabel emoji="🎵" text="Nossa Trilha Sonora" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-4">Escolha a Playlist</h2>
            <p className="text-slate-400">Selecione uma playlist para dar o tom perfeito ao momento</p>
          </div>
          <PlaylistTabs />
        </section>
      )}

      {/* ══════════════════════════ ÁLBUNS ══════════════════════════ */}
      {config.features.enableAlbum && (
        <section className="py-20 overflow-hidden">
          <div className="max-w-2xl mx-auto text-center space-y-2 px-4 mb-10">
            <SectionLabel emoji="📸" text="Nossas Memórias" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-4">Nosso Álbum</h2>
            <p className="text-slate-400">Arraste para o lado e clique em um álbum para abrir</p>
          </div>
          <AlbumCarousel />
        </section>
      )}

      {/* ══════════════════════════ MENSAGEM ROMÂNTICA ══════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/80 to-rose-950/30 backdrop-blur-md shadow-2xl p-8 md:p-12 text-center space-y-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rose-500/20 to-transparent" />

            <Sparkles className="w-8 h-8 text-rose-400 mx-auto" />
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white">Para Minha Princesa</h2>

            <p className="text-slate-300 leading-relaxed text-base md:text-lg italic">
              "{LOVE_MESSAGES[msgIndex]}"
            </p>

            <div className="flex flex-col gap-1">
              <p className="text-slate-500 text-sm">Com todo meu amor,</p>
              <p className="text-rose-400 font-serif text-xl">{partner1.name} 💕</p>
            </div>

            <button
              onClick={() => setMsgIndex(i => (i + 1) % LOVE_MESSAGES.length)}
              className="inline-flex items-center justify-center gap-2 text-sm text-rose-400/70 hover:text-rose-400 transition-colors px-4 py-3 rounded-xl hover:bg-rose-500/10 active:bg-rose-500/20"
              style={{ touchAction: 'manipulation' }}
            >
              <RefreshCw className="w-4 h-4" /> Nova mensagem
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ ACRÓSTICO ══════════════════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <SectionLabel emoji="✨" text="Acróstico" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-4">I A R A</h2>
          </div>

          <div className="space-y-3">
            {ACROSTIC.map((line, index) => (
              <button
                key={index}
                onClick={() => setOpenAcrostic(openAcrostic === index ? null : index)}
                className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-rose-500/30 transition-all duration-300 overflow-hidden"
                style={{ touchAction: 'manipulation' }}
              >
                <div className="flex items-center gap-4 md:gap-5 p-4 md:p-5">
                  <span className={`text-4xl md:text-5xl font-bold font-serif shrink-0 ${line.color}`}
                    style={{ textShadow: '0 0 20px currentColor', opacity: 0.9 }}>
                    {line.letter}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">
                      <span className={`font-bold ${line.color}`}>{line.letter}</span>
                      {line.short}
                    </p>
                    {openAcrostic === index && (
                      <p className="text-slate-400 text-sm mt-2 leading-relaxed animate-in fade-in duration-300">
                        {line.long}
                      </p>
                    )}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-300 ${openAcrostic === index ? 'rotate-180' : ''}`} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════ NOSSA HISTÓRIA (TIMELINE) ══════════════════════════ */}
      {config.features.enableTimeline && (
        <section className="py-20 px-4 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <SectionLabel emoji="📖" text="Nossa História" />
            <h2 className="text-3xl font-serif font-bold text-white mt-4">Cada Momento Importa</h2>
            <p className="text-slate-400">Clique abaixo para relembrar todos os nossos capítulos</p>
          </div>
          <div className="flex justify-center mt-6">
            <TimelineModal />
          </div>
        </section>
      )}

      {/* Bottom glow */}
      <div className="py-12" />
      <div className="h-px w-full bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
    </div>
  );
}
