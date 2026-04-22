import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { signOut } from '@/lib/supabase';
import { Plus, FolderOpen, LogOut, Trash2, MoreHorizontal } from 'lucide-react';
import type { Workspace } from '@/types';

export function Dashboard() {
  const { workspaces, setWorkspaces, currentWorkspace, setCurrentWorkspace, setPages, setUser, isSidebarOpen, user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => { loadWorkspaces(); }, []);
  const loadWorkspaces = async () => { try { setLoading(true); const data = await db.workspaces.list(); setWorkspaces(data); if (data.length > 0) { setCurrentWorkspace(data[0]); const pages = await db.pages.list(data[0].id); setPages(pages); } } catch (error) { console.error('Failed to load workspaces:', error); } finally { setLoading(false); } };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    if (!user) { console.error('No hay usuario autenticado'); return; }
    try { 
      const workspace = await db.workspaces.create({ name: newWorkspaceName, owner_id: user.id } as Partial<Workspace>); 
      setWorkspaces([...workspaces, workspace]); 
      setCurrentWorkspace(workspace); 
      setNewWorkspaceName(''); 
      setShowNewWorkspace(false); 
    } catch (error) { 
      console.error('Failed to create workspace:', error);
      alert('Error al crear el espacio de trabajo');
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

  const handleSignOut = async () => { await signOut(); setUser(null); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Cargando...</div></div>;

  return (
    <div className="min-h-screen flex bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 md:px-4 pl-14 md:pl-4">
          <h1 className="text-base md:text-lg font-semibold truncate">Dashboard</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNewWorkspace(true)} className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-sm md:text-base">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo espacio</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
            <button onClick={handleSignOut} className="p-2 hover:bg-gray-100 rounded-md"><LogOut className="w-5 h-5 text-gray-500" /></button>
          </div>
        </header>
        <div className="p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">Tus espacios de trabajo</h2>
            <p className="text-gray-500 text-sm md:text-base">Organiza tu trabajo en diferentes espacios</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="relative group">
                <Link to={`/workspace/${workspace.id}`} className="block p-4 border rounded-lg hover:border-gray-400 transition-colors">
                  <div className="flex items-center gap-3 mb-2"><FolderOpen className="w-6 h-6 text-gray-500 flex-shrink-0" /><h3 className="font-semibold truncate">{workspace.name}</h3></div>
                  {workspace.description && <p className="text-sm text-gray-500 line-clamp-2">{workspace.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">Creado {new Date(workspace.created_at).toLocaleDateString()}</p>
                </Link>
                <button 
                  onClick={() => setShowWorkspaceMenu(showWorkspaceMenu === workspace.id ? null : workspace.id)}
                  className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-500" />
                </button>
                {showWorkspaceMenu === workspace.id && (
                  <div className="absolute top-8 right-2 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
                    <button 
                      onClick={() => handleDeleteWorkspace(workspace.id)}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />Eliminar espacio
                    </button>
                  </div>
                )}
              </div>
            ))}
            {workspaces.length === 0 && (
              <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                <FolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" /><p className="text-gray-500 mb-4">Aún no hay espacios de trabajo</p>
                <button onClick={() => setShowNewWorkspace(true)} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">Crea tu primer espacio de trabajo</button>
              </div>
            )}
          </div>
        </div>
      </main>
      {showNewWorkspace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nuevo espacio de trabajo</h3>
            <input type="text" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="Nombre del espacio de trabajo" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 mb-4" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewWorkspace(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancelar</button>
              <button onClick={handleCreateWorkspace} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
