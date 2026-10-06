import { exportTickets } from '../modules/tickets/ticket.service.js';
import { toCsv } from '../utils/csv.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { track } from '../utils/analytics.js';

const COLUMNS = [
  { label: 'Ticket Code', value: (t) => t.ticketCode },
  { label: 'Customer Name', value: (t) => t.customerName },
  { label: 'Customer Phone', value: (t) => t.customerPhone },
  { label: 'Customer Email', value: (t) => t.customerEmail || '' },
  { label: 'Event Name', value: (t) => t.eventName },
  { label: 'Event Date', value: (t) => t.eventDate },
  { label: 'Ticket Type', value: (t) => t.ticketType },
  { label: 'Quantity', value: (t) => t.quantity },
  { label: 'Status', value: (t) => t.status },
  { label: 'Created By', value: (t) => t.createdByName || '' },
  { label: 'Created At', value: (t) => t.createdAt },
  { label: 'Validated At', value: (t) => t.validatedAt || '' },
  { label: 'Validated By', value: (t) => t.validatedByName || '' },
];

// Explicitly excludes password hashes, tokens, and any auth secrets -
// only the columns above are ever serialized.
export const exportTicketsCsv = asyncHandler(async (req, res) => {
  const tickets = await exportTickets(req.user);
  const csv = toCsv(tickets, COLUMNS);
  track('csv_export', { userId: req.user.id, count: tickets.length });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="tickets-export-${Date.now()}.csv"`);
  res.send(csv);
});
