import { supabase } from './supabase';
import type { Block, Page, Workspace } from '@/types';

export const db = {
  workspaces: {
    list: async () => {
      const { data, error } = await supabase.from('workspaces').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Workspace[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('workspaces').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Workspace;
    },
    create: async (workspace: Partial<Workspace>) => {
      const { data, error } = await supabase.from('workspaces').insert(workspace).select().single();
      if (error) throw error;
      return data as Workspace;
    },
    update: async (id: string, workspace: Partial<Workspace>) => {
      const { data, error } = await supabase.from('workspaces').update(workspace).eq('id', id).select().single();
      if (error) throw error;
      return data as Workspace;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('workspaces').delete().eq('id', id);
      if (error) throw error;
    },
  },
  pages: {
    list: async (workspaceId: string) => {
      const { data, error } = await supabase.from('pages').select('*').eq('workspace_id', workspaceId).order('position');
      if (error) throw error;
      return data as Page[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase.from('pages').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Page;
    },
    create: async (page: Partial<Page>) => {
      const { data, error } = await supabase.from('pages').insert(page).select().single();
      if (error) throw error;
      return data as Page;
    },
    update: async (id: string, page: Partial<Page>) => {
      const { data, error } = await supabase.from('pages').update(page).eq('id', id).select().single();
      if (error) throw error;
      return data as Page;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
    },
  },
  blocks: {
    list: async (pageId: string) => {
      const { data, error } = await supabase.from('blocks').select('*').eq('page_id', pageId).order('position');
      if (error) throw error;
      return data as Block[];
    },
    create: async (block: Partial<Block>) => {
      const { data, error } = await supabase.from('blocks').insert(block).select().single();
      if (error) throw error;
      return data as Block;
    },
    update: async (id: string, block: Partial<Block>) => {
      const { data, error } = await supabase.from('blocks').update(block).eq('id', id).select().single();
      if (error) throw error;
      return data as Block;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('blocks').delete().eq('id', id);
      if (error) throw error;
    },
    reorder: async (pageId: string, blockIds: string[]) => {
      const updates = blockIds.map((id, index) => supabase.from('blocks').update({ position: index }).eq('id', id));
      await Promise.all(updates);
    },
  },
};