/**
 * Minimal migration runner. Applies every .sql file in database/migrations
 * (relative to project root) in filename order, tracking applied files in
 * a schema_migrations table so re-runs are idempotent.
 *
 * Usage: npm run migrate
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, '../../../database/migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations() {
  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
}

async function run() {
  console.log('Running migrations from', MIGRATIONS_DIR);
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`  apply ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  FAILED ${file}:`, err.message);
      process.exitCode = 1;
      break;
    } finally {
      client.release();
    }
  }

  await pool.end();
}

run();
