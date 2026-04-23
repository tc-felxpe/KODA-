import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button, Card, Modal, Skeleton } from '@/components/ui';
import { signOut } from '@/lib/supabase';
import {
  Plus, FolderOpen, FileText, TrendingUp, Users, Search,
  MoreHorizontal, Trash2, Clock, LayoutGrid, List, Star,
  Sparkles, ArrowUpRight, LogOut, Heart, Calendar, Pencil
} from 'lucide-react';
import type { Workspace } from '@/types';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { workspaces, setWorkspaces, pages, setPages, setCurrentWorkspace, setUser, user } = useAppStore();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'inicio';
  const [loading, setLoading] = useState(true);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');

  useEffect(() => { loadWorkspaces(); }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await db.workspaces.list();
      setWorkspaces(data);
      if (data.length > 0) {
        setCurrentWorkspace(data[0]);
      }
      // Load ALL pages from ALL workspaces
      const allPages = [];
      for (const ws of data) {
        const wsPages = await db.pages.list(ws.id);
        allPages.push(...wsPages);
      }
      setPages(allPages);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !user) return;
    try {
      const workspace = await db.workspaces.create({
        name: newWorkspaceName,
        owner_id: user.id
      } as Partial<Workspace>);
      // Add creator as owner in workspace_members (required by some RLS policies)
      await db.workspaceMembers.add(workspace.id, user.id, 'owner');
      setWorkspaces([workspace, ...workspaces]);
      setCurrentWorkspace(workspace);
      setNewWorkspaceName('');
      setShowNewWorkspace(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('¿Eliminar este espacio de trabajo?')) return;
    try {
      await db.workspaces.delete(workspaceId);
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
      setShowWorkspaceMenu(null);
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  const handleEditWorkspace = async (workspaceId: string) => {
    if (!editWorkspaceName.trim()) return;
    try {
      const updated = await db.workspaces.update(workspaceId, { name: editWorkspaceName.trim() });
      setWorkspaces(workspaces.map(w => w.id === workspaceId ? updated : w));
      setEditingWorkspaceId(null);
      setEditWorkspaceName('');
      setShowWorkspaceMenu(null);
    } catch (error) {
      console.error('Failed to update workspace:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const filteredWorkspaces = workspaces.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = pages.length;
  const userName = user?.email?.split('@')[0] || 'Usuario';

  // Generate activity from real data
  const activities = useMemo(() => {
    const acts: { icon: any; iconBg: string; iconColor: string; title: string; desc: string; date: string }[] = [];
    pages.slice(0, 5).forEach(p => {
      acts.push({
        icon: FileText,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-500',
        title: 'Página creada',
        desc: `Nueva página en "${workspaces.find(w => w.id === p.workspace_id)?.name || '...'}"`,
        date: new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      });
    });
    workspaces.slice(0, 3).forEach(w => {
      acts.push({
        icon: FolderOpen,
        iconBg: 'bg-koda-purple-ghost',
        iconColor: 'text-koda-purple',
        title: 'Espacio creado',
        desc: `Nuevo espacio "${w.name}"`,
        date: new Date(w.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      });
    });
    return acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  }, [pages, workspaces]);

  const stats = [
    { value: workspaces.length, label: 'Espacios', sub: 'Total de espacios', icon: FolderOpen, iconBg: 'bg-koda-purple-ghost', iconColor: 'text-koda-purple' },
    { value: totalPages, label: 'Páginas totales', sub: 'Contenido creado', icon: FileText, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
    { value: '98%', label: 'Actividad', sub: 'Nivel de productividad', icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-500', showBar: true },
    { value: '1', label: 'Miembros', sub: 'Colaboradores activos', icon: Users, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8F7FC]">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="px-6 md:px-8 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-sm text-gray-500 mb-0.5">Bienvenido de vuelta, {userName}</h1>
              <p className="text-lg font-medium text-gray-800">¡Qué bueno verte de nuevo!</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowNewWorkspace(true)}
                className="rounded-xl"
              >
                Nuevo espacio
              </Button>
              <button
                onClick={handleSignOut}
                className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="px-6 md:px-8 pb-8 max-w-7xl mx-auto">
          {tab === 'inicio' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                    <Card padding="md" className="h-full">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                          <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                          {stat.showBar && (
                            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full w-[98%] bg-gradient-to-r from-koda-purple to-koda-purple-light rounded-full" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Workspaces Section */}
              <Card padding="lg" className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-koda-purple" />
                      Tus espacios de trabajo
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">Organiza tu trabajo en diferentes espacios</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="Buscar espacios..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-koda-purple/20 focus:border-koda-purple w-56" />
                    </div>
                    <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                      <button onClick={() => setViewMode('grid')} className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-white shadow-sm text-koda-purple' : 'text-gray-400 hover:text-gray-600')}>
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button onClick={() => setViewMode('list')} className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm text-koda-purple' : 'text-gray-400 hover:text-gray-600')}>
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
                    {[1, 2].map((i) => (
                      <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden">
                        <Skeleton className="h-32 w-full" />
                        <div className="p-4 space-y-2">
                          <Skeleton className="w-2/3 h-4" />
                          <Skeleton className="w-1/2 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
                    <AnimatePresence>
                      {filteredWorkspaces.map((workspace, index) => (
                        <motion.div key={workspace.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}>
                          <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-koda-border transition-all duration-300">
                            <div className="h-28 bg-koda-purple-ghost relative flex items-center justify-center">
                              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                <FolderOpen className="w-7 h-7 text-koda-purple" />
                              </div>
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWorkspaceMenu(showWorkspaceMenu === workspace.id ? null : workspace.id); }}
                                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-all">
                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                              </button>
                              <AnimatePresence>
                                {showWorkspaceMenu === workspace.id && (
                                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-3 top-10 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-20 min-w-[150px]">
                                    <button onClick={() => { setEditWorkspaceName(workspace.name); setEditingWorkspaceId(workspace.id); setShowWorkspaceMenu(null); }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600 transition-colors">
                                      <Pencil className="w-4 h-4" />Editar
                                    </button>
                                    <button onClick={() => handleDeleteWorkspace(workspace.id)}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-500 transition-colors">
                                      <Trash2 className="w-4 h-4" />Eliminar
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            {editingWorkspaceId === workspace.id ? (
                              <div className="p-4">
                                <input
                                  autoFocus
                                  value={editWorkspaceName}
                                  onChange={(e) => setEditWorkspaceName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditWorkspace(workspace.id);
                                    if (e.key === 'Escape') { setEditingWorkspaceId(null); setEditWorkspaceName(''); }
                                  }}
                                  onBlur={() => handleEditWorkspace(workspace.id)}
                                  className="w-full text-sm px-3 py-2 rounded-lg border border-koda-purple focus:outline-none focus:ring-2 focus:ring-koda-purple/20"
                                />
                              </div>
                            ) : (
                              <Link to={`/workspace/${workspace.id}`} className="block p-4">
                                <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-koda-purple transition-colors">{workspace.name}</h3>
                                <p className="text-sm text-gray-400 mb-3">{workspace.description || 'Sin descripción'}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    {new Date(workspace.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                  </div>
                                  <span className="text-xs font-medium text-koda-purple bg-koda-purple-ghost px-2.5 py-1 rounded-full">
                                    {pages.filter(p => p.workspace_id === workspace.id).length} páginas
                                  </span>
                                </div>
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {!loading && filteredWorkspaces.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-koda-purple-ghost flex items-center justify-center">
                          <FolderOpen className="w-8 h-8 text-koda-purple-light" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{searchQuery ? 'No se encontraron espacios' : 'Aún no hay espacios'}</h3>
                        <p className="text-sm text-gray-400 mb-4">{searchQuery ? 'Intenta otra búsqueda' : 'Crea tu primer espacio de trabajo'}</p>
                        {!searchQuery && (
                          <Button onClick={() => setShowNewWorkspace(true)} leftIcon={<Plus className="w-4 h-4" />}>Crear espacio</Button>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </Card>

              {/* Bottom Section: Activity + Members */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card padding="lg" className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-koda-purple" />
                      Actividad reciente
                    </h3>
                    <button className="text-sm font-medium text-koda-purple hover:text-koda-purple-hover transition-colors">Ver todo</button>
                  </div>
                  <div className="space-y-3">
                    {activities.length > 0 ? activities.map((act, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl ${act.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <act.icon className={`w-5 h-5 ${act.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{act.title}</p>
                          <p className="text-xs text-gray-400 truncate">{act.desc}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{act.date}</span>
                      </motion.div>
                    )) : (
                      <p className="text-sm text-gray-400 text-center py-8">Sin actividad reciente</p>
                    )}
                  </div>
                </Card>

                <Card padding="lg">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      Miembros activos
                    </h3>
                    <button className="text-sm font-medium text-koda-purple hover:text-koda-purple-hover transition-colors">Ver todos</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-koda-purple-pastel flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-koda-purple">{user?.email?.slice(0, 2).toUpperCase() || 'U'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{user?.email?.split('@')[0] || 'Usuario'}</p>
                      </div>
                      <span className="text-xs font-medium text-koda-purple bg-koda-purple-ghost px-2.5 py-1 rounded-full">Propietario</span>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === 'pages' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-koda-purple" />
                    Todas las páginas
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">{pages.length} {pages.length === 1 ? 'página' : 'páginas'} en total</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map((page, index) => (
                  <motion.div key={page.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                    <Link to={`/page/${page.id}`}>
                      <Card hover padding="md" className="group">
                        <div className="flex items-start gap-3">
                          <img src="/img/LOGO-KODA-PNG.png" alt="" className="w-10 h-10 object-contain" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 truncate group-hover:text-koda-purple transition-colors">{page.title || 'Sin título'}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{workspaces.find(w => w.id === page.workspace_id)?.name || 'Sin espacio'}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
                {pages.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">No hay páginas aún</div>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'favorites' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-koda-purple" />
                    Páginas favoritas
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">Tus páginas más importantes</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.filter(p => p.is_favorite).map((page, index) => (
                  <motion.div key={page.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                    <Link to={`/page/${page.id}`}>
                      <Card hover padding="md" className="group">
                        <div className="flex items-start gap-3">
                          <img src="/img/LOGO-KODA-PNG.png" alt="" className="w-10 h-10 object-contain" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 truncate group-hover:text-koda-purple transition-colors">{page.title || 'Sin título'}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{workspaces.find(w => w.id === page.workspace_id)?.name || 'Sin espacio'}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
                {pages.filter(p => p.is_favorite).length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">No tienes páginas favoritas aún</div>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'recent' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-koda-purple" />
                    Páginas recientes
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">Lo que has visto últimamente</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...pages].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10).map((page, index) => (
                  <motion.div key={page.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                    <Link to={`/page/${page.id}`}>
                      <Card hover padding="md" className="group">
                        <div className="flex items-start gap-3">
                          <img src="/img/LOGO-KODA-PNG.png" alt="" className="w-10 h-10 object-contain" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-800 truncate group-hover:text-koda-purple transition-colors">{page.title || 'Sin título'}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(page.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
                {pages.length === 0 && (
                  <div className="col-span-full text-center py-12 text-gray-400">No hay páginas recientes</div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* New Workspace Modal */}
      <Modal
        isOpen={showNewWorkspace}
        onClose={() => setShowNewWorkspace(false)}
        title="Nuevo espacio de trabajo"
        description="Crea un espacio para organizar tus proyectos y notas"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
            <input
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Ej: Proyectos Personales"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
              className="koda-input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowNewWorkspace(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={!newWorkspaceName.trim()}>
              Crear espacio
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
