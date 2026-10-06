import { query } from '../../db/pool.js';

/**
 * Records an audit entry. Accepts an optional `client` (a connected pg
 * client from a transaction) so audit writes can be committed atomically
 * alongside the action they describe, e.g. ticket validation.
 */
export async function recordAudit(
  { userId, action, entityType, entityId, metadata, req },
  client
) {
  const runner = client ?? { query };
  const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || null;
  const userAgent = req?.headers?.['user-agent'] || null;

  await runner.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, action, entityType, entityId ?? null, metadata ? JSON.stringify(metadata) : null, ipAddress, userAgent]
  );
}

export async function listRecentActivity(limit = 20) {
  const { rows } = await query(
    `SELECT al.id, al.action, al.entity_type, al.entity_id, al.metadata, al.created_at,
            u.name AS user_name, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    metadata: r.metadata,
    createdAt: r.created_at,
    userName: r.user_name,
    userEmail: r.user_email,
  }));
}
