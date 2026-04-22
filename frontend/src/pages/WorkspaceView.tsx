import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Plus, FileText, ArrowLeft, FolderOpen } from 'lucide-react';
import type { Page } from '@/types';

export function WorkspaceView() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { workspaces, currentWorkspace, setCurrentWorkspace, pages, setPages, user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace(workspaceId);
    }
  }, [workspaceId]);

  const loadWorkspace = async (id: string) => {
    try {
      setLoading(true);
      const workspace = workspaces.find(w => w.id === id);
      if (workspace) {
        setCurrentWorkspace(workspace);
      }
      const pagesData = await db.pages.list(id);
      setPages(pagesData);
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !workspaceId) return;
    try {
      const newPage = await db.pages.create({
        workspace_id: workspaceId,
        parent_id: null,
        title: newPageTitle,
        created_by: user?.id || 'user'
      } as Partial<Page>);
      setPages([...pages, newPage]);
      setNewPageTitle('');
      setShowNewPage(false);
      navigate(`/page/${newPage.id}`);
    } catch (error) {
      console.error('Failed to create page:', error);
      alert('Error al crear la página');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-3 md:px-4 pl-14 md:pl-4">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2 hover:bg-gray-100 rounded-md flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <FolderOpen className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <h1 className="text-base md:text-lg font-semibold truncate max-w-[150px] sm:max-w-[250px] md:max-w-[400px]">
                {currentWorkspace?.name || 'Espacio de trabajo'}
              </h1>
            </div>
          </div>
          <button 
            onClick={() => setShowNewPage(true)}
            className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm md:text-base flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva página</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </header>

        <div className="p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Páginas</h2>
            <p className="text-gray-500 text-sm md:text-base">Todas las páginas de este espacio de trabajo</p>
          </div>

          {pages.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Aún no hay páginas</p>
              <button 
                onClick={() => setShowNewPage(true)}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
              >
                Crear primera página
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {pages.map((page) => (
                <Link 
                  key={page.id} 
                  to={`/page/${page.id}`}
                  className="p-4 border rounded-lg hover:border-gray-400 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl flex-shrink-0">{page.icon || '📄'}</span>
                    <h3 className="font-semibold truncate">{page.title || 'Sin título'}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Creado {new Date(page.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {showNewPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nueva página</h3>
            <input 
              type="text" 
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Título de la página"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowNewPage(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreatePage}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
