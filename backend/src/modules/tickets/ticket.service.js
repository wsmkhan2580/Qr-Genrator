import { withTransaction } from '../../db/pool.js';
import {
  findTicketById,
  findTicketByCode,
  searchTickets,
  markTicketUsedAtomic,
  cancelTicketAtomic,
  getTicketStatusById,
  getStatusCounts,
  getTodayCount,
  getTicketsByDay,
  getTicketsByWorker,
  listAllForExport,
} from './ticket.repository.js';
import { generateTicketCode, createQrPayload, parseQrPayload } from '../../utils/ticketToken.js';
import { Errors } from '../../utils/errors.js';
import { recordAudit } from '../audit/audit.service.js';

const MAX_CODE_RETRIES = 5;

export async function createTicket(data, createdBy, req) {
  // Ticket codes are random but collisions are astronomically unlikely;
  // retry on the rare unique-constraint violation rather than trusting
  // uniqueness blindly.
  let lastError;
  for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt += 1) {
    const ticketCode = generateTicketCode();
    try {
      return await withTransaction(async (client) => {
        const inserted = await client.query(
          `INSERT INTO tickets
             (ticket_code, qr_payload, customer_name, customer_phone, customer_email,
              event_name, event_date, ticket_type, quantity, created_by)
           VALUES ($1,'',$2,$3,$4,$5,$6,$7,$8,$9)
           RETURNING id, ticket_code`,
          [
            ticketCode,
            data.customerName,
            data.customerPhone,
            data.customerEmail ?? null,
            data.eventName,
            data.eventDate,
            data.ticketType,
            data.quantity,
            createdBy,
          ]
        );
        const { id, ticket_code: code } = inserted.rows[0];
        const qrPayload = createQrPayload(id, code);
        await client.query('UPDATE tickets SET qr_payload = $2 WHERE id = $1', [id, qrPayload]);

        await recordAudit(
          {
            userId: createdBy,
            action: 'ticket_created',
            entityType: 'ticket',
            entityId: id,
            metadata: { ticketCode: code, eventName: data.eventName },
            req,
          },
          client
        );

        const full = await client.query('SELECT * FROM tickets WHERE id = $1', [id]);
        return mapRow(full.rows[0]);
      });
    } catch (err) {
      if (err.code === '23505') {
        // unique_violation on ticket_code - retry with a fresh code.
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? Errors.internal('Could not generate a unique ticket code.');
}

function mapRow(row) {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    validatedAt: row.validated_at,
    validatedBy: row.validated_by,
  };
}

export async function getTicket(id, requester) {
  const scopeToUserId = requester.role === 'WORKER' ? requester.id : undefined;
  const ticket = await findTicketById(id, { scopeToUserId });
  if (!ticket) throw Errors.notFound('Ticket not found.');
  return ticket;
}

export async function listTickets(filters, requester) {
  const scopeToUserId = requester.role === 'WORKER' ? requester.id : undefined;
  return searchTickets({ ...filters, scopeToUserId });
}

/**
 * Validates a ticket by human-entered code or scanned QR payload.
 * Steps mirror the spec: parse -> lookup -> status check -> atomic
 * transition -> audit log -> result. The UPDATE...WHERE status='ACTIVE'
 * in the repository is what actually prevents the race condition; this
 * function just interprets the outcome.
 */
export async function validateTicket(rawCode, worker, req) {
  const input = rawCode.trim();
  let ticket;

  const qrParsed = parseQrPayload(input);
  if (qrParsed) {
    ticket = await findTicketById(qrParsed.ticketId);
    if (ticket && ticket.ticketCode !== qrParsed.ticketCode) {
      // Signature matched but code mismatch would mean payload tampering.
      ticket = null;
    }
  } else {
    ticket = await findTicketByCode(input.toUpperCase());
  }

  if (!ticket) {
    await recordAudit({
      userId: worker.id,
      action: 'ticket_validate_failed',
      entityType: 'ticket',
      metadata: { reason: 'NOT_FOUND', input: input.slice(0, 40) },
      req,
    });
    throw Errors.notFound('Ticket not found. Check the code and try again.');
  }

  if (ticket.status !== 'ACTIVE') {
    await recordAudit({
      userId: worker.id,
      action: 'ticket_validate_failed',
      entityType: 'ticket',
      entityId: ticket.id,
      metadata: { reason: `ALREADY_${ticket.status}` },
      req,
    });
    const messages = {
      USED: 'This ticket has already been used.',
      CANCELLED: 'This ticket has been cancelled.',
      EXPIRED: 'This ticket has expired.',
    };
    throw Errors.conflict(messages[ticket.status] || 'Ticket cannot be validated.');
  }

  return withTransaction(async (client) => {
    const updated = await markTicketUsedAtomic(ticket.id, worker.id, client);
    if (!updated) {
      // Lost the race to another concurrent validation between our read
      // and the conditional update.
      await recordAudit(
        {
          userId: worker.id,
          action: 'ticket_validate_failed',
          entityType: 'ticket',
          entityId: ticket.id,
          metadata: { reason: 'RACE_LOST' },
          req,
        },
        client
      );
      throw Errors.conflict('This ticket was just validated by someone else.');
    }

    await recordAudit(
      {
        userId: worker.id,
        action: 'ticket_validated',
        entityType: 'ticket',
        entityId: ticket.id,
        metadata: { ticketCode: ticket.ticketCode },
        req,
      },
      client
    );

    return updated;
  });
}

export async function cancelTicket(id, requester, req) {
  const ticket = await getTicket(id, requester);
  if (ticket.status !== 'ACTIVE') {
    throw Errors.conflict('Only active tickets can be cancelled.');
  }
  return withTransaction(async (client) => {
    const updated = await cancelTicketAtomic(id, client);
    if (!updated) {
      // Lost a race: the ticket was validated/cancelled after our read.
      throw Errors.conflict('Only active tickets can be cancelled.');
    }
    await recordAudit(
      {
        userId: requester.id,
        action: 'ticket_cancelled',
        entityType: 'ticket',
        entityId: id,
        req,
      },
      client
    );
    return updated;
  });
}

export async function getAnalyticsOverview(requester) {
  const scopeToUserId = requester.role === 'WORKER' ? requester.id : undefined;
  const [counts, todayCount] = await Promise.all([
    getStatusCounts(scopeToUserId),
    getTodayCount(scopeToUserId),
  ]);
  const total = counts.ACTIVE + counts.USED + counts.CANCELLED + counts.EXPIRED;

  const base = { total, todayCount, ...counts };

  if (requester.role === 'WORKER') return base;

  const [byDay, byWorker] = await Promise.all([getTicketsByDay(14), getTicketsByWorker()]);
  return {
    ...base,
    ticketsByDay: byDay,
    ticketsByWorker: byWorker.map((w) => ({
      workerId: w.worker_id,
      workerName: w.worker_name,
      ticketCount: w.ticket_count,
    })),
  };
}

export async function exportTickets(requester) {
  const scopeToUserId = requester.role === 'WORKER' ? requester.id : undefined;
  return listAllForExport(scopeToUserId);
}

// Re-exported for controllers that need a raw status lookup (tests).
export { getTicketStatusById };
