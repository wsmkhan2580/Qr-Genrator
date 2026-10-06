import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

function isLocalDatabase(url) {
  try {
    const { hostname } = new URL(url);
    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
  } catch {
    return false;
  }
}

// Hosted Postgres (Neon, Supabase, Render...) requires TLS; local dev does
// not. Certificates are verified - never disable verification in production.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isLocalDatabase(env.databaseUrl) ? false : { rejectUnauthorized: true },
});

pool.on('error', (err) => {
  // A background/idle client failed unexpectedly - log and keep the pool alive.
  // eslint-disable-next-line no-console
  console.error('Unexpected PostgreSQL pool error', err);
});

/**
 * Run a single parameterized query. Always use placeholders ($1, $2, ...)
 * never string-concatenate user input into SQL.
 */
export async function query(text, params = []) {
  return pool.query(text, params);
}

/**
 * Run a callback inside a transaction. Commits on success, rolls back on
 * throw. Use for any multi-statement operation that must be atomic
 * (ticket validation, ticket + audit log creation, etc).
 */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
