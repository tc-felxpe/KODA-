import { supabase } from './supabase';
import type { Block, Page, Workspace } from '@/types';

// Typed helper to bypass strict supabase-js typing without generated DB types
const from = (table: string) => supabase.from(table) as any;

// Helper to show Supabase errors visibly
function handleError(context: string, error: any, data?: any): never {
  const msg = error?.message || error?.error_description || JSON.stringify(error);
  console.error(`[API ERROR] ${context}:`, error, { data });
  // Dispatch custom event for global error handling
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('koda-error', { detail: { context, message: msg } }));
  }
  alert(`Error: ${context}\n\n${msg}`);
  throw error;
}

// Debug wrapper: logs every request and response
async function debugRequest<T>(
  context: string,
  requestFn: () => any
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  console.log(`[API REQUEST] ${context} | Authenticated: ${!!session?.user} | User: ${session?.user?.id ?? 'none'}`);
  
  const { data, error } = await requestFn();
  
  if (error) {
    return handleError(context, error, data);
  }
  if (data === null || data === undefined) {
    const msg = 'La operación no devolvió datos. Posiblemente RLS bloqueó la petición.';
    console.warn(`[API WARNING] ${context}:`, msg);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('koda-error', { detail: { context, message: msg } }));
    }
    alert(`Advertencia: ${context}\n\n${msg}`);
    throw new Error(msg);
  }
  
  console.log(`[API SUCCESS] ${context}:`, data);
  return data as T;
}

export const db = {
  workspaces: {
    list: async () => {
      const { data, error } = await from('workspaces').select('*').order('created_at', { ascending: false });
      if (error) handleError('List workspaces', error);
      return (data || []) as Workspace[];
    },
    get: async (id: string) => {
      return debugRequest<Workspace>('Get workspace', () =>
        from('workspaces').select('*').eq('id', id).single()
      );
    },
    create: async (workspace: Partial<Workspace>) => {
      return debugRequest<Workspace>('Create workspace', () =>
        from('workspaces').insert(workspace).select().single()
      );
    },
    update: async (id: string, workspace: Partial<Workspace>) => {
      return debugRequest<Workspace>('Update workspace', () =>
        from('workspaces').update(workspace).eq('id', id).select().single()
      );
    },
    delete: async (id: string) => {
      const { error } = await from('workspaces').delete().eq('id', id);
      if (error) handleError('Delete workspace', error);
    },
  },
  workspaceMembers: {
    add: async (workspaceId: string, userId: string, role: string = 'owner') => {
      return debugRequest<any>('Add workspace member', () =>
        from('workspace_members').insert({ workspace_id: workspaceId, user_id: userId, role }).select().single()
      );
    },
    list: async (workspaceId: string) => {
      const { data, error } = await from('workspace_members').select('*').eq('workspace_id', workspaceId);
      if (error) handleError('List workspace members', error);
      return (data || []) as any[];
    },
  },
  pages: {
    list: async (workspaceId: string) => {
      const { data, error } = await from('pages').select('*').eq('workspace_id', workspaceId).order('position');
      if (error) handleError('List pages', error);
      return (data || []) as Page[];
    },
    get: async (id: string) => {
      return debugRequest<Page>('Get page', () =>
        from('pages').select('*').eq('id', id).single()
      );
    },
    create: async (page: Partial<Page>) => {
      return debugRequest<Page>('Create page', () =>
        from('pages').insert(page).select().single()
      );
    },
    update: async (id: string, page: Partial<Page>) => {
      return debugRequest<Page>('Update page', () =>
        from('pages').update(page).eq('id', id).select().single()
      );
    },
    delete: async (id: string) => {
      const { error } = await from('pages').delete().eq('id', id);
      if (error) handleError('Delete page', error);
    },
  },
  blocks: {
    list: async (pageId: string) => {
      const { data, error } = await from('blocks').select('*').eq('page_id', pageId).order('position');
      if (error) handleError('List blocks', error);
      return (data || []) as Block[];
    },
    create: async (block: Partial<Block>) => {
      return debugRequest<Block>('Create block', () =>
        from('blocks').insert(block).select().single()
      );
    },
    update: async (id: string, block: Partial<Block>) => {
      return debugRequest<Block>('Update block', () =>
        from('blocks').update(block).eq('id', id).select().single()
      );
    },
    delete: async (id: string) => {
      const { error } = await from('blocks').delete().eq('id', id);
      if (error) handleError('Delete block', error);
    },
    reorder: async (pageId: string, blockIds: string[]) => {
      const updates = blockIds.map((id, index) => from('blocks').update({ position: index }).eq('id', id));
      await Promise.all(updates);
    },
  },
};
