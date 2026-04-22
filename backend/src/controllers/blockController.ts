import { Request, Response } from 'express';
import { supabase } from '../index.js';

export const blockController = {
  async list(req: Request, res: Response) {
    const { pageId } = req.params;
    const { data, error } = await supabase.from('blocks').select('*').eq('page_id', pageId).order('position');
    if (error) return res.status(500).json({ message: 'Failed to fetch blocks', error });
    res.json(data);
  },

  async create(req: Request, res: Response) {
    const { pageId } = req.params;
    const { type, content, properties, position } = req.body;
    const { data: existingBlocks } = await supabase.from('blocks').select('position').eq('page_id', pageId).order('position', { ascending: false }).limit(1);
    const newPosition = existingBlocks?.[0]?.position ?? -1 + 1;
    const { data, error } = await supabase.from('blocks').insert({ page_id: pageId, type, content, properties, position: position ?? newPosition }).select().single();
    if (error) return res.status(400).json({ message: 'Failed to create block', error });
    res.status(201).json(data);
  },

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { type, content, properties, position } = req.body;
    const { data, error } = await supabase.from('blocks').update({ type, content, properties, position, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) return res.status(400).json({ message: 'Failed to update block' });
    res.json(data);
  },

  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const { error } = await supabase.from('blocks').delete().eq('id', id);
    if (error) return res.status(400).json({ message: 'Failed to delete block' });
    res.status(204).send();
  },

  async reorder(req: Request, res: Response) {
    const { pageId } = req.params;
    const { blockIds } = req.body;
    if (!Array.isArray(blockIds)) return res.status(400).json({ message: 'blockIds must be an array' });
    const updates = blockIds.map((id: string, index: number) => supabase.from('blocks').update({ position: index }).eq('id', id));
    await Promise.all(updates);
    const { data, error } = await supabase.from('blocks').select('*').eq('page_id', pageId).order('position');
    if (error) return res.status(400).json({ message: 'Failed to reorder blocks' });
    res.json(data);
  }
};