import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.get('/overview', analyticsController.overview);
// Audit feed exposes other users' names/emails and ticket codes - not for workers.
router.get('/activity', requireRole('MANAGER', 'ADMIN'), analyticsController.activity);

export default router;
