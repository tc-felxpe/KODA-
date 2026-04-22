import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Plus, FolderOpen, Star, Clock, Search, Trash2, MoreHorizontal, Menu, X } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/api';
import { MarqueeText } from '@/components/ui/MarqueeText';
import type { Page, Workspace } from '@/types';
import { cn } from '@/lib/utils';

export function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const { workspaces, currentWorkspace, pages, setWorkspaces, setCurrentWorkspace, setPages, isSidebarOpen, toggleSidebar, user } = useAppStore();
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'pages' | 'favorites' | 'recent'>('pages');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleWorkspace = (workspaceId: string) => { setExpandedWorkspaces((prev) => { const next = new Set(prev); next.has(workspaceId) ? next.delete(workspaceId) : next.add(workspaceId); return next; }); };
  const togglePage = (pageId: string) => { setExpandedPages((prev) => { const next = new Set(prev); next.has(pageId) ? next.delete(pageId) : next.add(pageId); return next; }); };

  const handleCreatePage = async (parentId?: string) => {
    if (!currentWorkspace) return;
    if (!user) { console.error('No hay usuario autenticado'); return; }
    try { 
      const newPage = await db.pages.create({ workspace_id: currentWorkspace.id, parent_id: parentId || null, title: 'Sin título', created_by: user.id } as Partial<Page>); 
      setPages([...pages, newPage]); 
    } catch (error) { 
      console.error('Failed to create page:', error);
      alert('Error al crear la página');
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este espacio de trabajo? Se eliminarán todas las páginas y bloques asociados.')) return;
    try {
      await db.workspaces.delete(workspaceId);
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(null);
      }
      setShowWorkspaceMenu(null);
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      alert('Error al eliminar el espacio de trabajo');
    }
  };

  const handleCreateWorkspace = async () => {
    if (!user) { console.error('No hay usuario autenticado'); return; }
    try { 
      const newWorkspace = await db.workspaces.create({ name: 'Nuevo espacio de trabajo', owner_id: user.id } as Partial<Workspace>); 
      setWorkspaces([...workspaces, newWorkspace]); 
      setCurrentWorkspace(newWorkspace); 
    } catch (error) { 
      console.error('Failed to create workspace:', error);
      alert('Error al crear el espacio de trabajo');
    }
  };

  const getChildPages = (parentId: string | null): Page[] => pages.filter((p) => p.parent_id === parentId);
  
  const getFilteredPages = () => {
    switch (activeTab) {
      case 'favorites': return pages.filter(p => p.is_favorite);
      case 'recent': return [...pages].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10);
      case 'pages': default: return pages;
    }
  };

  const sidebarContent = (
    <>
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-700">KODA</h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setMobileOpen(false)} 
              className="p-1 hover:bg-gray-200 rounded md:hidden"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <button 
              onClick={toggleSidebar} 
              className="hidden md:block p-1 hover:bg-gray-200 rounded"
            >
              <ChevronRight className={cn('w-4 h-4 text-gray-500 transition-transform', isSidebarOpen ? 'rotate-180' : '')} />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300" 
          />
        </div>
      </div>
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('pages')} className={cn('flex-1 py-2 text-sm font-medium', activeTab === 'pages' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500')}>Páginas</button>
        <button onClick={() => setActiveTab('favorites')} className={cn('flex-1 py-2 text-sm font-medium', activeTab === 'favorites' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500')}><Star className="w-4 h-4 mx-auto" /></button>
        <button onClick={() => setActiveTab('recent')} className={cn('flex-1 py-2 text-sm font-medium', activeTab === 'recent' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500')}><Clock className="w-4 h-4 mx-auto" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'pages' && workspaces.map((workspace) => (
          <div key={workspace.id} className="mb-1">
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-200 cursor-pointer group" onClick={() => toggleWorkspace(workspace.id)}>
              <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', expandedWorkspaces.has(workspace.id) && 'rotate-90')} />
              <FolderOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <MarqueeText text={workspace.name} containerClassName="flex-1 max-w-[200px] md:max-w-[160px]" className="text-sm font-medium" />
              <div className="relative flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); setShowWorkspaceMenu(showWorkspaceMenu === workspace.id ? null : workspace.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded">
                  <MoreHorizontal className="w-3 h-3 text-gray-500" />
                </button>
                {showWorkspaceMenu === workspace.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(workspace.id); }} className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-500">
                      <Trash2 className="w-4 h-4" />Eliminar
                    </button>
                  </div>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleCreatePage(); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-300 rounded flex-shrink-0"><Plus className="w-3 h-3 text-gray-500" /></button>
            </div>
            {expandedWorkspaces.has(workspace.id) && (
              <div className="ml-4">{getChildPages(null).map((page) => {
                const childPages = getChildPages(page.id);
                return (
                  <Link key={page.id} to={`/page/${page.id}`} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-gray-200 cursor-pointer group', location.pathname === `/page/${page.id}` && 'bg-gray-200')}>
                    {childPages.length > 0 ? <button onClick={(e) => { e.preventDefault(); togglePage(page.id); }} className="flex-shrink-0"><ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform', expandedPages.has(page.id) && 'rotate-90')} /></button> : <span className="w-4 flex-shrink-0" />}
                    <span className="text-lg flex-shrink-0">{page.icon}</span>
                    <MarqueeText text={page.title || 'Sin título'} containerClassName="flex-1 max-w-[180px] md:max-w-[140px]" className="text-sm" />
                  </Link>
                );
              })}</div>
            )}
          </div>
        ))}
        {activeTab === 'favorites' && (
          <div className="p-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Favoritos</h3>
            {getFilteredPages().length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay favoritos</p>
            ) : (
              getFilteredPages().map((page) => (
                <Link key={page.id} to={`/page/${page.id}`} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-200 cursor-pointer', location.pathname === `/page/${page.id}` && 'bg-gray-200')}>
                  <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" />
                  <span className="text-lg flex-shrink-0">{page.icon}</span>
                  <MarqueeText text={page.title || 'Sin título'} containerClassName="flex-1 max-w-[200px] md:max-w-[160px]" className="text-sm" />
                </Link>
              ))
            )}
          </div>
        )}
        {activeTab === 'recent' && (
          <div className="p-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recientes</h3>
            {getFilteredPages().length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay páginas recientes</p>
            ) : (
              getFilteredPages().map((page) => (
                <Link key={page.id} to={`/page/${page.id}`} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-200 cursor-pointer', location.pathname === `/page/${page.id}` && 'bg-gray-200')}>
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-lg flex-shrink-0">{page.icon}</span>
                  <MarqueeText text={page.title || 'Sin título'} containerClassName="flex-1 max-w-[200px] md:max-w-[160px]" className="text-sm" />
                </Link>
              ))
            )}
          </div>
        )}
      </div>
      <div className="p-2 border-t border-gray-200">
        <button onClick={handleCreateWorkspace} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md"><Plus className="w-4 h-4" />Nuevo espacio de trabajo</button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button - ALWAYS visible on mobile */}
      <button 
        onClick={() => setMobileOpen(true)} 
        className="fixed top-3 left-3 z-50 p-2 bg-white border rounded-md shadow-sm md:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      
      {/* Mobile sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 bg-gray-50 border-r border-gray-200 flex flex-col w-72 transform transition-transform duration-300 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        className
      )}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      {isSidebarOpen ? (
        <aside className={cn('hidden md:flex h-screen bg-gray-50 border-r border-gray-200 flex-col w-72', className)}>
          {sidebarContent}
        </aside>
      ) : (
        <button 
          onClick={toggleSidebar} 
          className={cn('hidden md:block fixed left-0 top-1/2 -translate-y-1/2 p-2 bg-white border-r border-gray-200 rounded-r-lg hover:bg-gray-50 z-40', className)}
        >
          <ChevronRight className="w-5 h-5 text-gray-500" />
        </button>
      )}
    </>
  );
}
