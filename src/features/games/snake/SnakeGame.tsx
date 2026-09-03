import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { useThemeStore } from '../../../store/useThemeStore';
import { SNAKE_THEMES } from './snakeTheme';
import { useSnakeGame, COLS, ROWS } from './useSnakeGame';
import type { Point, Particle } from './useSnakeGame';


export function SnakeGame() {
  const {
    g, phase, score, highScore, audioEnabled,
    startGame, pauseToggle, goMenu, queueDir, toggleAudio, tick
  } = useSnakeGame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTheme = useThemeStore(s => s.activeTheme);
  const theme = SNAKE_THEMES[activeTheme];

  const [cellSize, setCellSize] = useState(24);

  // ─── Resize Logic ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const maxW = containerRef.current.clientWidth;
      const maxH = window.innerHeight - 250; 
      
      let newSize = Math.floor(Math.min(maxW / COLS, maxH / ROWS));
      newSize = Math.max(16, Math.min(newSize, 28));
      setCellSize(newSize);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const CANVAS_W = COLS * cellSize;
  const CANVAS_H = ROWS * cellSize;

  // ─── Drawing Loop (Highly Optimized) ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    
    // OPTIMIZATION: Prerender grid to offscreen canvas to avoid 255 fillRect calls per frame
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = CANVAS_W;
    bgCanvas.height = CANVAS_H;
    const bgCtx = bgCanvas.getContext('2d')!;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bgCtx.fillStyle = (r + c) % 2 === 0 ? theme.cellA : theme.cellB;
        bgCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    let rafId: number;
    let lastTime = performance.now();

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const spawnParticles = (cx: number, cy: number) => {
      const p: Particle[] = [];
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 1.5 + Math.random() * 3.5;
        p.push({
          x: cx, y: cy, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          alpha: 1, r: 2 + Math.random() * 4,
          color: theme.particles[Math.floor(Math.random() * theme.particles.length)]
        });
      }
      return p;
    };

    const drawApple = (x: number, y: number, scale: number = 1) => {
      if (scale <= 0) return;
      const fx = x * cellSize + cellSize / 2;
      const fy = y * cellSize + cellSize / 2;
      
      ctx.save();
      ctx.globalAlpha = Math.max(0, scale);
      
      ctx.beginPath(); 
      ctx.arc(fx, fy + 1 * scale, cellSize * 0.35 * scale, 0, Math.PI * 2);
      ctx.fillStyle = theme.food; 
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(fx + 2 * scale, fy - cellSize * 0.25 * scale, 4 * scale, 2 * scale, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4caf50'; 
      ctx.fill();
      
      ctx.restore();
    };

    const draw = (time: number) => {
      let delta = time - lastTime;
      if (delta > 100) delta = 16; 
      lastTime = time;

      const s = g.current;
      
      // Advance logical engine
      if (s.phase === 'playing') {
        if (s.isWaiting) {
          s.progress = 0;
        } else {
          s.progress += delta / s.speed;
          while (s.progress >= 1 && s.phase === 'playing') {
            tick();
            s.progress -= 1;
          }
        }
      }

      // 1. Draw cached background grid (HUGE performance boost)
      ctx.drawImage(bgCanvas, 0, 0);

      // 2. Food (Apple)
      drawApple(s.food.x, s.food.y);

      // Eaten food shrinking effect & particles
      if (s.isEating) {
        if (s.progress < 0.6) {
          drawApple(s.snake[0].x, s.snake[0].y, 1 - (s.progress / 0.6));
        } else if (!s.spawnedParticlesForThisEat) {
          s.particles.push(...spawnParticles(s.snake[0].x * cellSize + cellSize/2, s.snake[0].y * cellSize + cellSize/2));
          s.spawnedParticlesForThisEat = true;
        }
      }

      // 3. Snake visual path construction
      const path: Point[] = [];
      if (s.snake.length > 0) {
        if ((s.phase === 'playing' || s.phase === 'gameOver') && s.prevHead && s.oldTail && !s.isWaiting) {
          const p = s.phase === 'gameOver' ? 1.0 : s.progress;
          const vHead = {
            x: lerp(s.prevHead.x, s.snake[0].x, p),
            y: lerp(s.prevHead.y, s.snake[0].y, p)
          };
          const vTail = s.isEating ? s.snake[s.snake.length - 1] : {
            x: lerp(s.oldTail.x, s.snake[s.snake.length - 1].x, p),
            y: lerp(s.oldTail.y, s.snake[s.snake.length - 1].y, p)
          };
          
          path.push(vHead);
          path.push(...s.snake.slice(1));
          path.push(vTail);
        } else {
          path.push(...s.snake);
        }

        const SNAKE_W = cellSize - 4;
        
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineWidth = SNAKE_W + 4;
        ctx.strokeStyle = theme.snakeOutline;
        ctx.beginPath();
        ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
        }
        ctx.stroke();
        
        ctx.lineWidth = SNAKE_W;
        ctx.strokeStyle = theme.snakeBody;
        ctx.stroke();

        ctx.lineWidth = SNAKE_W * 0.3;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.translate(-SNAKE_W * 0.15, -SNAKE_W * 0.15);
        ctx.stroke();
        ctx.restore();

        // Eyes
        const hx = path[0].x * cellSize + cellSize/2;
        const hy = path[0].y * cellSize + cellSize/2;
        
        let vx = 0, vy = 0;
        if (path.length > 1 && !s.isWaiting) {
          vx = path[0].x - path[1].x;
          vy = path[0].y - path[1].y;
          const len = Math.sqrt(vx*vx + vy*vy);
          if (len > 0.001) { vx /= len; vy /= len; }
          else { vx = s.dir.x; vy = s.dir.y; }
        } else {
          vx = s.dir.x; vy = s.dir.y;
        }

        const eyeOffset = SNAKE_W * 0.25;
        const eyeFwd = SNAKE_W * 0.3;
        const perp = { x: -vy, y: vx };
        
        for (const side of [-1, 1]) {
          const ex = hx + vx * eyeFwd + perp.x * eyeOffset * side;
          const ey = hy + vy * eyeFwd + perp.y * eyeOffset * side;
          ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI*2);
          ctx.fillStyle = '#fff'; ctx.fill();
          ctx.beginPath(); ctx.arc(ex + vx*1.5, ey + vy*1.5, 2, 0, Math.PI*2);
          ctx.fillStyle = '#000'; ctx.fill();
        }
      }

      // 4. Particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.15;
        p.alpha -= 0.025;
        if (p.alpha <= 0) { s.particles.splice(i, 1); continue; }
        
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.color; ctx.fill();
        ctx.restore();
      }


      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [theme, cellSize, CANVAS_W, CANVAS_H, g, tick]);

  // ─── Input Handling ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'playing') {
        if (e.key === ' ') e.preventDefault(); 
        return;
      }
      switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': queueDir({x:0, y:-1}); e.preventDefault(); break;
        case 'ArrowDown':  case 's': case 'S': queueDir({x:0, y:1});  e.preventDefault(); break;
        case 'ArrowLeft':  case 'a': case 'A': queueDir({x:-1, y:0}); e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': queueDir({x:1, y:0});  e.preventDefault(); break;
        case ' ': pauseToggle(); e.preventDefault(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, queueDir, pauseToggle]);

  const touchStart = useRef<{x:number, y:number}|null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      queueDir(dx > 0 ? {x:1, y:0} : {x:-1, y:0});
    } else {
      queueDir(dy > 0 ? {x:0, y:1} : {x:0, y:-1});
    }
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center select-none overflow-hidden" style={{ touchAction: 'none' }}>
      
      {/* ── HUD ── */}
      <div 
        style={{ width: CANVAS_W, color: theme.textPrimary }}
        className="flex items-center justify-between mb-4 px-2 tracking-wide"
      >
        <div className="flex flex-col">
          <span className="text-[10px] uppercase opacity-70">Pontuação</span>
          <span className="text-2xl font-bold leading-none">{score}</span>
        </div>

        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleAudio}
            className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
          >
            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          
          <button 
            onClick={pauseToggle}
            disabled={phase === 'menu' || phase === 'gameOver'}
            className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-70 hover:opacity-100 disabled:opacity-30"
          >
            {phase === 'paused' ? <Play size={20} /> : <Pause size={20} />}
          </button>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase opacity-70">Recorde</span>
          <span className="text-2xl font-bold leading-none" style={{ color: theme.borderNeon }}>{highScore}</span>
        </div>
      </div>

      {/* ── Canvas Area ── */}
      <div 
        className="relative rounded-lg overflow-hidden transition-all duration-300"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          border: `2px solid ${theme.borderNeon}`,
          boxShadow: `0 0 15px ${theme.borderGlow}, inset 0 0 10px ${theme.borderGlow}`,
          background: theme.boardBg,
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="block" />

        {/* ── Overlay: Menu ── */}
        {phase === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300"
               style={{ background: theme.overlayBg }}>
            <h1 className="text-4xl font-bold mb-2 tracking-tighter" style={{ color: theme.textPrimary, textShadow: `0 0 10px ${theme.borderGlow}` }}>
              Snake
            </h1>
            <p className="text-sm opacity-80 mb-8 max-w-[200px] text-center" style={{ color: theme.textPrimary }}>
              Coma, cresça e faça a maior pontuação!
            </p>
            <SmallBtn bg={theme.btnPrimary} onClick={startGame}>JOGAR</SmallBtn>
          </div>
        )}

        {/* ── Overlay: Paused ── */}
        {phase === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in duration-200"
               style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}>
            <h2 className="text-2xl font-bold tracking-widest mb-6" style={{ color: theme.textPrimary }}>PAUSADO</h2>
            <OverlayBtn bg={theme.btnPrimary} onClick={pauseToggle}>Continuar</OverlayBtn>
          </div>
        )}

        {/* ── Overlay: Game Over ── */}
        {phase === 'gameOver' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300"
               style={{ background: theme.overlayBg }}>
            <div className="text-5xl mb-2 animate-bounce">💀</div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: theme.textPrimary }}>GAME OVER</h2>
            
            <div className="flex gap-6 mb-8 text-center" style={{ color: theme.textPrimary }}>
              <div>
                <div className="text-xs uppercase opacity-70">Pontuação</div>
                <div className="text-xl font-bold">{score}</div>
              </div>
              <div>
                <div className="text-xs uppercase opacity-70">Recorde</div>
                <div className="text-xl font-bold" style={{ color: theme.borderNeon }}>{highScore}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-48">
              <OverlayBtn bg={theme.btnPrimary} onClick={startGame}>JOGAR NOVAMENTE</OverlayBtn>
              <OverlayBtn bg="rgba(255,255,255,0.1)" onClick={goMenu}>MENU</OverlayBtn>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function OverlayBtn({ bg, onClick, children }: { bg: string, onClick: () => void, children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full py-3 rounded-full font-bold text-sm tracking-wide text-white transition-all active:scale-95 shadow-lg"
      style={{
        backgroundColor: bg,
        filter: hover ? 'brightness(1.1)' : 'none',
        boxShadow: hover ? `0 4px 15px ${bg.replace(/,[\d.]+\)$/, ',0.4)')}` : 'none'
      }}
    >
      {children}
    </button>
  );
}
function SmallBtn({ bg, onClick, children }: { bg: string, onClick: () => void, children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="px-8 py-2 rounded-full font-semibold text-xs tracking-widest uppercase text-white transition-all active:scale-95"
      style={{
        backgroundColor: bg,
        filter: hover ? 'brightness(1.15)' : 'none',
        boxShadow: hover ? `0 4px 12px ${bg}88` : `0 2px 8px ${bg}55`
      }}
    >
      {children}
    </button>
  );
}
