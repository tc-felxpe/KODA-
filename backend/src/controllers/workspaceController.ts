import { Request, Response } from 'express';
import { supabase } from '../index.js';

export const workspaceController = {
  async list(req: Request, res: Response) {
    const { data, error } = await supabase.from('workspaces').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: 'Failed to fetch workspaces', error });
    res.json(data);
  },

  async get(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.from('workspaces').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ message: 'Workspace not found' });
    res.json(data);
  },

  async create(req: Request, res: Response) {
    const { name, description, icon } = req.body;
    const { data, error } = await supabase.from('workspaces').insert({ name, description, icon }).select().single();
    if (error) return res.status(400).json({ message: 'Failed to create workspace', error });
    res.status(201).json(data);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { name, description, icon } = req.body;
    const { data, error } = await supabase.from('workspaces').update({ name, description, icon, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return res.status(400).json({ message: 'Failed to update workspace' });
    res.json(data);
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) return res.status(400).json({ message: 'Failed to delete workspace' });
    res.status(204).send();
  }
};