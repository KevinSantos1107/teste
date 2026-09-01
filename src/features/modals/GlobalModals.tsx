import { useModalsStore } from '../../store/useModalsStore';
import { WordGameModal } from './WordGameModal';
import { SnakeModal } from './SnakeModal';
import { StarMapModal } from './StarMapModal';
import { TravelMapModal } from './TravelMapModal';
import { TimelineModalWrapper } from './TimelineModalWrapper';

export function GlobalModals() {
  const { activeModal, closeModal } = useModalsStore();

  return (
    <>
      <TimelineModalWrapper isOpen={activeModal === 'timeline'} onClose={closeModal} />
      <WordGameModal isOpen={activeModal === 'word-game'} onClose={closeModal} />
      <SnakeModal isOpen={activeModal === 'snake'} onClose={closeModal} />
      <StarMapModal isOpen={activeModal === 'star-map'} onClose={closeModal} />
      <TravelMapModal isOpen={activeModal === 'travel-map'} onClose={closeModal} />
    </>
  );
}
