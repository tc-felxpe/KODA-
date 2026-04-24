import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { SortableBlocks } from '@/components/editor/SortableBlock';
import { SlashCommandMenu } from '@/components/editor/SlashCommandMenu';
import { IconPicker } from '@/components/editor/IconPicker';
import { Button, Modal } from '@/components/ui';
import type { Block, BlockType, Comment } from '@/types';
import {
  Plus, ArrowLeft, MoreHorizontal, Star, Trash2,
  Check, Pencil, MessageSquare, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { currentPage, setCurrentPage, blocks, setBlocks, pages, setPages, addBlock, updateBlock, removeBlock, reorderBlocks, user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [localBlocks, setLocalBlocks] = useState<Block[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const titleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commandsRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pageId) {
      loadPage(pageId);
    }
    return () => {
      setCurrentPage(null);
      setBlocks([]);
      setLocalBlocks([]);
      setComments([]);
    };
  }, [pageId]);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (commandsRef.current && !commandsRef.current.contains(e.target as Node)) {
        setShowCommands(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPage = async (id: string) => {
    try {
      setLoading(true);
      const page = await db.pages.get(id);
      setCurrentPage(page);
      setTitle(page.title || '');
      const pageBlocks = await db.blocks.list(id);
      setBlocks(pageBlocks);
      setLocalBlocks(pageBlocks);
      const pageComments = await db.comments.list(id);
      setComments(pageComments);
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
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [currentPage, setCurrentPage]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current);
    titleTimeoutRef.current = setTimeout(() => {
      if (newTitle.trim()) saveTitle(newTitle);
    }, 800);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim()) saveTitle(title);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditingTitle(false);
      if (title.trim()) saveTitle(title);
    }
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
      setBlocks(blocks);
      setPages(pages.map(p => p.id === updated.id ? updated : p));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleDeletePage = async () => {
    if (!currentPage) return;
    try {
      await db.pages.delete(currentPage.id);
      setShowDeleteConfirm(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  };

  const handleUpdateIcon = async (icon: string) => {
    if (!currentPage) return;
    try {
      const updated = await db.pages.update(currentPage.id, { icon });
      setCurrentPage(updated);
    } catch (error) {
      console.error('Failed to update icon:', error);
    }
  };

  const handleAddComment = async () => {
    if (!currentPage || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const comment = await db.comments.create(currentPage.id, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      await db.comments.delete(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleSlashCommand = (e: React.KeyboardEvent) => {
    if (e.key === '/' && !slashMenuOpen) {
      setSlashMenuOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-[#F8F7FC]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-koda-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-koda-gray-light">Cargando página...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8F7FC]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100">
          <div className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6">
            {/* Left: Back + Title status */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[200px] md:max-w-md">
                    {title || 'Sin título'}
                  </span>
                </div>
                <p className="text-xs text-emerald-500 font-medium ml-6">Guardado</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleFavorite}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  currentPage?.is_favorite
                    ? 'text-koda-purple bg-koda-purple-ghost'
                    : 'text-gray-400 hover:text-koda-purple hover:bg-koda-purple-ghost'
                )}
              >
                <Star className="w-5 h-5" fill={currentPage?.is_favorite ? 'currentColor' : 'none'} />
              </motion.button>

              <div className="relative" ref={commandsRef}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowCommands(!showCommands)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </motion.button>

                <AnimatePresence>
                  {showCommands && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 min-w-[180px] z-40"
                    >
                      <button
                        onClick={() => { handleToggleFavorite(); setShowCommands(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-koda-purple-ghost flex items-center gap-2.5 transition-colors"
                      >
                        <Star className="w-4 h-4 text-koda-purple" />
                        {currentPage?.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      </button>
                      <div className="mx-3 my-1 border-t border-gray-100" />
                      <button
                        onClick={() => { setShowDeleteConfirm(true); setShowCommands(false); }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2.5 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />Eliminar página
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => handleAddBlock('paragraph')}
                className="rounded-lg"
              >
                <span className="hidden md:inline">Bloque</span>
                <span className="md:hidden">+</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Card Header Actions */}
              <div className="flex justify-end p-4 pb-0">
                <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => { setIsEditingTitle(true); setTimeout(() => titleInputRef.current?.focus(), 50); }}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Editar título"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      showComments ? 'bg-koda-purple-ghost text-koda-purple' : 'hover:bg-gray-100 text-gray-500'
                    )}
                    title="Comentarios"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowIconPicker(true)}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
                    title="Agregar icono"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Comments Panel */}
              <AnimatePresence>
                {showComments && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mx-4 mb-2 overflow-hidden"
                  >
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Comentarios ({comments.length})
                        </h4>
                        <button onClick={() => setShowComments(false)} className="p-1 hover:bg-gray-200 rounded-md">
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      {/* Comment Input */}
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          placeholder="Escribe un comentario..."
                          className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-koda-purple/20 focus:border-koda-purple"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddComment}
                          isLoading={isSubmittingComment}
                          disabled={!newComment.trim()}
                        >
                          Enviar
                        </Button>
                      </div>

                      {/* Comments List */}
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {comments.length === 0 ? (
                          <div className="text-sm text-gray-400 text-center py-6">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>Aún no hay comentarios</p>
                            <p className="text-xs mt-1">Sé el primero en comentar</p>
                          </div>
                        ) : (
                          comments.map((comment) => {
                            const isCurrentUser = comment.user_id === user?.id;
                            const isPageAuthor = comment.user_id === currentPage?.created_by;
                            const authorName = isCurrentUser ? (user?.email?.split('@')[0] || 'Tú') : (isPageAuthor ? 'Autor' : 'Usuario');
                            const authorInitials = isCurrentUser ? (user?.email?.slice(0, 2).toUpperCase() || 'TÚ') : (isPageAuthor ? 'AU' : 'US');
                            return (
                              <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-3 group"
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                  isCurrentUser ? "bg-koda-purple" : "bg-koda-purple-pastel"
                                )}>
                                  <span className={cn(
                                    "text-xs font-bold",
                                    isCurrentUser ? "text-white" : "text-koda-purple"
                                  )}>{authorInitials}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-800">{authorName}</span>
                                    <span className="text-xs text-gray-400">
                                      {new Date(comment.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isPageAuthor && (
                                      <span className="text-[10px] font-medium text-koda-purple bg-koda-purple-ghost px-1.5 py-0.5 rounded-full">Autor</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-0.5">{comment.content}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-1.5 rounded-md hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                                  title="Eliminar comentario"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Page Icon & Title */}
              <div className="px-8 pt-2 pb-4">
                <div className="w-16 h-16 rounded-2xl bg-[#EDE8FF] flex items-center justify-center mb-4">
                  <img
                    src="/img/LOGO-KODA-PNG.png"
                    alt="KODA"
                    className="w-10 h-10 object-contain"
                  />
                </div>

                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={title}
                    onChange={handleTitleChange}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    autoFocus
                    className="w-full text-3xl md:text-4xl font-bold text-gray-900 tracking-tight bg-transparent outline-none placeholder-gray-300"
                    placeholder="Título de la página..."
                  />
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight cursor-text hover:bg-gray-50 rounded-lg px-2 -mx-2 py-1 transition-colors"
                  >
                    {title || 'Sin título'}
                  </h1>
                )}

                {currentPage?.icon && currentPage.icon !== '📄' && (
                  <div className="mt-3 text-2xl">{currentPage.icon}</div>
                )}
              </div>

              {/* Blocks Area */}
              <div className="bg-[#F8F7FC] mx-4 mb-4 rounded-xl p-6 min-h-[300px]" onKeyDown={handleSlashCommand}>
                <SortableBlocks
                  blocks={localBlocks}
                  onUpdate={handleUpdateBlock}
                  onDelete={handleDeleteBlock}
                  onDuplicate={handleDuplicateBlock}
                  onReorder={handleReorderBlocks}
                />
              </div>

              {/* Bottom Hint */}
              <div className="px-8 pb-6 text-center">
                <span className="text-sm text-gray-400">Escribe "/" para ver los comandos</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Icon Picker */}
        <IconPicker
          isOpen={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          onSelect={handleUpdateIcon}
          currentIcon={currentPage?.icon}
        />

        {/* Slash Command Menu */}
        <SlashCommandMenu
          isOpen={slashMenuOpen}
          onClose={() => setSlashMenuOpen(false)}
          onSelect={handleAddBlock}
        />

        {/* Delete Confirmation */}
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Eliminar página"
          description="Esta acción no se puede deshacer. ¿Estás seguro?"
        >
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeletePage}>
              Eliminar página
            </Button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
