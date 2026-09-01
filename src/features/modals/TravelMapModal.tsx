import { VisitedMap } from '../maps/VisitedMap';
import { FullScreenOverlay } from '../../shared/ui/FullScreenOverlay';
import { Map } from 'lucide-react';

export function TravelMapModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <FullScreenOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Nossas Viagens"
      subtitle="Os lugares incríveis que já visitamos juntos"
      icon={<Map className="w-6 h-6" />}
    >
      <div className="max-w-6xl mx-auto h-full flex flex-col p-4 md:p-8">
        <VisitedMap />
      </div>
    </FullScreenOverlay>
  );
}
