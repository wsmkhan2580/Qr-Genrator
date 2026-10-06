import { describe, it, expect, beforeAll } from '@jest/globals';

process.env.DATABASE_URL ||= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET ||= 'test-secret-at-least-32-characters-long';

let generateTicketCode, createQrPayload, parseQrPayload;

beforeAll(async () => {
  ({ generateTicketCode, createQrPayload, parseQrPayload } = await import('../../src/utils/ticketToken.js'));
});

describe('ticketToken', () => {
  it('generates ticket codes with the expected shape', () => {
    const code = generateTicketCode();
    expect(code).toMatch(/^TQG-[A-Z0-9]{8}$/);
  });

  it('round-trips a QR payload back to the original id and code', () => {
    const payload = createQrPayload('ticket-id-123', 'TQG-ABCD1234');
    const parsed = parseQrPayload(payload);
    expect(parsed).toEqual({ ticketId: 'ticket-id-123', ticketCode: 'TQG-ABCD1234' });
  });

  it('rejects a tampered payload', () => {
    const payload = createQrPayload('ticket-id-123', 'TQG-ABCD1234');
    const tampered = payload.slice(0, -2) + 'zz';
    expect(parseQrPayload(tampered)).toBeNull();
  });

  it('rejects garbage input without throwing', () => {
    expect(parseQrPayload('not-a-real-payload')).toBeNull();
    expect(parseQrPayload('')).toBeNull();
    expect(parseQrPayload(null)).toBeNull();
  });
});
