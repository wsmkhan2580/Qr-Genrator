import { query } from '../../db/pool.js';

const SORT_COLUMNS = {
  createdAt: 'ticket.created_at',
  eventDate: 'ticket.event_date',
  customerName: 'ticket.customer_name',
  status: 'ticket.status',
};

function mapTicket(row) {
  if (!row) return null;
  return {
    id: row.id,
    ticketCode: row.ticket_code,
    qrPayload: row.qr_payload,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    eventName: row.event_name,
    eventDate: row.event_date,
    ticketType: row.ticket_type,
    quantity: row.quantity,
    status: row.status,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    validatedAt: row.validated_at,
    validatedBy: row.validated_by,
    validatedByName: row.validated_by_name,
  };
}

export async function insertTicket({
  ticketCode,
  qrPayload,
  customerName,
  customerPhone,
  customerEmail,
  eventName,
  eventDate,
  ticketType,
  quantity,
  createdBy,
}) {
  const { rows } = await query(
    `INSERT INTO tickets
       (ticket_code, qr_payload, customer_name, customer_phone, customer_email,
        event_name, event_date, ticket_type, quantity, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      ticketCode,
      qrPayload,
      customerName,
      customerPhone,
      customerEmail ?? null,
      eventName,
      eventDate,
      ticketType,
      quantity,
      createdBy,
    ]
  );
  return mapTicket(rows[0]);
}

export async function findTicketById(id, { scopeToUserId } = {}) {
  const params = [id];
  let clause = 'ticket.id = $1';
  if (scopeToUserId) {
    params.push(scopeToUserId);
    clause += ` AND ticket.created_by = $${params.length}`;
  }
  const { rows } = await query(
    `SELECT ticket.*, creator.name AS created_by_name, validator.name AS validated_by_name
     FROM tickets ticket
     LEFT JOIN users creator ON creator.id = ticket.created_by
     LEFT JOIN users validator ON validator.id = ticket.validated_by
     WHERE ${clause}`,
    params
  );
  return mapTicket(rows[0]);
}

export async function findTicketByCode(ticketCode) {
  const { rows } = await query(
    `SELECT ticket.*, creator.name AS created_by_name, validator.name AS validated_by_name
     FROM tickets ticket
     LEFT JOIN users creator ON creator.id = ticket.created_by
     LEFT JOIN users validator ON validator.id = ticket.validated_by
     WHERE ticket.ticket_code = $1`,
    [ticketCode]
  );
  return mapTicket(rows[0]);
}

/**
 * Searches/filters/paginates tickets. When scopeToUserId is provided
 * (workers), results are restricted to tickets that user created -
 * enforced here in SQL, not just hidden in the UI.
 */
export async function searchTickets({
  q,
  status,
  from,
  to,
  page,
  pageSize,
  sortBy,
  sortDir,
  scopeToUserId,
}) {
  const clauses = [];
  const params = [];

  if (scopeToUserId) {
    params.push(scopeToUserId);
    clauses.push(`ticket.created_by = $${params.length}`);
  }
  if (q) {
    // Escape LIKE wildcards so a search for "%" or "_" matches literally
    // instead of scanning/returning the whole table.
    params.push(`%${q.replace(/[\\%_]/g, '\\$&')}%`);
    const idx = params.length;
    clauses.push(
      `(ticket.ticket_code ILIKE $${idx} OR ticket.customer_name ILIKE $${idx} OR ticket.customer_phone ILIKE $${idx} OR ticket.customer_email ILIKE $${idx} OR ticket.event_name ILIKE $${idx})`
    );
  }
  if (status) {
    params.push(status);
    clauses.push(`ticket.status = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`ticket.event_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`ticket.event_date <= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sortColumn = SORT_COLUMNS[sortBy] || SORT_COLUMNS.createdAt;
  const direction = sortDir === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * pageSize;

  params.push(pageSize);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const [{ rows }, countResult] = await Promise.all([
    query(
      `SELECT ticket.*, creator.name AS created_by_name, validator.name AS validated_by_name
       FROM tickets ticket
       LEFT JOIN users creator ON creator.id = ticket.created_by
       LEFT JOIN users validator ON validator.id = ticket.validated_by
       ${where}
       ORDER BY ${sortColumn} ${direction}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    ),
    query(`SELECT COUNT(*)::int AS count FROM tickets ticket ${where}`, params.slice(0, -2)),
  ]);

  return { tickets: rows.map(mapTicket), total: countResult.rows[0].count };
}

/**
 * Atomically transitions a ticket from ACTIVE to USED using a
 * conditional UPDATE ... WHERE status = 'ACTIVE'. If two workers race to
 * validate the same ticket, only one UPDATE affects a row - the DB row
 * lock + condition makes this safe without an explicit SELECT ... FOR
 * UPDATE. Returns the updated row, or null if the ticket wasn't ACTIVE
 * (already used/cancelled/expired) or didn't exist.
 */
export async function markTicketUsedAtomic(ticketId, validatedByUserId, client) {
  const runner = client ?? { query };
  const { rows } = await runner.query(
    `UPDATE tickets
     SET status = 'USED', validated_at = now(), validated_by = $2
     WHERE id = $1 AND status = 'ACTIVE'
     RETURNING *`,
    [ticketId, validatedByUserId]
  );
  return mapTicket(rows[0]);
}

export async function getTicketStatusById(ticketId, client) {
  const runner = client ?? { query };
  const { rows } = await runner.query('SELECT * FROM tickets WHERE id = $1 FOR UPDATE', [ticketId]);
  return mapTicket(rows[0]);
}

export async function getStatusCounts(scopeToUserId) {
  const params = [];
  let where = '';
  if (scopeToUserId) {
    params.push(scopeToUserId);
    where = 'WHERE created_by = $1';
  }
  const { rows } = await query(
    `SELECT status, COUNT(*)::int AS count FROM tickets ${where} GROUP BY status`,
    params
  );
  const counts = { ACTIVE: 0, USED: 0, CANCELLED: 0, EXPIRED: 0 };
  rows.forEach((r) => {
    counts[r.status] = r.count;
  });
  return counts;
}

export async function getTodayCount(scopeToUserId) {
  const params = [];
  let where = "WHERE created_at >= date_trunc('day', now())";
  if (scopeToUserId) {
    params.push(scopeToUserId);
    where += ` AND created_by = $${params.length}`;
  }
  const { rows } = await query(`SELECT COUNT(*)::int AS count FROM tickets ${where}`, params);
  return rows[0].count;
}

export async function getTicketsByDay(days = 14) {
  const { rows } = await query(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
     FROM tickets
     WHERE created_at >= now() - make_interval(days => $1::int)
     GROUP BY 1 ORDER BY 1`,
    [days]
  );
  return rows;
}

export async function getTicketsByWorker() {
  const { rows } = await query(
    `SELECT u.id AS worker_id, u.name AS worker_name, COUNT(t.id)::int AS ticket_count
     FROM users u
     LEFT JOIN tickets t ON t.created_by = u.id
     WHERE u.role = 'WORKER'
     GROUP BY u.id, u.name
     ORDER BY ticket_count DESC`
  );
  return rows;
}

export async function updateTicketStatus(ticketId, status) {
  const { rows } = await query(
    `UPDATE tickets SET status = $2 WHERE id = $1 RETURNING *`,
    [ticketId, status]
  );
  return mapTicket(rows[0]);
}

/**
 * Cancels a ticket only if it is still ACTIVE, in a single statement.
 * Without the WHERE guard, a cancel racing a validation could overwrite a
 * USED ticket back to CANCELLED. Returns null when nothing was updated.
 */
export async function cancelTicketAtomic(ticketId, client) {
  const runner = client ?? { query };
  const { rows } = await runner.query(
    `UPDATE tickets SET status = 'CANCELLED' WHERE id = $1 AND status = 'ACTIVE' RETURNING *`,
    [ticketId]
  );
  return mapTicket(rows[0]);
}

export async function listAllForExport(scopeToUserId) {
  const params = [];
  let where = '';
  if (scopeToUserId) {
    params.push(scopeToUserId);
    where = 'WHERE ticket.created_by = $1';
  }
  const { rows } = await query(
    `SELECT ticket.*, creator.name AS created_by_name, validator.name AS validated_by_name
     FROM tickets ticket
     LEFT JOIN users creator ON creator.id = ticket.created_by
     LEFT JOIN users validator ON validator.id = ticket.validated_by
     ${where}
     ORDER BY ticket.created_at DESC`,
    params
  );
  return rows.map(mapTicket);
}
