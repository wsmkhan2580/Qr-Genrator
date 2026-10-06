import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateUuidParam } from '../middleware/validateParams.js';
import { createUserSchema, updateUserSchema } from '../validators/authValidators.js';

const router = Router();

router.use(requireAuth);

// Managers and admins can list accounts; only admins can create or change them.
router.get('/', requireRole('ADMIN', 'MANAGER'), userController.list);
router.post('/', requireRole('ADMIN'), validate(createUserSchema), userController.create);
router.patch(
  '/:id',
  requireRole('ADMIN'),
  validateUuidParam('id'),
  validate(updateUserSchema),
  userController.update
);

export default router;
