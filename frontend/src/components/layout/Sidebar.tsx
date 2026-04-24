import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Home, LayoutGrid, Star, Clock, FolderOpen,
  Plus, ChevronRight, ChevronDown, X, Menu, LogOut,
  MoreHorizontal, Trash2, Pencil, Command
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/api';
import { signOut } from '@/lib/supabase';
import type { Workspace } from '@/types';
import { cn } from '@/lib/utils';

export function Sidebar({ className }: { className?: string }) {
  const location = useLocation();
  const {
    workspaces, setWorkspaces, setCurrentWorkspace,
    isSidebarOpen, toggleSidebar, user, setUser
  } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState<string | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowWorkspaceMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateWorkspace = async () => {
    if (!user) return;
    try {
      const newWorkspace = await db.workspaces.create({
        name: 'Nuevo espacio',
        owner_id: user.id
      } as Partial<Workspace>);
      setWorkspaces([...workspaces, newWorkspace]);
      setCurrentWorkspace(newWorkspace);
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
    if (!editName.trim()) return;
    try {
      const updated = await db.workspaces.update(workspaceId, { name: editName.trim() });
      setWorkspaces(workspaces.map(w => w.id === workspaceId ? updated : w));
      setEditingWorkspace(null);
      setEditName('');
      setShowWorkspaceMenu(null);
    } catch (error) {
      console.error('Failed to update workspace:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab') || 'inicio';

  const mainNav = [
    { id: 'inicio', label: 'Inicio', icon: Home, path: '/dashboard' },
    { id: 'pages', label: 'Páginas', icon: LayoutGrid, path: '/dashboard?tab=pages' },
    { id: 'favorites', label: 'Favoritos', icon: Star, path: '/dashboard?tab=favorites' },
    { id: 'recent', label: 'Reciente', icon: Clock, path: '/dashboard?tab=recent' },
  ];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center">
          <img
            src="/img/LOGO-KODA-PRINCIPAL.png"
            alt="KODA"
            className="h-10 w-auto"
          />
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 md:hidden">
            <X className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={toggleSidebar} className="hidden md:block p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className={cn('w-4 h-4 text-gray-400 transition-transform duration-300', isSidebarOpen ? 'rotate-180' : '')} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar páginas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-koda-purple/20 focus:border-koda-purple transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-gray-400 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 font-medium">
            <Command className="w-3 h-3" />K
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="px-2 mb-4">
        {mainNav.map((item) => {
          const isActive = item.id === 'inicio'
            ? location.pathname === '/dashboard' && !location.search
            : currentTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-koda-purple-ghost text-koda-purple'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              <item.icon className={cn('w-5 h-5', isActive ? 'text-koda-purple' : 'text-gray-400')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Workspaces Section */}
      <div className="px-4 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mis espacios</span>
          <button
            onClick={handleCreateWorkspace}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-koda-purple transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-2 mb-4">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="relative group">
            {editingWorkspace === workspace.id ? (
              <div className="px-3 py-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditWorkspace(workspace.id);
                    if (e.key === 'Escape') { setEditingWorkspace(null); setEditName(''); }
                  }}
                  onBlur={() => handleEditWorkspace(workspace.id)}
                  className="w-full text-sm px-2 py-1 rounded-lg border border-koda-purple focus:outline-none focus:ring-2 focus:ring-koda-purple/20"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  to={`/workspace/${workspace.id}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
                >
                  <FolderOpen className="w-5 h-5 text-gray-400 group-hover:text-koda-purple transition-colors" />
                  <span className="truncate">{workspace.name}</span>
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowWorkspaceMenu(showWorkspaceMenu === workspace.id ? null : workspace.id);
                  }}
                  className="p-1.5 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <AnimatePresence>
              {showWorkspaceMenu === workspace.id && !editingWorkspace && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 min-w-[140px]"
                >
                  <button
                    onClick={() => { setEditName(workspace.name); setEditingWorkspace(workspace.id); setShowWorkspaceMenu(null); }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />Editar
                  </button>
                  <button
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />Eliminar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* User Profile */}
      <div className="mt-auto p-3 border-t border-gray-100">
        <div className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-koda-purple flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{userInitials}</span>
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">
              {user?.email?.split('@')[0] || 'Usuario'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm md:hidden"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : -300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 flex flex-col w-[260px] md:hidden',
          className
        )}
      >
        {sidebarContent}
      </motion.aside>

      {/* Desktop sidebar */}
      <AnimatePresence>
        {isSidebarOpen ? (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn('hidden md:flex h-screen bg-white border-r border-gray-100 flex-col overflow-hidden flex-shrink-0', className)}
          >
            {sidebarContent}
          </motion.aside>
        ) : (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={toggleSidebar}
            className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 p-2.5 bg-white border border-gray-100 rounded-r-xl shadow-sm hover:shadow-md hover:bg-koda-purple-ghost z-40"
          >
            <ChevronRight className="w-5 h-5 text-koda-purple" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
