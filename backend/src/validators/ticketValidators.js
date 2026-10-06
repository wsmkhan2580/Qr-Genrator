import { z } from 'zod';

// Accepts +91 98765 43210, 9876543210, (91) 98765-43210, etc.
// Rejects obviously invalid input (letters, too short/long).
const PHONE_REGEX = /^\+?[0-9][0-9\s\-().]{6,18}[0-9]$/;

// Strict YYYY-MM-DD that must also be a real calendar date (rejects 2026-02-31).
// Date.parse alone accepts things like "2026" or "March 5" that PostgreSQL's
// DATE type then rejects, turning a user typo into a 500 error.
function isRealIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const isoDate = z.string().trim().refine(isRealIsoDate, 'Enter a valid date (YYYY-MM-DD).');

function normalizePhone(phone) {
  return phone.replace(/[\s\-().]/g, '');
}

const nameField = z
  .string()
  .trim()
  .min(2, 'Must be at least 2 characters.')
  .max(160, 'Must be under 160 characters.')
  // Strip anything that looks like an HTML tag as a defense-in-depth
  // measure; React already escapes output, but we don't want tag-shaped
  // strings persisted either.
  .transform((val) => val.replace(/<[^>]*>/g, ''));

export const createTicketSchema = z.object({
  customerName: nameField,
  customerPhone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Enter a valid phone number.')
    .transform(normalizePhone),
  customerEmail: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(255)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  eventName: z
    .string()
    .trim()
    .min(2, 'Event name must be at least 2 characters.')
    .max(200, 'Event name must be under 200 characters.')
    .transform((val) => val.replace(/<[^>]*>/g, '')),
  eventDate: isoDate,
  ticketType: z.string().trim().min(1, 'Ticket type is required.').max(60),
  quantity: z
    .number()
    .int('Quantity must be a whole number.')
    .positive('Quantity must be positive.')
    .max(1000, 'Quantity is too large.'),
});

export const ticketSearchSchema = z.object({
  q: z.string().trim().max(255).optional(),
  status: z.enum(['ACTIVE', 'USED', 'CANCELLED', 'EXPIRED']).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'eventDate', 'customerName', 'status']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const validateTicketSchema = z.object({
  code: z.string().trim().min(3).max(500), // ticket code or full QR payload
});
