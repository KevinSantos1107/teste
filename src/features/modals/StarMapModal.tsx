import { StarMap } from '../maps/StarMap';
import { FullScreenOverlay } from '../../shared/ui/FullScreenOverlay';
import { Stars } from 'lucide-react';

export function StarMapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <FullScreenOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Mapa das Estrelas"
      subtitle="Como estava o céu no nosso momento mais especial"
      icon={<Stars className="w-6 h-6" />}
    >
      <div className="w-full min-h-full flex flex-col p-0">
        <StarMap />
      </div>
    </FullScreenOverlay>
  );
}
