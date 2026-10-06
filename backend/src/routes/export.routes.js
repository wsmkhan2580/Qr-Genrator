import { Router } from 'express';
import { exportTicketsCsv } from '../controllers/exportController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/tickets', requireAuth, exportTicketsCsv);

export default router;
