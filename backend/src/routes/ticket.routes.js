import { Router } from 'express';
import * as ticketController from '../controllers/ticketController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateUuidParam } from '../middleware/validateParams.js';
import { createTicketSchema, ticketSearchSchema, validateTicketSchema } from '../validators/ticketValidators.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(createTicketSchema), ticketController.create);
router.get('/', validate(ticketSearchSchema, 'query'), ticketController.list);
router.post('/verify', validate(validateTicketSchema), ticketController.validate);
router.get('/:id', validateUuidParam('id'), ticketController.getOne);
router.get('/:id/qr', validateUuidParam('id'), ticketController.getQrImage);
router.post('/:id/validate', validateUuidParam('id'), ticketController.validateById);
router.delete('/:id', validateUuidParam('id'), ticketController.remove);

export default router;
