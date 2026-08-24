/**
 * FloatingNav — botão flutuante no canto inferior esquerdo que expande
 * em arco com os links de navegação. Sem barra inferior.
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, Gamepad2, Heart, X } from 'lucide-react';
import { cn } from '../../shared/utils/cn';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Início', angle: 90 },
  { to: '/mapa', icon: Map, label: 'Nosso Mundo', angle: 52 },
  { to: '/jogos', icon: Gamepad2, label: 'Jogos', angle: 14 },
];

const RADIUS = 72; // px — raio do arco

function deg2rad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function FloatingNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Backdrop translúcido ao abrir */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      {/* Container fixo no canto inferior esquerdo */}
      <div className="fixed bottom-8 left-4 md:bottom-10 md:left-10 z-50">
        {/* Itens em arco — renderizados antes do botão para ficarem atrás */}
        {NAV_ITEMS.map((item, i) => {
          const rad = deg2rad(item.angle);
          const x = Math.cos(rad) * RADIUS; // positivo = para a direita
          const y = -Math.sin(rad) * RADIUS; // negativo = para cima
          const isActive = location.pathname === item.to;

          return (
            <div
              key={item.to}
              className="absolute bottom-0 left-0"
              style={{
                transform: open ? `translate(${x}px, ${y}px)` : 'translate(0px, 0px)',
                opacity: open ? 1 : 0,
                transition: `transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 50}ms, opacity 200ms ease ${i * 50}ms`,
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              <Link
                to={item.to}
                onClick={() => setOpen(false)}
                title={item.label}
                className={cn(
                  'flex flex-col items-center justify-center w-12 h-12 rounded-full border shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-md',
                  isActive
                    ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/40'
                    : 'bg-black/60 border-white/15 text-white/80 hover:bg-black/80 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span
                  className={cn(
                    'text-[9px] font-medium leading-none mt-0.5 transition-all duration-200',
                    isActive ? 'text-white' : 'text-white/60'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}

        {/* Botão principal */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border transition-all duration-300 backdrop-blur-md',
            open
              ? 'bg-rose-500/90 border-rose-400 text-white rotate-45 shadow-rose-500/40'
              : 'bg-black/60 border-white/15 text-white/80 hover:bg-black/80 hover:text-white hover:scale-110 active:scale-95'
          )}
          aria-label="Navegação"
        >
          {open ? <X className="w-6 h-6" /> : <Heart className="w-6 h-6 fill-current" />}

          {/* Pulse ring quando fechado */}
          {!open && (
            <span className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-30 pointer-events-none" />
          )}
        </button>
      </div>
    </>
  );
}
