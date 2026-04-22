import { Router } from 'express';
import { workspaceController } from '../controllers/workspaceController.js';
import { pageController } from '../controllers/pageController.js';
import { blockController } from '../controllers/blockController.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

router.get('/workspaces', workspaceController.list);
router.get('/workspaces/:id', workspaceController.get);
router.post('/workspaces', workspaceController.create);
router.patch('/workspaces/:id', workspaceController.update);
router.delete('/workspaces/:id', workspaceController.delete);

router.get('/workspaces/:workspaceId/pages', pageController.list);
router.get('/pages/:id', pageController.get);
router.post('/workspaces/:workspaceId/pages', pageController.create);
router.patch('/pages/:id', pageController.update);
router.delete('/pages/:id', pageController.delete);

router.get('/pages/:pageId/blocks', blockController.list);
router.post('/pages/:pageId/blocks', blockController.create);
router.post('/pages/:pageId/blocks/reorder', blockController.reorder);
router.patch('/blocks/:id', blockController.update);
router.delete('/blocks/:id', blockController.delete);

export default router;