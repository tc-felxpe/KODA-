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
import { Trash2, Copy, MoreHorizontal, Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Highlighter, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
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
      Underline, Typography, TextStyle, Color, Highlight.configure({ multicolor: true }),
      CodeBlock.configure({ HTMLAttributes: { class: 'code-block' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: block.content.text || '',
    editable: isEditable,
    onUpdate: ({ editor }) => debouncedSave(editor.getHTML()),
    editorProps: { attributes: { class: 'focus:outline-none' } }
  });

  const debouncedSave = useDebouncedCallback((content: string) => { onUpdate(block.id, { content: { text: content } }); }, 500);
  useEffect(() => () => editor?.destroy(), [editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false); };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const getBlockStyles = () => {
    switch (block.type) {
      case 'heading-1': return 'text-2xl sm:text-3xl font-bold mb-3';
      case 'heading-2': return 'text-xl sm:text-2xl font-semibold mb-2';
      case 'heading-3': return 'text-lg sm:text-xl font-medium mb-1';
      case 'quote': return 'border-l-4 border-gray-300 pl-4 italic text-gray-600';
      case 'code': return 'bg-gray-100 rounded p-3 font-mono text-sm overflow-x-auto';
      case 'divider': return 'border-t border-gray-200 my-4';
      default: return 'text-base';
    }
  };

  if (!editor) return null;

  return (
    <div className="group relative flex items-start gap-2">
      <div className="flex-1 min-h-[1.5em] min-w-0">
        {block.type === 'divider' ? <hr className="border-t border-gray-200 my-2" /> : <EditorContent editor={editor} className={cn('min-h-[1.5em]', getBlockStyles())} />}
      </div>
      {isEditable && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
          <div ref={menuRef} className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                <button onClick={() => { onDuplicate(block); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"><Copy className="w-4 h-4" />Duplicar</button>
                <button onClick={() => { onDelete(block.id); setShowMenu(false); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-500"><Trash2 className="w-4 h-4" />Eliminar</button>
              </div>
            )}
          </div>
        </div>
      )}
      {editor && isEditable && <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="bg-white border rounded-lg shadow-lg py-1.5 px-1 flex items-center gap-0.5 flex-wrap max-w-[90vw] md:max-w-none">
          <button 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive('bold') && 'bg-gray-200')}
            title="Negrita"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive('italic') && 'bg-gray-200')}
            title="Cursiva"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleUnderline().run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive('underline') && 'bg-gray-200')}
            title="Subrayado"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive('strike') && 'bg-gray-200')}
            title="Tachado"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button 
            onClick={() => editor.chain().focus().toggleCode().run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive('code') && 'bg-gray-200')}
            title="Código"
          >
            <Code className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleHighlight().run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive('highlight') && 'bg-gray-200')}
            title="Resaltar"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          <button 
            onClick={() => editor.chain().focus().setTextAlign('left').run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive({ textAlign: 'left' }) && 'bg-gray-200')}
            title="Alinear izquierda"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor.chain().focus().setTextAlign('center').run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive({ textAlign: 'center' }) && 'bg-gray-200')}
            title="Alinear centro"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button 
            onClick={() => editor.chain().focus().setTextAlign('right').run()} 
            className={cn('p-1.5 rounded hover:bg-gray-100 transition-colors', editor.isActive({ textAlign: 'right' }) && 'bg-gray-200')}
            title="Alinear derecha"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
      </BubbleMenu>}
    </div>
  );
}
