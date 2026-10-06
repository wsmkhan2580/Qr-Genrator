import { describe, it, expect, jest, beforeAll } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://x:y@127.0.0.1:1/none';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'unit-test-secret-unit-test-secret-1234';

const ticket = { id: 't1', status: 'ACTIVE', createdBy: 'w1' };
const repo = {
  findTicketById: jest.fn(async () => ticket),
  cancelTicketAtomic: jest.fn(),
};

jest.unstable_mockModule('../../src/db/pool.js', () => ({
  query: jest.fn(),
  pool: {},
  withTransaction: async (cb) => cb({ query: jest.fn(async () => ({ rows: [] })) }),
}));
jest.unstable_mockModule('../../src/modules/audit/audit.service.js', () => ({
  recordAudit: jest.fn(async () => {}),
}));
jest.unstable_mockModule('../../src/modules/tickets/ticket.repository.js', () => ({
  findTicketById: repo.findTicketById,
  findTicketByCode: jest.fn(),
  searchTickets: jest.fn(),
  markTicketUsedAtomic: jest.fn(),
  cancelTicketAtomic: repo.cancelTicketAtomic,
  getTicketStatusById: jest.fn(),
  getStatusCounts: jest.fn(),
  getTodayCount: jest.fn(),
  getTicketsByDay: jest.fn(),
  getTicketsByWorker: jest.fn(),
  listAllForExport: jest.fn(),
}));

let cancelTicket;
beforeAll(async () => {
  ({ cancelTicket } = await import('../../src/modules/tickets/ticket.service.js'));
});

const requester = { id: 'w1', role: 'WORKER' };

describe('cancelTicket', () => {
  it('cancels an active ticket', async () => {
    repo.cancelTicketAtomic.mockResolvedValueOnce({ id: 't1', status: 'CANCELLED' });
    const result = await cancelTicket('t1', requester, {});
    expect(result.status).toBe('CANCELLED');
  });

  it('returns 409 when the ticket was validated between the read and the update', async () => {
    repo.cancelTicketAtomic.mockResolvedValueOnce(null); // conditional UPDATE matched 0 rows
    await expect(cancelTicket('t1', requester, {})).rejects.toMatchObject({ statusCode: 409 });
  });
});
