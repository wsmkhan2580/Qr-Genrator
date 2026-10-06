import crypto from 'crypto';
import { env } from '../config/env.js';

/**
 * Human-readable ticket code shown on the printed ticket, e.g. TQG-7F3K9Q.
 * Not secret - just an identifier. Uniqueness is enforced at the DB level.
 */
export function generateTicketCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return `TQG-${code}`;
}

/**
 * The QR code does NOT embed customer PII. It embeds an opaque,
 * HMAC-signed token binding the ticket id + ticket code, so:
 *   - a client can't forge or mutate a payload and have it accepted
 *   - scanning the QR reveals nothing about the customer
 * The server re-verifies the signature and re-checks ticket state on
 * every validation attempt - the QR payload is never trusted blindly.
 */
export function createQrPayload(ticketId, ticketCode) {
  const signature = sign(`${ticketId}.${ticketCode}`);
  const token = Buffer.from(`${ticketId}.${ticketCode}.${signature}`).toString('base64url');
  return `TICKET:${token}`;
}

export function parseQrPayload(payload) {
  if (typeof payload !== 'string') return null;
  const trimmed = payload.trim();
  const raw = trimmed.startsWith('TICKET:') ? trimmed.slice('TICKET:'.length) : trimmed;
  let decoded;
  try {
    decoded = Buffer.from(raw, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  const parts = decoded.split('.');
  if (parts.length !== 3) return null;
  const [ticketId, ticketCode, signature] = parts;
  const expected = sign(`${ticketId}.${ticketCode}`);
  if (!timingSafeEqual(signature, expected)) return null;
  return { ticketId, ticketCode };
}

function sign(value) {
  return crypto.createHmac('sha256', env.ticketTokenSecret).update(value).digest('hex');
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
