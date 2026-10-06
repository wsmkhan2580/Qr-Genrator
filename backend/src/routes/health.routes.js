import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, data: { status: 'ok', database: 'connected' } });
  } catch {
    res.status(503).json({ success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database unavailable.' } });
  }
});

export default router;
