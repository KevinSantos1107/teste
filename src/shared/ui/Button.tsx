import { forwardRef } from 'react';
import { cn } from '../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 focus:ring-offset-theme-bg disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-theme-primary text-white hover:bg-theme-secondary': variant === 'primary',
            'bg-theme-card-bg text-theme-text hover:bg-theme-card-border border border-theme-card-border': variant === 'secondary',
            'border-2 border-theme-primary text-theme-primary hover:bg-theme-primary/10': variant === 'outline',
            'hover:bg-theme-primary/10 text-theme-text hover:text-theme-primary': variant === 'ghost',
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-8 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
