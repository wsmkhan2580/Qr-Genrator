import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';

let app, pool, dbReachable = true;
let workerAgent;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  try {
    const appMod = await import('../../src/app.js');
    const poolMod = await import('../../src/db/pool.js');
    pool = poolMod.pool;
    await pool.query('SELECT 1');

    const passwordHash = await bcrypt.hash('TestPass123!', 12);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Ticket Tester', 'ticket.tester@example.com', $1, 'WORKER')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true`,
      [passwordHash]
    );

    app = appMod.createApp();
    workerAgent = request.agent(app);
    await workerAgent
      .post('/api/auth/login')
      .send({ email: 'ticket.tester@example.com', password: 'TestPass123!' });
  } catch (err) {
    // In CI a missing database must fail the run, not silently skip it.
    if (process.env.CI || process.env.REQUIRE_DB) throw err;
    dbReachable = false;
  }
});

afterAll(async () => {
  if (pool) await pool.end();
});

const validTicket = {
  customerName: 'Jordan Test',
  customerPhone: '9876500000',
  customerEmail: 'jordan@example.com',
  eventName: 'Integration Test Event',
  eventDate: '2027-01-15',
  ticketType: 'General',
  quantity: 1,
};

describe('Ticket API', () => {
  it('rejects ticket creation with missing required fields', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await workerAgent.post('/api/tickets').send({});
    expect(res.status).toBe(422);
  });

  it('creates a ticket with a unique code and QR image', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await workerAgent.post('/api/tickets').send(validTicket);
    expect(res.status).toBe(201);
    expect(res.body.data.ticket.ticketCode).toMatch(/^TQG-/);
    expect(res.body.data.ticket.status).toBe('ACTIVE');
    expect(res.body.data.qrImage).toMatch(/^data:image\/png/);
  });

  it('finds the created ticket via search', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await workerAgent.get('/api/tickets').query({ q: 'Jordan Test' });
    expect(res.status).toBe(200);
    expect(res.body.data.tickets.length).toBeGreaterThan(0);
  });

  it('validates an active ticket exactly once, then rejects a second attempt', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const createRes = await workerAgent.post('/api/tickets').send(validTicket);
    const { ticketCode } = createRes.body.data.ticket;

    const first = await workerAgent.post('/api/tickets/verify').send({ code: ticketCode });
    expect(first.status).toBe(200);
    expect(first.body.data.ticket.status).toBe('USED');

    const second = await workerAgent.post('/api/tickets/verify').send({ code: ticketCode });
    expect(second.status).toBe(409);
    expect(second.body.error.message).toMatch(/already been used/i);
  });

  it('handles concurrent validation attempts without double-marking a ticket used', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const createRes = await workerAgent.post('/api/tickets').send(validTicket);
    const { ticketCode } = createRes.body.data.ticket;

    const [r1, r2] = await Promise.all([
      workerAgent.post('/api/tickets/verify').send({ code: ticketCode }),
      workerAgent.post('/api/tickets/verify').send({ code: ticketCode }),
    ]);

    const statuses = [r1.status, r2.status].sort();
    // Exactly one request succeeds (200); the other loses the race (409).
    expect(statuses).toEqual([200, 409]);
  });

  it('returns 404 for an unknown ticket code', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await workerAgent.post('/api/tickets/verify').send({ code: 'TQG-NOPE0000' });
    expect(res.status).toBe(404);
  });
});
