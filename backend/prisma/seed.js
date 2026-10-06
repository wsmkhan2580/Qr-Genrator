/**
 * Seeds development-only demo data:
 *   - 1 admin, 1 manager, 2 workers
 *   - a handful of sample tickets in various statuses
 *   - a few audit log entries
 *
 * IMPORTANT: these are development-only credentials. Never use them,
 * or anything resembling them, in a production deployment.
 *
 * Usage: npm run seed
 */
import bcrypt from 'bcryptjs';
import { pool } from '../src/db/pool.js';
import { generateTicketCode, createQrPayload } from '../src/utils/ticketToken.js';

const DEMO_PASSWORD = 'DemoPass123!';

// The demo password is public (it's in this repo). Seeding it into a real
// database would create admin accounts anyone can log into.
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
  console.error('Refusing to seed demo accounts with a public password in production.');
  console.error('Use `npm run create-admin` to create a real admin instead.');
  process.exit(1);
}

async function upsertUser({ name, email, role }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name, email, role`,
    [name, email, passwordHash, role]
  );
  return rows[0];
}

async function insertTicket({ customerName, customerPhone, customerEmail, eventName, eventDate, ticketType, quantity, createdBy, status }) {
  const ticketCode = generateTicketCode();
  const { rows } = await pool.query(
    `INSERT INTO tickets
       (ticket_code, qr_payload, customer_name, customer_phone, customer_email,
        event_name, event_date, ticket_type, quantity, created_by, status)
     VALUES ($1, '', $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, ticket_code`,
    [ticketCode, customerName, customerPhone, customerEmail, eventName, eventDate, ticketType, quantity, createdBy, status]
  );
  const { id, ticket_code: code } = rows[0];
  const qrPayload = createQrPayload(id, code);
  await pool.query('UPDATE tickets SET qr_payload = $2 WHERE id = $1', [id, qrPayload]);
  return id;
}

async function run() {
  console.log('Seeding database with development-only demo data...');

  const admin = await upsertUser({ name: 'Asha Admin', email: 'admin@demo.local', role: 'ADMIN' });
  const manager = await upsertUser({ name: 'Marcus Manager', email: 'manager@demo.local', role: 'MANAGER' });
  const worker1 = await upsertUser({ name: 'Wendy Worker', email: 'worker1@demo.local', role: 'WORKER' });
  const worker2 = await upsertUser({ name: 'Will Worker', email: 'worker2@demo.local', role: 'WORKER' });

  const today = new Date();
  const inDays = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  await insertTicket({
    customerName: 'Priya Sharma',
    customerPhone: '9876543210',
    customerEmail: 'priya@example.com',
    eventName: 'Autumn Music Festival',
    eventDate: inDays(10),
    ticketType: 'General',
    quantity: 2,
    createdBy: worker1.id,
    status: 'ACTIVE',
  });

  await insertTicket({
    customerName: 'Rahul Verma',
    customerPhone: '9812345678',
    customerEmail: 'rahul@example.com',
    eventName: 'Tech Conference 2026',
    eventDate: inDays(-2),
    ticketType: 'VIP',
    quantity: 1,
    createdBy: worker2.id,
    status: 'USED',
  });

  await insertTicket({
    customerName: 'Sara Khan',
    customerPhone: '9900112233',
    customerEmail: null,
    eventName: 'Autumn Music Festival',
    eventDate: inDays(10),
    ticketType: 'General',
    quantity: 4,
    createdBy: worker1.id,
    status: 'CANCELLED',
  });

  await insertTicket({
    customerName: 'David Lee',
    customerPhone: '9765432109',
    customerEmail: 'david@example.com',
    eventName: 'Comedy Night',
    eventDate: inDays(-30),
    ticketType: 'Standard',
    quantity: 1,
    createdBy: worker2.id,
    status: 'EXPIRED',
  });

  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, metadata) VALUES ($1, 'login', 'user', '{}')`,
    [admin.id]
  );
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, metadata) VALUES ($1, 'login', 'user', '{}')`,
    [manager.id]
  );

  console.log('Seed complete. Demo accounts (development only):');
  console.log(`  Admin:    admin@demo.local    / ${DEMO_PASSWORD}`);
  console.log(`  Manager:  manager@demo.local  / ${DEMO_PASSWORD}`);
  console.log(`  Worker 1: worker1@demo.local  / ${DEMO_PASSWORD}`);
  console.log(`  Worker 2: worker2@demo.local  / ${DEMO_PASSWORD}`);

  await pool.end();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
