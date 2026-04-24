import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Code, Minus, Sparkles
} from 'lucide-react';
import type { BlockType } from '@/types';
import type { LucideIcon } from 'lucide-react';

const blockTypes = [
  { type: 'paragraph', label: 'Texto', icon: Type, description: 'Empieza a escribir con texto plano.', color: 'bg-koda-purple-pastel text-koda-purple' },
  { type: 'heading-1', label: 'Encabezado 1', icon: Heading1, description: 'Encabezado grande de sección.', color: 'bg-blue-50 text-blue-500' },
  { type: 'heading-2', label: 'Encabezado 2', icon: Heading2, description: 'Encabezado mediano de sección.', color: 'bg-emerald-50 text-emerald-500' },
  { type: 'heading-3', label: 'Encabezado 3', icon: Heading3, description: 'Encabezado pequeño de sección.', color: 'bg-amber-50 text-amber-500' },
  { type: 'bullet-list', label: 'Lista con viñetas', icon: List, description: 'Crea una lista simple con viñetas.', color: 'bg-rose-50 text-rose-500' },
  { type: 'numbered-list', label: 'Lista numerada', icon: ListOrdered, description: 'Crea una lista con numeración.', color: 'bg-cyan-50 text-cyan-500' },
  { type: 'checklist', label: 'Lista de tareas', icon: CheckSquare, description: 'Organiza tareas con checkboxes.', color: 'bg-green-50 text-green-500' },
  { type: 'quote', label: 'Cita', icon: Quote, description: 'Captura una cita importante.', color: 'bg-orange-50 text-orange-500' },
  { type: 'code', label: 'Código', icon: Code, description: 'Fragmento de código con sintaxis.', color: 'bg-slate-100 text-slate-600' },
  { type: 'divider', label: 'Divisor', icon: Minus, description: 'Separa visualmente los bloques.', color: 'bg-gray-100 text-gray-500' },
] as const;

interface SlashCommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: BlockType) => void;
}

export function SlashCommandMenu({ isOpen, onClose, onSelect }: SlashCommandMenuProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredBlocks = blockTypes.filter((b) =>
    b.label.toLowerCase().includes(search.toLowerCase()) ||
    b.description.toLowerCase().includes(search.toLowerCase())
  );

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
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Auto-scroll to selected item
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        {/* Centering wrapper - ensures modal stays in viewport on mobile */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto bg-white border border-koda-border-soft rounded-2xl shadow-dropdown max-h-[60vh] w-full max-w-[320px] overflow-hidden"
            onKeyDown={handleKeyDown}
          >
          {/* Header */}
          <div className="p-3 border-b border-koda-border-soft">
            <div className="flex items-center gap-2 px-2">
              <Sparkles className="w-4 h-4 text-koda-purple" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar bloques..."
                className="flex-1 text-sm outline-none text-koda-black placeholder-koda-gray-light bg-transparent"
              />
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[calc(60vh-80px)] p-1.5">
            {filteredBlocks.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-koda-purple-ghost flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-koda-purple-light" />
                </div>
                <p className="text-sm text-koda-gray-purple">No se encontraron bloques</p>
                <p className="text-xs text-koda-gray-light mt-0.5">Intenta con otra búsqueda</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredBlocks.map((block, index) => {
                  const Icon = block.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <motion.button
                      key={block.type}
                      data-index={index}
                      onClick={() => {
                        onSelect(block.type);
                        onClose();
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-3 transition-all duration-150',
                        isSelected
                          ? 'bg-koda-purple-ghost'
                          : 'hover:bg-koda-hover'
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', block.color)}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn('text-sm font-medium', isSelected ? 'text-koda-purple' : 'text-koda-black')}>{block.label}</div>
                        <div className="text-xs text-koda-gray-light truncate">{block.description}</div>
                      </div>
                      {isSelected && (
                        <motion.div
                          layoutId="slash-selected"
                          className="w-1.5 h-1.5 rounded-full bg-koda-purple flex-shrink-0"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-koda-border-soft bg-koda-purple-ghost/50">
            <div className="flex items-center justify-between text-[10px] text-koda-gray-light">
              <span>↑↓ Navegar</span>
              <span>↵ Seleccionar</span>
              <span>Esc Cerrar</span>
            </div>
          </div>
          </motion.div>
        </div>
      </>
    </AnimatePresence>,
    document.body
  );
}
