/**
 * useSortableList — hook reutilizável para listas sortáveis com @dnd-kit/sortable.
 *
 * Encapsula DragEndEvent, arrayMove e a lógica de onReorder para deixar
 * os componentes limpos. Retorna os props necessários para DndContext e SortableContext.
 */
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export function useSortableList<T extends { id: string }>(
  items: T[],
  onReorder: (reordered: T[]) => void
) {
  const ids = items.map((item) => item.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered);
  };

  return { ids, handleDragEnd };
}
