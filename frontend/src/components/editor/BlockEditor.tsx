import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { useDebouncedCallback } from '@/hooks/useAutoSave';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import CodeBlock from '@tiptap/extension-code-block';
import TextAlign from '@tiptap/extension-text-align';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, Copy, MoreHorizontal, Bold, Italic, Underline as UnderlineIcon,
  Strikethrough, Code, Highlighter, AlignLeft, AlignCenter, AlignRight,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Block } from '@/types';

interface BlockEditorProps {
  block: Block;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (block: Block) => void;
  isEditable?: boolean;
}

export function BlockEditor({ block, onUpdate, onDelete, onDuplicate, isEditable = true }: BlockEditorProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Escribe '/' para comandos..." }),
      Underline,
      Typography,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      CodeBlock.configure({ HTMLAttributes: { class: 'code-block' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: block.content.text || '',
    editable: isEditable,
    onUpdate: ({ editor }) => debouncedSave(editor.getHTML()),
    editorProps: {
      attributes: { class: 'focus:outline-none' },
    }
  });

  const debouncedSave = useDebouncedCallback((content: string) => {
    onUpdate(block.id, { content: { text: content } });
  }, 500);

  useEffect(() => () => editor?.destroy(), [editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const getBlockStyles = () => {
    switch (block.type) {
      case 'heading-1': return 'text-2xl sm:text-3xl font-bold mb-3 text-koda-black tracking-tight';
      case 'heading-2': return 'text-xl sm:text-2xl font-semibold mb-2 text-koda-black tracking-tight';
      case 'heading-3': return 'text-lg sm:text-xl font-medium mb-1 text-koda-black tracking-tight';
      case 'quote': return 'border-l-4 border-koda-purple-light pl-4 italic text-koda-gray-purple my-2';
      case 'code': return 'bg-koda-black-soft rounded-lg p-4 font-mono text-sm overflow-x-auto text-koda-purple-light';
      case 'divider': return 'border-t border-koda-border-soft my-4';
      case 'bullet-list': return 'list-disc';
      case 'numbered-list': return 'list-decimal';
      default: return 'text-base leading-relaxed';
    }
  };

  if (!editor) return null;

  return (
    <div className="group relative flex items-start gap-1.5 py-0.5">
      {/* Drag Handle */}
      {isEditable && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1.5 -ml-6 w-6 flex justify-center">
          <GripVertical className="w-4 h-4 text-koda-gray-light cursor-grab" />
        </div>
      )}

      <div className="flex-1 min-h-[1.5em] min-w-0">
        {block.type === 'divider' ? (
          <hr className="border-t border-koda-border-soft my-3" />
        ) : (
          <EditorContent
            editor={editor}
            className={cn('min-h-[1.5em] transition-colors', getBlockStyles())}
          />
        )}
      </div>

      {/* Block Actions */}
      {isEditable && (
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5 flex-shrink-0 pt-1">
          <div ref={menuRef} className="relative">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-koda-hover text-koda-gray-light hover:text-koda-black-soft transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-white border border-koda-border-soft rounded-xl shadow-dropdown py-1 z-20 min-w-[150px]"
                >
                  <button
                    onClick={() => { onDuplicate(block); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-koda-purple-ghost flex items-center gap-2.5 text-koda-black-soft transition-colors"
                  >
                    <Copy className="w-4 h-4 text-koda-gray-purple" />Duplicar
                  </button>
                  <button
                    onClick={() => { onDelete(block.id); setShowMenu(false); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2.5 text-koda-error transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />Eliminar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Bubble Menu */}
      {editor && isEditable && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150, placement: 'top' }}>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-koda-border-soft rounded-xl shadow-dropdown py-1.5 px-1 flex items-center gap-0.5 overflow-x-auto max-w-[90vw]"
          >
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              icon={<Bold className="w-4 h-4" />}
              label="Negrita"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              icon={<Italic className="w-4 h-4" />}
              label="Cursiva"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              icon={<UnderlineIcon className="w-4 h-4" />}
              label="Subrayado"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              icon={<Strikethrough className="w-4 h-4" />}
              label="Tachado"
            />
            <div className="w-px h-5 bg-koda-border-soft mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              icon={<Code className="w-4 h-4" />}
              label="Código"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive('highlight')}
              icon={<Highlighter className="w-4 h-4" />}
              label="Resaltar"
            />
            <div className="w-px h-5 bg-koda-border-soft mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              icon={<AlignLeft className="w-4 h-4" />}
              label="Izquierda"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              icon={<AlignCenter className="w-4 h-4" />}
              label="Centro"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
              icon={<AlignRight className="w-4 h-4" />}
              label="Derecha"
            />
          </motion.div>
        </BubbleMenu>
      )}
    </div>
  );
}

function ToolbarButton({ onClick, active, icon, label }: { onClick: () => void; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        active
          ? 'bg-koda-purple text-white'
          : 'hover:bg-koda-hover text-koda-gray-purple'
      )}
      title={label}
    >
      {icon}
    </motion.button>
  );
}
