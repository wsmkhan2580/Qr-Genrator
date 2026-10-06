import { describe, it, expect } from '@jest/globals';
import { createTicketSchema, ticketSearchSchema } from '../../src/validators/ticketValidators.js';
import { updateUserSchema } from '../../src/validators/authValidators.js';

const base = {
  customerName: 'Jordan Test',
  customerPhone: '9876500000',
  eventName: 'Event',
  eventDate: '2027-01-15',
  ticketType: 'General',
  quantity: 1,
};

describe('ticket validators', () => {
  it('accepts a normal ticket', () => {
    expect(createTicketSchema.safeParse(base).success).toBe(true);
  });

  it.each(['2027', 'March 5', '2027-02-31', '2027-13-01', '15-01-2027', ''])(
    'rejects eventDate %p (would otherwise 500 in Postgres)',
    (eventDate) => {
      expect(createTicketSchema.safeParse({ ...base, eventDate }).success).toBe(false);
    }
  );

  it('rejects malformed search date filters', () => {
    expect(ticketSearchSchema.safeParse({ from: 'yesterday' }).success).toBe(false);
    expect(ticketSearchSchema.safeParse({ to: '2027-02-31' }).success).toBe(false);
    expect(ticketSearchSchema.safeParse({ from: '2027-01-01', to: '2027-01-31' }).success).toBe(true);
  });

  it('strips HTML-looking tags from names', () => {
    const r = createTicketSchema.safeParse({ ...base, customerName: 'Bob<script>x</script>' });
    expect(r.success).toBe(true);
    expect(r.data.customerName).not.toContain('<');
  });
});

describe('user validators', () => {
  it('rejects unknown roles', () => {
    expect(updateUserSchema.safeParse({ role: 'SUPERUSER' }).success).toBe(false);
  });
});
