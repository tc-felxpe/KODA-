import { useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { BlockEditor } from './BlockEditor';
import type { Block } from '@/types';
import { cn } from '@/lib/utils';

function SortableBlockItem({ block, onUpdate, onDelete, onDuplicate, isEditable }: { block: Block; onUpdate: (id: string, updates: Partial<Block>) => void; onDelete: (id: string) => void; onDuplicate: (b: Block) => void; isEditable: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className={cn('group flex items-start gap-1', isDragging && 'opacity-50')}>
      {isEditable && <button {...attributes} {...listeners} className="mt-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded cursor-grab text-gray-400"><GripVertical className="w-4 h-4" /></button>}
      <div className="flex-1"><BlockEditor block={block} onUpdate={onUpdate} onDelete={onDelete} onDuplicate={onDuplicate} isEditable={isEditable} /></div>
    </div>
  );
}

export function SortableBlocks({ blocks, onUpdate, onDelete, onDuplicate, onReorder, isEditable = true }: { blocks: Block[]; onUpdate: (id: string, updates: Partial<Block>) => void; onDelete: (id: string) => void; onDuplicate: (b: Block) => void; onReorder: (blocks: Block[]) => void; isEditable?: boolean }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((i) => i.id === active.id);
      const newIndex = blocks.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(blocks, oldIndex, newIndex);
      onReorder(newItems);
    }
  }, [blocks, onReorder]);

  if (!blocks.length) return <div className="text-gray-400 text-center py-8">Aún no hay bloques. Haz clic en + para agregar uno.</div>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">{blocks.map((block) => <SortableBlockItem key={block.id} block={block} onUpdate={onUpdate} onDelete={onDelete} onDuplicate={onDuplicate} isEditable={isEditable} />)}</div>
      </SortableContext>
    </DndContext>
  );
}
