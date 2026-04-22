import { create } from 'zustand';
import type { User, Workspace, Page, Block } from '@/types';

interface AppState {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  pages: Page[];
  currentPage: Page | null;
  blocks: Block[];
  isLoading: boolean;
  isSidebarOpen: boolean;
  setUser: (user: User | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setPages: (pages: Page[]) => void;
  setCurrentPage: (page: Page | null) => void;
  setBlocks: (blocks: Block[]) => void;
  addBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (blocks: Block[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  workspaces: [],
  currentWorkspace: null,
  pages: [],
  currentPage: null,
  blocks: [],
  isLoading: false,
  isSidebarOpen: true,
  setUser: (user) => set({ user }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setPages: (pages) => set({ pages }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setBlocks: (blocks) => set({ blocks }),
  addBlock: (block) => set((state) => ({ blocks: [...state.blocks, block] })),
  updateBlock: (id, updates) => set((state) => ({ blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)) })),
  removeBlock: (id) => set((state) => ({ blocks: state.blocks.filter((b) => b.id !== id) })),
  reorderBlocks: (blocks) => set({ blocks }),
  setIsLoading: (isLoading) => set({ isLoading }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));