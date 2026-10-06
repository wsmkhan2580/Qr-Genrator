import { registerUser, listUsers, updateUser } from '../modules/users/user.service.js';
import { recordAudit } from '../modules/audit/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assertCanModifyUser } from '../modules/users/user.policy.js';

export const list = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10) || 20, 1), 100);
  const result = await listUsers({ page, pageSize });
  res.json({
    success: true,
    data: {
      users: result.users,
      pagination: { page, pageSize, total: result.total, totalPages: Math.ceil(result.total / pageSize) },
    },
  });
});

export const create = asyncHandler(async (req, res) => {
  assertCanModifyUser(req.user, null);
  const user = await registerUser(req.body);
  await recordAudit({ userId: req.user.id, action: 'worker_created', entityType: 'user', entityId: user.id, req });
  res.status(201).json({ success: true, data: { user } });
});

export const update = asyncHandler(async (req, res) => {
  assertCanModifyUser(req.user, req.params.id, req.body);
  const user = await updateUser(req.params.id, req.body);
  await recordAudit({ userId: req.user.id, action: 'worker_updated', entityType: 'user', entityId: user.id, req });
  res.json({ success: true, data: { user } });
});
