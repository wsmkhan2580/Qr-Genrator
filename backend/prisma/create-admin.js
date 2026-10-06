/**
 * Creates (or resets) a real ADMIN account without any demo data.
 *
 * Usage (prompts for anything not provided via environment):
 *   npm run create-admin --workspace backend
 *
 * Or non-interactive:
 *   ADMIN_NAME="Your Name" ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Str0ngPass!' \
 *     npm run create-admin --workspace backend
 */
import readline from 'readline/promises';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool.js';

const PASSWORD_RULES = [
  [(p) => p.length >= 8, 'at least 8 characters'],
  [(p) => /[A-Z]/.test(p), 'an uppercase letter'],
  [(p) => /[a-z]/.test(p), 'a lowercase letter'],
  [(p) => /[0-9]/.test(p), 'a number'],
];

async function ask(rl, question, fallback) {
  if (fallback) return fallback;
  return (await rl.question(question)).trim();
}

async function run() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const name = await ask(rl, 'Admin name: ', process.env.ADMIN_NAME);
    const email = (await ask(rl, 'Admin email: ', process.env.ADMIN_EMAIL)).toLowerCase();
    const password = await ask(rl, 'Admin password: ', process.env.ADMIN_PASSWORD);

    if (name.length < 2) throw new Error('Name must be at least 2 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
    const failed = PASSWORD_RULES.filter(([ok]) => !ok(password)).map(([, msg]) => msg);
    if (failed.length) throw new Error(`Password needs: ${failed.join(', ')}.`);

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'ADMIN', true)
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash,
             role = 'ADMIN', is_active = true
       RETURNING id, email`,
      [name, email, passwordHash]
    );
    console.log(`Admin ready: ${rows[0].email}`);
  } finally {
    rl.close();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('create-admin failed:', err.message);
  process.exit(1);
});
