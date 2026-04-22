import { Request, Response } from 'express';
import { supabase } from '../index.js';

export const pageController = {
  async list(req: Request, res: Response) {
    const { workspaceId } = req.params;
    const { data, error } = await supabase.from('pages').select('*').eq('workspace_id', workspaceId).order('position');
    if (error) return res.status(500).json({ message: 'Failed to fetch pages', error });
    res.json(data);
  },

  async get(req: Request, res: Response) {
    const { id } = req.params;
    const { data, error } = await supabase.from('pages').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ message: 'Page not found' });
    res.json(data);
  },

  async create(req: Request, res: Response) {
    const { workspaceId } = req.params;
    const { parent_id, title, icon, cover_image, is_favorite, position } = req.body;
    const { data, error } = await supabase.from('pages').insert({ workspace_id: workspaceId, parent_id, title, icon, cover_image, is_favorite, position }).select().single();
    if (error) return res.status(400).json({ message: 'Failed to create page', error });
    res.status(201).json(data);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { parent_id, title, icon, cover_image, is_favorite, position } = req.body;
    const { data, error } = await supabase.from('pages').update({ parent_id, title, icon, cover_image, is_favorite, position, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return res.status(400).json({ message: 'Failed to update page' });
    res.json(data);
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) return res.status(400).json({ message: 'Failed to delete page' });
    res.status(204).send();
  }
};