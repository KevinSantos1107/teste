import { lazy, Suspense } from 'react';
import { useModalsStore } from '../../store/useModalsStore';

const WordGameModal = lazy(() => import('./WordGameModal').then(module => ({ default: module.WordGameModal })));
const SnakeModal = lazy(() => import('./SnakeModal').then(module => ({ default: module.SnakeModal })));
const StarMapModal = lazy(() => import('./StarMapModal').then(module => ({ default: module.StarMapModal })));
const TimelineModalWrapper = lazy(() => import('./TimelineModalWrapper').then(module => ({ default: module.TimelineModalWrapper })));
const CoupleQuizModal = lazy(() => import('../quiz/components/CoupleQuizModal').then(module => ({ default: module.CoupleQuizModal })));

export function GlobalModals() {
  const { activeModal, closeModal } = useModalsStore();

  return (
    <Suspense fallback={null}>
      {activeModal === 'timeline' && <TimelineModalWrapper isOpen={true} onClose={closeModal} />}
      {activeModal === 'word-game' && <WordGameModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'snake' && <SnakeModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'star-map' && <StarMapModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'couple-quiz' && <CoupleQuizModal isOpen={true} onClose={closeModal} />}
    </Suspense>
  );
}
