/**
 * useSortableList — hook reutilizável para listas sortáveis com @dnd-kit/sortable.
 *
 * PointerSensor cobre mouse no desktop.
 * TouchSensor cobre toque no mobile/tablet com delay de 250ms para não conflitar com scroll.
 * MouseSensor foi removido pois PointerSensor já o cobre e causava conflito interno (M_ID error).
 */
import type { DragEndEvent } from '@dnd-kit/core';
import {
  TouchSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export function useSortableList<T extends { id: string }>(
  items: T[],
  onReorder: (reordered: T[]) => void
) {
  const ids = items.map((item) => item.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered);
  };

  return { ids, handleDragEnd, sensors };
}
