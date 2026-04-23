import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const POPULAR_ICONS = [
  '📄', '📝', '📊', '📈', '📉', '📋', '📁', '📂', '🗂️',
  '💡', '🔥', '⭐', '🚀', '✅', '⚡', '🎯', '🎨', '🎬',
  '📚', '🎓', '💼', '🏠', '🌍', '📱', '💻', '🔧', '🛠️',
  '📅', '⏰', '🔔', '💬', '📧', '🔗', '📎', '📌', '🏷️',
  '❤️', '👍', '👎', '👀', '🤔', '👋', '🙌', '✨', '🎉',
  '🌟', '🌈', '☀️', '🌙', '☁️', '⚡', '❄️', '🔥', '💧',
  '🌱', '🌲', '🌸', '🍀', '🍎', '🍊', '🍋', '🍇', '🍓',
  '🍕', '🍔', '☕', '🍵', '🍺', '🍷', '🍽️', '🍴', '🥄',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓',
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒',
  '✈️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛳️', '⚓',
  '🏠', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨',
  '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤',
  '⬜', '⬛', '🔶', '🔷', '🔸', '🔹', '💠', '🔘', '💎',
];

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
  currentIcon?: string;
}

export function IconPicker({ isOpen, onClose, onSelect, currentIcon }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? POPULAR_ICONS.filter(icon => icon.includes(search.trim()))
    : POPULAR_ICONS;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[100] w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Seleccionar icono</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar emoji..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-koda-purple/20 focus:border-koda-purple"
                  autoFocus
                />
              </div>
            </div>

            {/* Grid */}
            <div className="px-4 pb-4 max-h-[300px] overflow-y-auto">
              <div className="grid grid-cols-8 gap-1">
                {filtered.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => { onSelect(icon); onClose(); }}
                    className={cn(
                      'aspect-square flex items-center justify-center text-xl rounded-lg transition-all hover:bg-koda-purple-ghost hover:scale-110',
                      currentIcon === icon && 'bg-koda-purple-ghost ring-2 ring-koda-purple'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              {filtered.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">No se encontraron emojis</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
