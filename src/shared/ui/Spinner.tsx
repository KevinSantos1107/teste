import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Spinner = ({ className, size = 'md', ...props }: SpinnerProps) => {
  return (
    <Loader2
      className={cn(
        'animate-spin text-theme-primary',
        {
          'h-4 w-4': size === 'sm',
          'h-8 w-8': size === 'md',
          'h-12 w-12': size === 'lg',
          'h-16 w-16': size === 'xl',
        },
        className
      )}
      {...props}
    />
  );
};
