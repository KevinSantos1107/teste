import { WordGame } from '../games/WordGame';
import { FullScreenOverlay } from '../../shared/ui/FullScreenOverlay';
import { Gamepad2 } from 'lucide-react';

export function WordGameModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <FullScreenOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Jogo de Palavras"
      subtitle="Descubra a palavra secreta que marcou nossa história"
      icon={<Gamepad2 className="w-6 h-6" />}
    >
      <div className="max-w-xl mx-auto h-full flex flex-col p-4 md:p-8">
        <WordGame />
      </div>
    </FullScreenOverlay>
  );
}
