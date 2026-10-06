import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import Button from './Button.jsx';
import { formatDate, formatDateTime } from '../utils/format.js';

export default function QRTicketCard({ ticket, qrImage, onDownload, onPrint }) {
  return (
    <div className="mx-auto max-w-md">
      <div
        id="printable-ticket"
        className="rounded-xl border border-ink-300 bg-white p-6 print:border-none print:p-0"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{ticket.eventName}</h2>
            <p className="text-sm text-ink-600">{formatDate(ticket.eventDate)}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-ink-500">Customer</dt>
            <dd className="font-medium text-ink-900">{ticket.customerName}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Ticket Type</dt>
            <dd className="font-medium text-ink-900">{ticket.ticketType}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Quantity</dt>
            <dd className="font-medium text-ink-900">{ticket.quantity}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Created</dt>
            <dd className="font-medium text-ink-900">{formatDateTime(ticket.createdAt)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-dashed border-ink-300 pt-6">
          {qrImage && (
            <img
              src={qrImage}
              alt={`QR code for ticket ${ticket.ticketCode}. Scan to validate at entry.`}
              className="h-48 w-48"
            />
          )}
          <p className="font-mono text-sm font-semibold tracking-wider text-ink-900">
            {ticket.ticketCode}
          </p>
        </div>
      </div>

      <div className="no-print mt-4 flex flex-wrap gap-2">
        <Button onClick={onDownload}>Download QR</Button>
        <Button variant="secondary" onClick={onPrint}>
          Print ticket
        </Button>
      </div>
    </div>
  );
}
