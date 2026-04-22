import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { SortableBlocks } from '@/components/editor/SortableBlock';
import { SlashCommandMenu } from '@/components/editor/SlashCommandMenu';
import type { Block, BlockType } from '@/types';
import { Plus, ArrowLeft, MoreHorizontal, Star, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { currentPage, setCurrentPage, blocks, setBlocks, addBlock, updateBlock, removeBlock, reorderBlocks } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [showCommands, setShowCommands] = useState(false);
  const [localBlocks, setLocalBlocks] = useState<Block[]>([]);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { 
    if (pageId) loadPage(pageId); 
    return () => { 
      setCurrentPage(null); 
      setBlocks([]); 
      setLocalBlocks([]);
    }; 
  }, [pageId]);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  const loadPage = async (id: string) => { 
    try { 
      setLoading(true); 
      const page = await db.pages.get(id); 
      setCurrentPage(page); 
      setTitle(page.title || ''); 
      const pageBlocks = await db.blocks.list(id); 
      setBlocks(pageBlocks);
      setLocalBlocks(pageBlocks);
    } catch (error) { 
      console.error('Failed to load page:', error); 
      navigate('/dashboard'); 
    } finally { 
      setLoading(false); 
    } 
  };

  const saveTitle = useCallback(async (newTitle: string) => { 
    if (!currentPage || !newTitle.trim()) return; 
    setIsSaving(true);
    try { 
      const updated = await db.pages.update(currentPage.id, { title: newTitle }); 
      setCurrentPage(updated); 
    } catch (error) { 
      console.error('Failed to save title:', error); 
    } finally {
      setIsSaving(false);
    }
  }, [currentPage, setCurrentPage]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(() => {
      if (newTitle.trim()) saveTitle(newTitle);
    }, 1000);
  };

  const handleAddBlock = async (type: BlockType) => { 
    if (!currentPage) return; 
    try { 
      const newBlock = await db.blocks.create({ 
        page_id: currentPage.id, 
        type, 
        content: { text: '' }, 
        position: localBlocks.length 
      } as Partial<Block>);
      const updatedBlocks = [...localBlocks, newBlock];
      setLocalBlocks(updatedBlocks);
      addBlock(newBlock);
    } catch (error) { 
      console.error('Failed to add block:', error);
      alert('Error al agregar el bloque');
    }
  };

  const handleUpdateBlock = async (id: string, updates: Partial<Block>) => { 
    setLocalBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    updateBlock(id, updates); 
    try { 
      await db.blocks.update(id, updates); 
    } catch (error) { 
      console.error('Failed to update block:', error); 
    } 
  };

  const handleDeleteBlock = async (id: string) => { 
    setLocalBlocks(prev => prev.filter(b => b.id !== id));
    removeBlock(id); 
    try { 
      await db.blocks.delete(id); 
    } catch (error) { 
      console.error('Failed to delete block:', error); 
      const pageBlocks = await db.blocks.list(pageId!);
      setLocalBlocks(pageBlocks);
      setBlocks(pageBlocks);
    } 
  };

  const handleDuplicateBlock = async (block: Block) => { 
    try { 
      const newBlock = await db.blocks.create({ 
        page_id: block.page_id, 
        type: block.type, 
        content: block.content, 
        properties: block.properties, 
        position: block.position + 1 
      } as Partial<Block>);
      const updatedBlocks = [...localBlocks, newBlock];
      setLocalBlocks(updatedBlocks);
      addBlock(newBlock);
    } catch (error) { 
      console.error('Failed to duplicate block:', error); 
    } 
  };

  const handleReorderBlocks = async (reorderedBlocks: Block[]) => { 
    setLocalBlocks(reorderedBlocks);
    reorderBlocks(reorderedBlocks); 
    try { 
      await db.blocks.reorder(currentPage!.id, reorderedBlocks.map((b) => b.id)); 
    } catch (error) { 
      console.error('Failed to reorder blocks:', error); 
    } 
  };

  const handleToggleFavorite = async () => { 
    if (!currentPage) return; 
    try { 
      const updated = await db.pages.update(currentPage.id, { is_favorite: !currentPage.is_favorite }); 
      setCurrentPage(updated); 
    } catch (error) { 
      console.error('Failed to toggle favorite:', error); 
    } 
  };

  const handleDeletePage = async () => { 
    if (!currentPage) return; 
    if (!confirm('¿Estás seguro de que quieres eliminar esta página?')) return;
    try { 
      await db.pages.delete(currentPage.id); 
      navigate('/dashboard'); 
    } catch (error) { 
      console.error('Failed to delete page:', error); 
    } 
  };

  const handleSlashCommand = (e: React.KeyboardEvent) => { 
    if (e.key === '/' && !slashMenuOpen) { 
      const selection = window.getSelection(); 
      if (selection) { 
        const range = selection.getRangeAt(0); 
        const rect = range.getBoundingClientRect(); 
        setSlashMenuPosition({ top: rect.bottom + 8, left: rect.left }); 
        setSlashMenuOpen(true); 
      } 
    } 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><div className="text-gray-500">Cargando...</div></div>;

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-3 md:px-4 pl-14 md:pl-4">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-md flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">{currentPage?.icon || '📄'}</span>
              <span className="text-sm font-medium text-gray-700 truncate max-w-[120px] sm:max-w-[200px] md:max-w-[300px]">
                {title || 'Sin título'}
              </span>
              <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:inline">
                {isSaving ? 'Guardando...' : ''}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            <button 
              onClick={handleToggleFavorite} 
              className={cn('p-2 rounded-md', currentPage?.is_favorite ? 'text-yellow-500 bg-yellow-50' : 'hover:bg-gray-100')}
            >
              <Star className="w-5 h-5" fill={currentPage?.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <button 
              onClick={() => setShowCommands(!showCommands)} 
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
            <button 
              onClick={() => handleAddBlock('paragraph')} 
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800"
            >
              <Plus className="w-4 h-4" />Agregar bloque
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-6 md:py-8 px-4 md:px-4">
            <div className="mb-6 md:mb-8">
              <input 
                value={title}
                onChange={handleTitleChange}
                className="w-full text-2xl sm:text-3xl md:text-4xl font-bold bg-transparent outline-none border-b-2 border-transparent hover:border-gray-200 focus:border-gray-900 transition-colors placeholder-gray-300"
                placeholder="Escribe el título de la página..."
              />
            </div>
            
            <div onKeyDown={handleSlashCommand} className="min-h-[300px] md:min-h-[500px]">
              <SortableBlocks 
                blocks={localBlocks} 
                onUpdate={handleUpdateBlock} 
                onDelete={handleDeleteBlock} 
                onDuplicate={handleDuplicateBlock} 
                onReorder={handleReorderBlocks} 
              />
            </div>
            <div className="mt-6 md:mt-8 pt-4 border-t border-gray-100">
              <button 
                onClick={() => handleAddBlock('paragraph')} 
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm"
              >
                <Plus className="w-4 h-4" />Agregar un bloque
              </button>
            </div>
          </div>
        </div>
        <SlashCommandMenu 
          isOpen={slashMenuOpen} 
          onClose={() => setSlashMenuOpen(false)} 
          onSelect={handleAddBlock} 
          position={slashMenuPosition} 
        />
        {showCommands && (
          <div className="absolute right-2 md:right-4 top-14 bg-white border rounded-lg shadow-lg py-2 z-40">
            <button 
              onClick={handleToggleFavorite} 
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            >
              <Star className="w-4 h-4" />
              {currentPage?.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            </button>
            <button 
              onClick={handleDeletePage} 
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-500"
            >
              <Trash2 className="w-4 h-4" />Eliminar página
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
