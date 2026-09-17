import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl bg-slate-800/30">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mx-auto mb-6 text-sm">{description}</p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} className="px-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
