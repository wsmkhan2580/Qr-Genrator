import { query } from '../../db/pool.js';

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findUserByEmail(email) {
  const { rows } = await query(
    `SELECT id, name, email, password_hash, role, is_active, created_at, updated_at
     FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );
  if (!rows[0]) return null;
  return {
    ...mapUser(rows[0]),
    passwordHash: rows[0].password_hash,
  };
}

export async function findUserById(id) {
  const { rows } = await query(
    `SELECT id, name, email, role, is_active, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  return mapUser(rows[0]);
}

export async function createUser({ name, email, passwordHash, role }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at, updated_at`,
    [name, email.toLowerCase(), passwordHash, role]
  );
  return mapUser(rows[0]);
}

export async function listUsers({ page, pageSize }) {
  const offset = (page - 1) * pageSize;
  const [{ rows }, countResult] = await Promise.all([
    query(
      `SELECT id, name, email, role, is_active, created_at, updated_at
       FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
    query('SELECT COUNT(*)::int AS count FROM users'),
  ]);
  return { users: rows.map(mapUser), total: countResult.rows[0].count };
}

export async function updateUser(id, { name, role, isActive }) {
  const { rows } = await query(
    `UPDATE users SET
       name = COALESCE($2, name),
       role = COALESCE($3, role),
       is_active = COALESCE($4, is_active)
     WHERE id = $1
     RETURNING id, name, email, role, is_active, created_at, updated_at`,
    [id, name ?? null, role ?? null, isActive ?? null]
  );
  return mapUser(rows[0]);
}
