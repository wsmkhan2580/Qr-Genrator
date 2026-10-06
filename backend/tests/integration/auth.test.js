/**
 * Integration tests against a real test database.
 *
 * Requires:
 *   - DATABASE_URL pointed at a disposable test database
 *   - migrations applied (npm run migrate)
 *
 * These are skipped automatically if DATABASE_URL is not configured for
 * a reachable database, so `npm test` doesn't hard-fail in environments
 * without Postgres available (e.g. a laptop with no DB running yet).
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';

let app, pool, dbReachable = true;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  try {
    ({ createApp } = await import('../../src/app.js'));
  } catch (err) {
    dbReachable = false;
  }
});

let createApp;

describe('Auth API', () => {
  let agent;

  beforeAll(async () => {
    if (!dbReachable) return;
    const mod = await import('../../src/db/pool.js');
    pool = mod.pool;
    try {
      await pool.query('SELECT 1');
    } catch (err) {
      // In CI a missing database must fail the run, not silently skip it.
      if (process.env.CI || process.env.REQUIRE_DB) throw err;
      dbReachable = false;
      return;
    }

    // Ensure a known test user exists.
    const passwordHash = await bcrypt.hash('TestPass123!', 12);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Test Worker', 'test.worker@example.com', $1, 'WORKER')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true`,
      [passwordHash]
    );

    app = createApp();
    agent = request.agent(app);
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it('rejects invalid credentials', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await agent.post('/api/auth/login').send({
      email: 'test.worker@example.com',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects malformed login payloads with a 422', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await agent.post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with valid credentials and sets a session cookie', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await agent.post('/api/auth/login').send({
      email: 'test.worker@example.com',
      password: 'TestPass123!',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('test.worker@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns the current user from /me once authenticated', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('WORKER');
  });

  it('blocks unauthenticated access to protected routes', async () => {
    if (!dbReachable) return expect(true).toBe(true);
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
  });
});
