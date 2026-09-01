import { SnakeGame } from '../games/SnakeGame';
import { FullScreenOverlay } from '../../shared/ui/FullScreenOverlay';
import { Worm } from 'lucide-react';

export function SnakeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <FullScreenOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Cobrinha"
      subtitle="Use as setas ou deslize na tela para jogar"
      icon={<Worm className="w-6 h-6" />}
    >
      <div className="max-w-2xl mx-auto h-full flex flex-col p-4 md:p-8">
        <SnakeGame />
      </div>
    </FullScreenOverlay>
  );
}
