import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button, Card, Modal, Input, Skeleton } from '@/components/ui';
import {
  Plus, FileText, ArrowLeft, FolderOpen, Search,
  Clock, ArrowUpRight, Sparkles, LayoutGrid
} from 'lucide-react';
import type { Page } from '@/types';

export function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { workspaces, currentWorkspace, setCurrentWorkspace, pages, setPages, user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (workspaceId) loadWorkspace(workspaceId);
  }, [workspaceId]);

  const loadWorkspace = async (id: string) => {
    try {
      setLoading(true);
      const workspace = workspaces.find(w => w.id === id);
      if (workspace) setCurrentWorkspace(workspace);
      const pagesData = await db.pages.list(id);
      const otherPages = pages.filter(p => p.workspace_id !== id);
      setPages([...otherPages, ...pagesData]);
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !workspaceId) return;
    try {
      if (!user?.id) throw new Error('Usuario no autenticado');
      const newPage = await db.pages.create({
        workspace_id: workspaceId,
        parent_id: null,
        title: newPageTitle,
        created_by: user.id
      } as Partial<Page>);
      setPages([...pages, newPage]);
      setNewPageTitle('');
      setShowNewPage(false);
      navigate(`/page/${newPage.id}`);
    } catch (error) {
      console.error('Failed to create page:', error);
    }
  };

  const filteredPages = pages.filter(p =>
    p.workspace_id === workspaceId &&
    p.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-koda-background">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-koda-background/80 backdrop-blur-md border-b border-koda-border-soft">
          <div className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-1.5 md:p-2 rounded-lg hover:bg-koda-hover transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-koda-gray-purple" />
              </button>
              <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-koda-purple-pastel flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-4 h-4 md:w-5 md:h-5 text-koda-purple" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm md:text-base font-semibold text-koda-black truncate max-w-[150px] md:max-w-md">
                    {currentWorkspace?.name || 'Espacio de trabajo'}
                  </h1>
                  <p className="text-xs text-koda-gray-light hidden sm:block">
                    {pages.length} {pages.length === 1 ? 'página' : 'páginas'}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowNewPage(true)}
            >
              <span className="hidden sm:inline">Nueva página</span>
              <span className="sm:hidden">Nueva</span>
            </Button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-koda-black flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-koda-purple" />
                Páginas
              </h2>
              <p className="text-sm text-koda-gray-purple mt-0.5">
                Gestiona todas las páginas de este espacio
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-koda-gray-light" />
              <input
                type="text"
                placeholder="Buscar páginas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="koda-input pl-9 w-full sm:w-64"
              />
            </div>
          </div>

          {/* Pages Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} padding="md">
                  <Skeleton variant="circular" width={40} height={40} className="mb-3" />
                  <Skeleton className="w-2/3 mb-2" />
                  <Skeleton className="w-1/2" />
                </Card>
              ))}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredPages.map((page, index) => (
                  <motion.div
                    key={page.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover padding="md" className="group">
                      <Link to={`/page/${page.id}`} className="block">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 rounded-xl bg-koda-purple-ghost flex items-center justify-center group-hover:bg-koda-purple group-hover:shadow-glow-sm transition-all duration-300">
                            <img src="/img/LOGO-KODA-PNG.png" alt="" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
                          </div>
                          {page.is_favorite && (
                            <Sparkles className="w-4 h-4 text-koda-purple" />
                          )}
                        </div>
                        <h3 className="font-semibold text-koda-black group-hover:text-koda-purple transition-colors mb-1 truncate">
                          {page.title || 'Sin título'}
                        </h3>
                        <div className="flex items-center justify-between pt-3 border-t border-koda-border-soft">
                          <div className="flex items-center gap-1.5 text-xs text-koda-gray-light">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(page.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-koda-purple opacity-0 group-hover:opacity-100 transition-opacity">
                            Abrir <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty State */}
              {!loading && filteredPages.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full">
                  <Card padding="lg" className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-koda-purple-ghost flex items-center justify-center">
                      <FileText className="w-8 h-8 text-koda-purple-light" />
                    </div>
                    <h3 className="text-lg font-semibold text-koda-black mb-1">
                      {searchQuery ? 'No se encontraron páginas' : 'Aún no hay páginas'}
                    </h3>
                    <p className="text-sm text-koda-gray-purple mb-6 max-w-sm mx-auto">
                      {searchQuery
                        ? 'Intenta con otro término de búsqueda'
                        : 'Crea tu primera página para comenzar a tomar notas'}
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowNewPage(true)} leftIcon={<Plus className="w-4 h-4" />}>
                        Crear página
                      </Button>
                    )}
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* New Page Modal */}
      <Modal
        isOpen={showNewPage}
        onClose={() => setShowNewPage(false)}
        title="Nueva página"
        description="Crea una nueva página en este espacio de trabajo"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            placeholder="Ej: Notas de la reunión"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowNewPage(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePage} disabled={!newPageTitle.trim()}>
              Crear página
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
