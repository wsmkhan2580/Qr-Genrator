import {
  createTicket,
  getTicket,
  listTickets,
  validateTicket,
  cancelTicket,
} from '../modules/tickets/ticket.service.js';
import { renderQrPngDataUrl } from '../utils/qr.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { track } from '../utils/analytics.js';

export const create = asyncHandler(async (req, res) => {
  const ticket = await createTicket(req.body, req.user.id, req);
  const qrImage = await renderQrPngDataUrl(ticket.qrPayload);
  track('ticket_created', { userId: req.user.id, ticketId: ticket.id });
  res.status(201).json({ success: true, data: { ticket, qrImage } });
});

export const list = asyncHandler(async (req, res) => {
  const { page, pageSize, ...rest } = req.query;
  const result = await listTickets({ page, pageSize, ...rest }, req.user);
  track('ticket_search', { userId: req.user.id });
  res.json({
    success: true,
    data: {
      tickets: result.tickets,
      pagination: { page, pageSize, total: result.total, totalPages: Math.ceil(result.total / pageSize) },
    },
  });
});

export const getOne = asyncHandler(async (req, res) => {
  const ticket = await getTicket(req.params.id, req.user);
  const qrImage = await renderQrPngDataUrl(ticket.qrPayload);
  res.json({ success: true, data: { ticket, qrImage } });
});

export const getQrImage = asyncHandler(async (req, res) => {
  const ticket = await getTicket(req.params.id, req.user);
  const qrImage = await renderQrPngDataUrl(ticket.qrPayload);
  track('qr_download', { userId: req.user.id, ticketId: ticket.id });
  res.json({ success: true, data: { qrImage, ticketCode: ticket.ticketCode } });
});

export const remove = asyncHandler(async (req, res) => {
  await cancelTicket(req.params.id, req.user, req);
  res.json({ success: true, data: {} });
});

export const validate = asyncHandler(async (req, res) => {
  const ticket = await validateTicket(req.body.code, req.user, req);
  track('ticket_validation', { userId: req.user.id, ticketId: ticket.id });
  res.json({
    success: true,
    data: { ticket, message: 'Ticket verified successfully.' },
  });
});

// Convenience endpoint for validating a ticket already identified by id
// (e.g. from a "Validate" button on the ticket detail page) - resolves
// to the same code-based validation path under the hood.
export const validateById = asyncHandler(async (req, res) => {
  const existing = await getTicket(req.params.id, req.user);
  const ticket = await validateTicket(existing.ticketCode, req.user, req);
  track('ticket_validation', { userId: req.user.id, ticketId: ticket.id });
  res.json({
    success: true,
    data: { ticket, message: 'Ticket verified successfully.' },
  });
});
