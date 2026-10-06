import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { loginSchema } from '../validators/authValidators.js';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
