import { useState, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import { Type, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Quote, Code, Minus } from 'lucide-react';
import type { BlockType } from '@/types';
import type { LucideIcon } from 'lucide-react';

const blockTypes = [
  { type: 'paragraph', label: 'Texto', icon: 'Type', description: 'Empieza a escribir con texto plano.' },
  { type: 'heading-1', label: 'Encabezado 1', icon: 'Heading1', description: 'Encabezado grande de sección.' },
  { type: 'heading-2', label: 'Encabezado 2', icon: 'Heading2', description: 'Encabezado mediano de sección.' },
  { type: 'heading-3', label: 'Encabezado 3', icon: 'Heading3', description: 'Encabezado pequeño de sección.' },
  { type: 'bullet-list', label: 'Lista con viñetas', icon: 'List', description: 'Crea una lista simple con viñetas.' },
  { type: 'numbered-list', label: 'Lista numerada', icon: 'ListOrdered', description: 'Crea una lista con numeración.' },
  { type: 'checklist', label: 'Lista de tareas', icon: 'CheckSquare', description: 'Organiza tareas con una lista de pendientes.' },
  { type: 'quote', label: 'Cita', icon: 'Quote', description: 'Captura una cita.' },
  { type: 'code', label: 'Código', icon: 'Code', description: 'Captura un fragmento de código.' },
  { type: 'divider', label: 'Divisor', icon: 'Minus', description: 'Divide visualmente los bloques.' },
] as const;

const iconMap: Record<string, LucideIcon> = {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
};

interface SlashCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
  position: { top: number; left: number };
}

export function SlashCommandMenu({ isOpen, onClose, onSelect, position }: SlashCommandMenuProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredBlocks = blockTypes.filter((b) => b.label.toLowerCase().includes(search.toLowerCase()));
  const rowVirtualizer = useVirtualizer({
    count: filteredBlocks.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredBlocks.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredBlocks[selectedIndex]) {
          onSelect(filteredBlocks[selectedIndex].type);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredBlocks, selectedIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Responsive positioning: on mobile, center the menu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const menuStyle = isMobile 
    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    : { top: position.top, left: position.left };

  return (
    <div
      ref={listRef}
      className="fixed z-50 bg-white border rounded-lg shadow-xl max-h-[300px] w-[280px] overflow-hidden"
      style={menuStyle}
      onKeyDown={handleKeyDown}
    >
      <div className="p-2 border-b">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar bloques..."
          className="w-full px-2 py-1 text-sm outline-none"
        />
      </div>
      <div className="overflow-y-auto max-h-[220px]">
        {filteredBlocks.length === 0 ? (
          <div className="p-3 text-sm text-gray-400 text-center">No se encontraron bloques</div>
        ) : (
          <div className="py-1">
            {filteredBlocks.map((block, index) => {
              const Icon = iconMap[block.icon];
              return (
                <button
                  key={block.type}
                  onClick={() => {
                    onSelect(block.type);
                    onClose();
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-gray-100',
                    index === selectedIndex && 'bg-gray-100'
                  )}
                >
                  {Icon && <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{block.label}</div>
                    <div className="text-xs text-gray-400 truncate">{block.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
