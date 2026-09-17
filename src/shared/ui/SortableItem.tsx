/**
 * SortableItem — wrapper reutilizável para itens sortáveis com @dnd-kit/sortable.
 *
 * Aplica transform/transition CSS automáticos para a animação de deslizamento.
 * O componente filho recebe isDragging e listeners via render prop ou props diretos.
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: (props: {
    isDragging: boolean;
    handleProps: Record<string, any> | undefined;
    setNodeRef: (node: HTMLElement | null) => void;
    style: React.CSSProperties;
  }) => React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return children({
    isDragging,
    handleProps: { ...listeners, ...attributes },
    setNodeRef,
    style,
  });
}
