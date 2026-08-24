import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-2xl bg-theme-bg p-6 shadow-2xl ring-1 ring-theme-card-border animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-semibold text-theme-text">{title}</h2>}
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-theme-card-bg text-theme-text-secondary hover:text-theme-text transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-theme-text">{children}</div>
      </div>
    </div>,
    document.body
  );
};
