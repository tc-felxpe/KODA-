import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { BlockEditor } from './BlockEditor';
import type { Block } from '@/types';
import { cn } from '@/lib/utils';

function SortableBlockItem({ block, onUpdate, onDelete, onDuplicate, isEditable }: {
  block: Block;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (b: Block) => void;
  isEditable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex items-start gap-1 rounded-lg transition-colors',
        isDragging && 'opacity-40 bg-koda-purple-ghost'
      )}
    >
      {isEditable && (
        <button
          {...attributes}
          {...listeners}
          className="mt-1.5 p-1 opacity-0 group-hover:opacity-100 hover:bg-koda-hover rounded-md cursor-grab active:cursor-grabbing text-koda-gray-light hover:text-koda-gray-purple transition-all"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <BlockEditor
          block={block}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          isEditable={isEditable}
        />
      </div>
    </motion.div>
  );
}

export function SortableBlocks({
  blocks, onUpdate, onDelete, onDuplicate, onReorder, isEditable = true
}: {
  blocks: Block[];
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (b: Block) => void;
  onReorder: (blocks: Block[]) => void;
  isEditable?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((i) => i.id === active.id);
      const newIndex = blocks.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(blocks, oldIndex, newIndex);
      onReorder(newItems);
    }
  }, [blocks, onReorder]);

  if (!blocks.length) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-koda-purple-ghost flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-sm text-koda-gray-light">Aún no hay bloques</p>
        <p className="text-xs text-koda-gray-purple mt-1">Escribe / para agregar contenido</p>
      </motion.div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              isEditable={isEditable}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
