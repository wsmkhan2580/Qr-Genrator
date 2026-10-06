import { getAnalyticsOverview } from '../modules/tickets/ticket.service.js';
import { listRecentActivity } from '../modules/audit/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const overview = asyncHandler(async (req, res) => {
  const data = await getAnalyticsOverview(req.user);
  res.json({ success: true, data });
});

export const activity = asyncHandler(async (req, res) => {
  const items = await listRecentActivity(20);
  res.json({ success: true, data: { items } });
});
