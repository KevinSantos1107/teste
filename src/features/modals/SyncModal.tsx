import { SyncGame } from '../games/sync/SyncGame';
import { FullScreenOverlay } from '../../shared/ui/FullScreenOverlay';
import { Heart } from 'lucide-react';

export function SyncModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <FullScreenOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Sincronia"
      subtitle="Pensem na mesma palavra sem combinar 💫"
      icon={<Heart className="w-6 h-6" style={{ strokeDasharray: 'none' }} />}
    >
      <div className="max-w-lg mx-auto h-full flex flex-col">
        <SyncGame onClose={onClose} />
      </div>
    </FullScreenOverlay>
  );
}
