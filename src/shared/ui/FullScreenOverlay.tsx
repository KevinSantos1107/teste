import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';


interface FullScreenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function FullScreenOverlay({ isOpen, onClose, title, subtitle, children, icon }: FullScreenOverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
      window.addEventListener('keydown', onKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-theme-bg flex flex-col animate-in fade-in zoom-in-[0.98] duration-300">
      {/* Dynamic Background matching theme */}
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(circle_at_center,rgba(var(--theme-primary-rgb),0.15)_0%,transparent_70%)]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          {icon && (
            <div className="hidden sm:flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl bg-white/5 border border-white/10 text-theme-secondary shadow-[0_0_15px_rgba(var(--theme-primary-rgb),0.3)]">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-tight drop-shadow-md truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs md:text-sm text-white/60 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all hover:scale-105 active:scale-95 ml-2"
          aria-label="Fechar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content Area */}
      <div ref={contentRef} className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </div>
    </div>,
    document.body
  );
}
